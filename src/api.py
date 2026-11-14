"""FastAPI application for the NASA Fire Safety Intelligence Engine.

Provides RESTful endpoints for investigation exploration, scenario
analysis, cross-investigation comparison, and partial-gravity
extrapolation.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from src.config import Config, get_config
from src.data.chunking import ScientificChunker
from src.data.psi_knowledge_base import PSIKnowledgeBase
from src.knowledge.graph import InvestigationGraph
from src.extrapolator.physics_constraints import CombustionPhysics

load_dotenv()
logger = logging.getLogger(__name__)

# ── Global state ─────────────────────────────────────────────────────────

_kb: PSIKnowledgeBase | None = None
_chunker: ScientificChunker | None = None
_graph: InvestigationGraph | None = None
_physics: CombustionPhysics | None = None
_pipeline: Any = None  # Full pipeline (requires API key)


# ── Lifespan ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise the knowledge base, graph, and (optionally) the full
    LLM pipeline on startup."""
    global _kb, _chunker, _graph, _physics, _pipeline

    logger.info("Initialising core components …")
    _kb = PSIKnowledgeBase()
    _chunker = ScientificChunker()
    _graph = InvestigationGraph()
    _graph.build(_kb.get_all())
    _physics = CombustionPhysics()
    logger.info(
        "Core ready — %d investigations, %d graph edges",
        len(_kb.get_all()),
        _graph._graph.number_of_edges(),
    )

    # Try to initialise the full LLM pipeline if an API key is present
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key and api_key != "test-key-for-import-check":
        try:
            from src.pipeline import NASAFireSafetyPipeline
            _pipeline = NASAFireSafetyPipeline()
            _pipeline.initialize()
            logger.info("Full LLM pipeline initialised.")
        except Exception as exc:
            logger.warning("LLM pipeline failed to initialise: %s", exc)
            _pipeline = None
    else:
        logger.info(
            "No API key found — running in data-only mode. "
            "Set OPENAI_API_KEY or GOOGLE_API_KEY for LLM features."
        )

    yield  # App runs

    logger.info("Shutting down.")


# ── App ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NASA Fire Safety Intelligence Engine",
    description=(
        "SI-powered API for exploring NASA PSI combustion science "
        "investigations and extracting fire safety insights for human "
        "space exploration (Moon, Mars, spacecraft, rovers)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ───────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(..., description="Natural language question about fire safety research")


class ScenarioRequest(BaseModel):
    scenario: str = Field(
        ...,
        description="Description of a fire scenario, e.g. 'Lunar base at 34% O2, 10.2 psi, solid polymer materials'",
    )


class CompareRequest(BaseModel):
    investigation_ids: list[str] = Field(
        ...,
        min_length=2,
        max_length=5,
        description="List of investigation IDs to compare (2-5)",
    )


class ExtrapolateRequest(BaseModel):
    scenario: str = Field(
        ...,
        description="Partial-gravity scenario to extrapolate, e.g. 'Fire behavior on lunar surface with 34% O2'",
    )


class PhysicsBoundsRequest(BaseModel):
    gravity_g: float = Field(..., ge=0.0, le=1.0, description="Gravity level as fraction of Earth-g")
    o2_pct: float = Field(default=21.0, ge=0.0, le=100.0, description="Oxygen percentage")
    pressure_psi: float = Field(default=14.7, gt=0.0, description="Pressure in psi")


# ── Data-only endpoints (no API key required) ────────────────────────────

@app.get("/", tags=["health", "dashboard"])
async def root(request: Request):
    """Serve the interactive web dashboard to browsers, JSON status to API clients."""
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        static_file = os.path.join(os.path.dirname(__file__), "static", "index.html")
        if os.path.exists(static_file):
            return FileResponse(static_file, media_type="text/html")

    return {
        "status": "online",
        "engine": "NASA Fire Safety Intelligence Engine",
        "investigations_loaded": len(_kb.get_all()) if _kb else 0,
        "llm_available": _pipeline is not None,
        "mode": "full" if _pipeline else "data-only",
    }


@app.get("/dashboard", tags=["dashboard"], response_class=FileResponse)
async def dashboard():
    """Explicit endpoint to serve the interactive web dashboard."""
    static_file = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if not os.path.exists(static_file):
        raise HTTPException(status_code=404, detail="Dashboard index.html not found.")
    return FileResponse(static_file, media_type="text/html")


@app.get("/investigations", tags=["investigations"])
async def list_investigations(
    pillar: Optional[str] = Query(None, description="Filter by fire safety pillar: PREVENTION, DETECTION, SUPPRESSION"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type: solid, liquid, gas"),
    hardware: Optional[str] = Query(None, description="Filter by hardware facility"),
    min_relevance: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum crew habitat relevance"),
):
    """List all investigations with optional filtering."""
    investigations = _kb.get_all()

    if pillar:
        investigations = [i for i in investigations if i.fire_safety_pillar.value == pillar.upper()]
    if fuel_type:
        investigations = [
            i for i in investigations
            if any(f.fuel_type.value == fuel_type.lower() for f in i.fuels)
        ]
    if hardware:
        investigations = [
            i for i in investigations
            if hardware.lower() in i.hardware_facility.lower()
        ]
    if min_relevance is not None:
        investigations = [i for i in investigations if i.relevance_to_crew_habitat >= min_relevance]

    return {
        "count": len(investigations),
        "investigations": [_inv_summary(inv) for inv in investigations],
    }


@app.get("/investigations/{investigation_id}", tags=["investigations"])
async def get_investigation(investigation_id: str):
    """Get full details of a single investigation."""
    inv = _kb.get_by_id(investigation_id)
    if inv is None:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found")
    return inv.model_dump()


@app.get("/investigations/{investigation_id}/related", tags=["investigations"])
async def get_related(
    investigation_id: str,
    max_hops: int = Query(default=1, ge=1, le=3, description="Maximum traversal depth"),
):
    """Get investigations related to the given one via the knowledge graph."""
    inv = _kb.get_by_id(investigation_id)
    if inv is None:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found")

    edges = _graph.get_related(investigation_id, max_hops=max_hops)
    hw_group = _graph.get_shared_hardware_group(investigation_id)

    return {
        "investigation_id": investigation_id,
        "name": inv.name,
        "relationships": [
            {"source": s, "target": t, "type": d.get("type"), "detail": d.get("detail")}
            for s, t, d in edges
        ],
        "hardware_group": hw_group,
    }


@app.get("/investigations/{inv1}/compare/{inv2}", tags=["investigations"])
async def explain_relationship(inv1: str, inv2: str):
    """Explain how two investigations are related."""
    for iid in (inv1, inv2):
        if _kb.get_by_id(iid) is None:
            raise HTTPException(status_code=404, detail=f"Investigation '{iid}' not found")
    return {"explanation": _graph.explain_relationship(inv1, inv2)}


@app.post("/physics/bounds", tags=["physics"])
async def compute_physics_bounds(req: PhysicsBoundsRequest):
    """Compute deterministic physics bounds for a given gravity/O2/pressure.

    This does NOT require an API key — it's pure physics computation.
    """
    g = req.gravity_g
    o2 = req.o2_pct
    p = req.pressure_psi

    buoyancy = _physics.buoyancy_strength(g)
    conv_vel = _physics.natural_convection_velocity(g)
    p_o2 = _physics.oxygen_partial_pressure_psi(p, o2)
    o2_factor = _physics.oxygen_enhancement_factor(o2, pressure_psi=p)
    flame_height, flame_conf = _physics.flame_height_scaling(g, 30.0)
    spread_lo, spread_hi = _physics.spread_rate_bounds(g, 0.5, 2.0)
    quiescent = _physics.quiescent_extinction_check(g)

    # Determine oxygen regime relative to Earth sea level (3.09 psi)
    if p_o2 > 3.6:
        o2_regime = "HYPEROXIC (Elevated Flammability Risk)"
    elif p_o2 < 2.5:
        o2_regime = "HYPOXIC (Oxygen Deprived)"
    else:
        o2_regime = "NORMOXIC (Earth-Equivalent Metabolism)"

    return {
        "target": {"gravity_g": g, "o2_pct": o2, "pressure_psi": p},
        "bounds": {
            "buoyancy_strength": {
                "value": round(buoyancy, 4),
                "description": f"Buoyancy is {buoyancy:.0%} of Earth's",
            },
            "natural_convection_velocity_m_s": {
                "value": round(conv_vel, 4),
                "earth_baseline": round(_physics.natural_convection_velocity(1.0), 4),
            },
            "oxygen_partial_pressure_psi": {
                "value": round(p_o2, 2),
                "earth_baseline_psi": 3.09,
                "regime": o2_regime,
            },
            "oxygen_enhancement_factor": {
                "value": round(o2_factor, 2),
                "description": f"Materials are ~{o2_factor:.2f}x more flammable based on partial pressure",
            },
            "flame_height_scaling": {
                "estimated_mm": round(flame_height, 1),
                "confidence": flame_conf,
                "earth_baseline_mm": 30.0,
                "regime": "Spherical / diffusion-bounded" if g < 0.02 else "Roper buoyancy-governed",
            },
            "flame_spread_rate_mm_s": {
                "lower_bound": round(spread_lo, 2),
                "upper_bound": round(spread_hi, 2),
                "note": "Representative solid fuel, horizontal orientation",
            },
            "quiescent_extinction": quiescent,
        },
    }


@app.get("/graph/summary", tags=["graph"])
async def graph_summary():
    """Get an overview of the knowledge graph."""
    return {
        "nodes": _graph._graph.number_of_nodes(),
        "edges": _graph._graph.number_of_edges(),
        "investigations": [
            {"id": n, **_graph._graph.nodes[n]}
            for n in _graph._graph.nodes
        ],
    }


# ── LLM-powered endpoints (require API key) ─────────────────────────────

def _require_pipeline():
    if _pipeline is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "LLM pipeline not available. Set OPENAI_API_KEY or "
                "GOOGLE_API_KEY environment variable and restart."
            ),
        )
    return _pipeline


@app.post("/query", tags=["analysis"])
def query(req: QueryRequest):
    """Ask a natural language question about fire safety research.

    Routes to the appropriate chain (summary, comparison, scenario,
    extrapolation) based on intent detection.
    """
    pipeline = _require_pipeline()
    try:
        result = pipeline.query(req.question)
        return result
    except Exception as exc:
        logger.error("Query execution failed: %s", exc)
        return {
            "answer": f"Analysis encountered a temporary error: {exc}. Please retry your scenario.",
            "intent": "ERROR",
            "sources": [],
        }


@app.post("/scenario", tags=["analysis"])
def scenario_analysis(req: ScenarioRequest):
    """Full scenario analysis: retrieve, rank, compare, and extrapolate.

    Best for questions like: "What do we know about fire in a lunar
    habitat at 34% O2 and 10.2 psi?"
    """
    pipeline = _require_pipeline()
    result = pipeline.get_scenario_analysis(req.scenario)
    return result


@app.post("/compare", tags=["analysis"])
def compare_investigations(req: CompareRequest):
    """Cross-investigation comparison using LLM synthesis.

    Provide 2-5 investigation IDs to compare their experimental
    conditions, hardware, findings, and identify gaps.
    """
    pipeline = _require_pipeline()
    for iid in req.investigation_ids:
        if _kb.get_by_id(iid) is None:
            raise HTTPException(status_code=404, detail=f"Investigation '{iid}' not found")
    result = pipeline.compare_investigations(req.investigation_ids)
    return result


@app.post("/extrapolate", tags=["analysis"])
def extrapolate(req: ExtrapolateRequest):
    """Partial-gravity flammability extrapolation.

    Uses physics-bounded LLM reasoning to predict combustion behavior
    at Moon/Mars gravity from ISS (0g) and Earth (1g) data endpoints.
    """
    pipeline = _require_pipeline()
    result = pipeline.extrapolate_partial_gravity(req.scenario)
    return result


# ── Helpers ──────────────────────────────────────────────────────────────

def _inv_summary(inv) -> dict:
    """Compact summary of an investigation for list views."""
    o2_values = [a.oxygen_pct for a in inv.atmosphere]
    return {
        "id": inv.id,
        "name": inv.name,
        "acronym": inv.acronym,
        "project": inv.project,
        "hardware": inv.hardware_facility,
        "hardware_facility": inv.hardware_facility,
        "pillar": inv.fire_safety_pillar.value,
        "fire_safety_pillar": inv.fire_safety_pillar.value,
        "gravity": inv.gravity.value,
        "relevance": inv.relevance_to_crew_habitat,
        "relevance_to_crew_habitat": inv.relevance_to_crew_habitat,
        "fuels": [f.model_dump() for f in inv.fuels],
        "fuel_types": sorted({f.fuel_type.value for f in inv.fuels}),
        "o2_range": f"{min(o2_values)}-{max(o2_values)}%" if o2_values else "N/A",
    }


# ── Entry point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    import sys
    import os

    # Ensure project root is importable
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    logging.basicConfig(level=logging.INFO)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("src.api:app", host="0.0.0.0", port=port)
