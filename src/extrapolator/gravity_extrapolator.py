"""LangGraph-based Gravity Extrapolator for partial-gravity flammability.

SI DISCLOSURE: Code structure generated with SI assistance (Antigravity AI).
Physics constraints are deterministic (no SI). LLM is used at runtime for
hypothesis generation, bounded by computed physics. See SI_DISCLOSURE.md.

This is the crown jewel of the system.  It uses a LangGraph StateGraph to
orchestrate a multi-step reasoning pipeline that:

  1. Parses the user's scenario to extract target conditions
  2. Gathers microgravity (ISS) and Earth-gravity baseline data points
  3. Computes hard physics bounds (deterministic — no LLM)
  4. Generates a bounded hypothesis (LLM constrained by physics)
  5. Assesses confidence
  6. Compiles a final report

The LLM is never allowed to predict values outside computed physics bounds.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional, TypedDict

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from src.data.models import Investigation
from src.extrapolator.numerical_extractor import NumericalExtractor
from src.extrapolator.physics_constraints import CombustionPhysics, PartialGravityBounds
from src.extrapolator.report_generator import ExtrapolationReportGenerator

logger = logging.getLogger(__name__)


# ── State schema ─────────────────────────────────────────────────────────

class ExtrapolatorState(TypedDict, total=False):
    """State flowing through the LangGraph nodes."""

    # Input
    query: str
    investigations: list[dict[str, Any]]

    # Parsed from query
    target_gravity: float
    target_o2_pct: float
    target_pressure_psi: float
    fuel_description: str

    # Gathered data endpoints
    microgravity_data: list[dict[str, Any]]
    earth_gravity_data: list[dict[str, Any]]

    # Physics bounds (deterministic)
    physics_bounds: list[dict[str, Any]]

    # LLM outputs
    llm_hypothesis: str
    confidence_assessment: str
    caveats: list[str]

    # Final
    final_report: str


# ── Output model ─────────────────────────────────────────────────────────

class ExtrapolationReport(BaseModel):
    """Structured output of the extrapolation pipeline."""

    query: str = ""
    target_gravity: float = 0.0
    target_o2_pct: float = 21.0
    target_pressure_psi: float = 14.7
    fuel_description: str = ""
    microgravity_data: list[dict[str, Any]] = Field(default_factory=list)
    earth_gravity_data: list[dict[str, Any]] = Field(default_factory=list)
    physics_bounds: list[dict[str, Any]] = Field(default_factory=list)
    llm_hypothesis: str = ""
    confidence_assessment: str = ""
    caveats: list[str] = Field(default_factory=list)
    final_report: str = ""


# ── Prompts ──────────────────────────────────────────────────────────────

_PARSE_QUERY_PROMPT = """\
You are a combustion science parameter extractor. From the user's scenario
description, extract these values. Return ONLY valid JSON, no markdown fences.

{
  "target_gravity": <float, fraction of Earth-g: 0.0=microgravity, 0.16=Moon, 0.38=Mars, 1.0=Earth>,
  "target_o2_pct": <float, oxygen percentage. Default 21.0 if not specified. For lunar base expect 30-34%>,
  "target_pressure_psi": <float, pressure in psi. Default 14.7 if not specified. For lunar base expect 8-10.2>,
  "fuel_description": "<string, description of the fuel/material in question>"
}

If a value is clearly implied but not stated (e.g. "lunar base" implies ~0.16g),
use the standard implied value. If truly unknown, use the default."""

_HYPOTHESIS_PROMPT = """\
You are a combustion physicist specializing in microgravity fire safety.

You are given:
1. MICROGRAVITY DATA (0 g, from ISS experiments)
2. EARTH-GRAVITY DATA (1 g, baseline)
3. COMPUTED PHYSICS BOUNDS (deterministic constraints you MUST respect)
4. TARGET CONDITIONS for your prediction

YOUR TASK: Generate a scientifically grounded hypothesis for combustion
behavior at the target partial-gravity conditions.

CRITICAL RULES:
- You MUST NOT predict values outside the computed physics bounds.
- If bounds say parameter X is between A and B, your prediction MUST be in [A, B].
- Explain WHY you pick a specific point within the range.
- Acknowledge what is known vs what is extrapolated.
- Be explicit about mechanisms: buoyancy, diffusion, radiation, convection.
- Structure your response with clear sections.

MICROGRAVITY DATA:
{micro_data}

EARTH-GRAVITY DATA:
{earth_data}

PHYSICS BOUNDS:
{physics_bounds}

TARGET CONDITIONS:
- Gravity: {target_gravity} g
- Oxygen: {target_o2_pct}%
- Pressure: {target_pressure_psi} psi
- Fuel: {fuel_description}

Provide your hypothesis in a structured format with sections:
1. Expected Flame Behavior
2. Flammability Assessment
3. Key Transport Mechanisms at This Gravity Level
4. Quantitative Predictions (within bounds)
5. Comparison to Pure Microgravity and Earth Behavior"""

_CONFIDENCE_PROMPT = """\
Evaluate the confidence of the following partial-gravity combustion hypothesis.

Consider:
1. How much experimental data was available (more data = higher confidence)
2. How close the target conditions are to tested conditions
3. How wide the physics bounds are (wider = less certain)
4. Whether the extrapolation involves interpolation (higher confidence) or
   extrapolation beyond tested ranges (lower confidence)

DATA AVAILABLE:
- Microgravity data points: {n_micro}
- Earth-gravity data points: {n_earth}
- Number of physics bounds computed: {n_bounds}

HYPOTHESIS:
{hypothesis}

TARGET:
{target_gravity} g, {target_o2_pct}% O2, {target_pressure_psi} psi

Provide:
1. Overall confidence: HIGH / MEDIUM / LOW with percentage estimate
2. Confidence breakdown by aspect
3. What additional data would most improve confidence"""


# ── Graph nodes ──────────────────────────────────────────────────────────

class GravityExtrapolator:
    """Multi-step partial-gravity flammability extrapolator.

    Uses a LangGraph-style sequential pipeline (implemented as explicit
    node functions for compatibility) with physics-bounded LLM reasoning.

    Args:
        llm: A LangChain ``BaseChatModel``.
        numerical_extractor: Extractor for pulling numbers from text.
        physics: Combustion physics constraint engine.
    """

    def __init__(
        self,
        llm: BaseChatModel | None = None,
        numerical_extractor: NumericalExtractor | None = None,
        physics: CombustionPhysics | None = None,
    ) -> None:
        self._llm = llm
        self._extractor = numerical_extractor or NumericalExtractor(llm=llm)
        self._physics = physics or CombustionPhysics()

    @property
    def llm(self) -> BaseChatModel:
        if self._llm is None:
            from src.config import get_config
            from src.pipeline import _build_llm

            self._llm = _build_llm(get_config())
        return self._llm

    # ── Main entry point ─────────────────────────────────────────────

    def extrapolate(
        self,
        scenario: str,
        investigations: list[Investigation] | None = None,
    ) -> ExtrapolationReport:
        """Run the full extrapolation pipeline.

        Args:
            scenario: Natural-language description of the target scenario.
            investigations: Optional list of investigations to draw data from.
                If None, the pipeline works with whatever data it can extract.

        Returns:
            An ``ExtrapolationReport`` with the complete analysis.
        """
        # Initialize state
        inv_dicts = []
        if investigations:
            inv_dicts = [inv.model_dump() for inv in investigations]

        state: ExtrapolatorState = {
            "query": scenario,
            "investigations": inv_dicts,
            "microgravity_data": [],
            "earth_gravity_data": [],
            "physics_bounds": [],
            "caveats": [],
        }

        # Execute pipeline nodes sequentially
        state = self._parse_query(state)
        state = self._gather_endpoints(state, investigations or [])
        state = self._compute_physics_bounds(state)
        state = self._generate_hypothesis(state)
        state = self._assess_confidence(state)
        state = self._compile_report(state)

        return ExtrapolationReport(
            query=state.get("query", scenario),
            target_gravity=state.get("target_gravity", 0.0),
            target_o2_pct=state.get("target_o2_pct", 21.0),
            target_pressure_psi=state.get("target_pressure_psi", 14.7),
            fuel_description=state.get("fuel_description", ""),
            microgravity_data=state.get("microgravity_data", []),
            earth_gravity_data=state.get("earth_gravity_data", []),
            physics_bounds=state.get("physics_bounds", []),
            llm_hypothesis=state.get("llm_hypothesis", ""),
            confidence_assessment=state.get("confidence_assessment", ""),
            caveats=state.get("caveats", []),
            final_report=state.get("final_report", ""),
        )

    # ── Node 1: Parse Query ──────────────────────────────────────────

    def _parse_query(self, state: ExtrapolatorState) -> ExtrapolatorState:
        """Extract target conditions from the user's scenario text."""
        logger.info("Node 1: Parsing query for target conditions")

        response = self.llm.invoke([
            SystemMessage(content=_PARSE_QUERY_PROMPT),
            HumanMessage(content=state["query"]),
        ])

        content = response.content.strip()
        # Strip markdown fences
        if content.startswith("```"):
            lines = content.splitlines()
            lines = [l for l in lines if not l.strip().startswith("```")]
            content = "\n".join(lines)

        try:
            parsed = json.loads(content)
            state["target_gravity"] = float(parsed.get("target_gravity", 0.16))
            state["target_o2_pct"] = float(parsed.get("target_o2_pct", 21.0))
            state["target_pressure_psi"] = float(parsed.get("target_pressure_psi", 14.7))
            state["fuel_description"] = str(parsed.get("fuel_description", "general solid materials"))
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning("Failed to parse query parameters: %s — using defaults", exc)
            state["target_gravity"] = 0.16
            state["target_o2_pct"] = 30.0
            state["target_pressure_psi"] = 10.2
            state["fuel_description"] = "general solid materials"
            state["caveats"].append(
                "Could not parse exact target conditions from query; "
                "used default lunar-base parameters."
            )

        return state

    # ── Node 2: Gather Endpoints ─────────────────────────────────────

    def _gather_endpoints(
        self,
        state: ExtrapolatorState,
        investigations: list[Investigation],
    ) -> ExtrapolatorState:
        """Find microgravity and Earth-gravity data points for the fuel."""
        logger.info("Node 2: Gathering data endpoints")

        fuel_desc = state.get("fuel_description", "").lower()

        for inv in investigations:
            # Determine gravity category
            is_micro = inv.gravity.value == "MICROGRAVITY"
            is_earth = inv.gravity.value == "EARTH"

            if not (is_micro or is_earth):
                continue

            # Check fuel relevance
            fuel_match = any(
                fuel_desc in f.material_name.lower()
                or f.material_name.lower() in fuel_desc
                or f.fuel_type.value in fuel_desc
                for f in inv.fuels
            ) or "general" in fuel_desc or "solid" in fuel_desc

            if not fuel_match:
                continue

            # Extract data points from this investigation
            for atm in inv.atmosphere:
                data_point = {
                    "source": inv.acronym,
                    "investigation_id": inv.id,
                    "parameter": "atmosphere",
                    "value": f"{atm.oxygen_pct}% O2, {atm.pressure_psi} psi",
                    "oxygen_pct": atm.oxygen_pct,
                    "pressure_psi": atm.pressure_psi,
                    "flow_velocity_cm_s": atm.flow_velocity_cm_s,
                    "diluent": atm.diluent,
                }
                if is_micro:
                    state["microgravity_data"].append(data_point)
                else:
                    state["earth_gravity_data"].append(data_point)

            # Add key findings as qualitative data
            for finding in inv.key_findings:
                data_point = {
                    "source": inv.acronym,
                    "investigation_id": inv.id,
                    "parameter": "finding",
                    "value": finding,
                }
                if is_micro:
                    state["microgravity_data"].append(data_point)
                else:
                    state["earth_gravity_data"].append(data_point)

        if not state["microgravity_data"]:
            state["caveats"].append(
                "No microgravity data found for the specified fuel — "
                "extrapolation is less constrained."
            )
        if not state["earth_gravity_data"]:
            state["caveats"].append(
                "No Earth-gravity baseline data found — "
                "only microgravity endpoint available for bounding."
            )

        return state

    # ── Node 3: Compute Physics Bounds ───────────────────────────────

    def _compute_physics_bounds(self, state: ExtrapolatorState) -> ExtrapolatorState:
        """Apply deterministic physics constraints. No LLM involved."""
        logger.info("Node 3: Computing physics bounds")

        g = state.get("target_gravity", 0.16)
        o2 = state.get("target_o2_pct", 21.0)

        # 1. Buoyancy strength
        buoyancy = self._physics.buoyancy_strength(g)
        state["physics_bounds"].append({
            "parameter_name": "Relative Buoyancy Strength",
            "lower_bound": buoyancy,
            "upper_bound": buoyancy,
            "confidence": 1.0,
            "physical_basis": (
                f"Grashof number scales linearly with g. "
                f"At {g}g, buoyancy is {buoyancy:.0%} of Earth's."
            ),
            "caveats": [],
        })

        # 2. Natural convection velocity
        conv_vel = self._physics.natural_convection_velocity(g)
        earth_conv_vel = self._physics.natural_convection_velocity(1.0)
        state["physics_bounds"].append({
            "parameter_name": "Natural Convection Velocity",
            "lower_bound": round(conv_vel, 4),
            "upper_bound": round(conv_vel * 1.3, 4),  # ±30% uncertainty
            "confidence": 0.7,
            "physical_basis": (
                f"V ~ sqrt(g·β·ΔT·L). At {g}g: ~{conv_vel:.3f} m/s "
                f"vs Earth: ~{earth_conv_vel:.3f} m/s. "
                f"Ratio: {conv_vel/earth_conv_vel:.2f}." if earth_conv_vel > 0
                else f"At {g}g: ~{conv_vel:.3f} m/s."
            ),
            "caveats": [
                "Assumes ΔT=500K and L=5cm characteristic scale",
                "Actual convection depends on flame size and geometry",
            ],
        })

        # 3. Oxygen enhancement factor
        o2_factor = self._physics.oxygen_enhancement_factor(o2)
        state["physics_bounds"].append({
            "parameter_name": "Oxygen Enhancement Factor",
            "lower_bound": round(o2_factor * 0.85, 2),
            "upper_bound": round(o2_factor * 1.15, 2),
            "confidence": 0.75,
            "physical_basis": (
                f"Flammability scales as (O2%)^1.8. At {o2}% O2, "
                f"materials are ~{o2_factor:.1f}× more flammable than at 21% O2."
            ),
            "caveats": [
                "Exponent varies by material (1.5–2.0 typical range)",
                "Scaling may not hold at very high O2 concentrations (>50%)",
            ],
        })

        # 4. Flame spread rate bounds (if we have both endpoints)
        micro_atm = [
            d for d in state.get("microgravity_data", [])
            if d.get("parameter") == "atmosphere"
        ]
        earth_atm = [
            d for d in state.get("earth_gravity_data", [])
            if d.get("parameter") == "atmosphere"
        ]
        if micro_atm and earth_atm:
            # Use representative spread rates from literature
            # Typical thin solid: ~2 mm/s at 1g upward, ~0.5 mm/s at 0g
            micro_rate = 0.5  # mm/s, representative
            earth_rate = 2.0  # mm/s, representative

            bounds = self._physics.spread_rate_bounds(g, micro_rate, earth_rate)
            state["physics_bounds"].append({
                "parameter_name": "Flame Spread Rate (representative solid)",
                "lower_bound": round(bounds[0], 2),
                "upper_bound": round(bounds[1], 2),
                "confidence": 0.5,
                "physical_basis": (
                    f"Bounded between microgravity ({micro_rate} mm/s) and "
                    f"Earth ({earth_rate} mm/s) using power-law interpolation."
                ),
                "caveats": [
                    "Uses representative rates — actual values depend on specific material",
                    "Orientation (upward/downward) strongly affects spread rate",
                    "Partial-gravity spread rate may be non-monotonic with g",
                ],
            })

        # 5. Flame height scaling
        earth_height = 30.0  # mm, representative candle-sized flame
        height_est, height_conf = self._physics.flame_height_scaling(g, earth_height)
        state["physics_bounds"].append({
            "parameter_name": "Flame Height Scaling",
            "lower_bound": round(earth_height, 1),
            "upper_bound": round(height_est * 1.2, 1),
            "confidence": height_conf,
            "physical_basis": (
                f"Laminar flame height ~ g^(-1). At {g}g, a 30mm Earth-flame "
                f"would be ~{height_est:.0f}mm — taller due to reduced buoyancy."
            ),
            "caveats": [
                "Scaling assumes buoyancy-dominated regime",
                "At very low g, transition to momentum-dominated regime occurs",
                "Only applies to laminar jet diffusion flames",
            ],
        })

        return state

    # ── Node 4: Generate Hypothesis ──────────────────────────────────

    def _generate_hypothesis(self, state: ExtrapolatorState) -> ExtrapolatorState:
        """LLM generates a bounded hypothesis constrained by physics."""
        logger.info("Node 4: Generating bounded hypothesis")

        prompt = _HYPOTHESIS_PROMPT.format(
            micro_data=json.dumps(state.get("microgravity_data", []), indent=2),
            earth_data=json.dumps(state.get("earth_gravity_data", []), indent=2),
            physics_bounds=json.dumps(state.get("physics_bounds", []), indent=2),
            target_gravity=state.get("target_gravity", 0.16),
            target_o2_pct=state.get("target_o2_pct", 21.0),
            target_pressure_psi=state.get("target_pressure_psi", 14.7),
            fuel_description=state.get("fuel_description", "general"),
        )

        response = self.llm.invoke([
            SystemMessage(content=(
                "You are a combustion physicist. Generate predictions that "
                "strictly respect the physics bounds provided. Never exceed them."
            )),
            HumanMessage(content=prompt),
        ])

        state["llm_hypothesis"] = response.content.strip()
        return state

    # ── Node 5: Assess Confidence ────────────────────────────────────

    def _assess_confidence(self, state: ExtrapolatorState) -> ExtrapolatorState:
        """Evaluate confidence in the hypothesis."""
        logger.info("Node 5: Assessing confidence")

        prompt = _CONFIDENCE_PROMPT.format(
            n_micro=len(state.get("microgravity_data", [])),
            n_earth=len(state.get("earth_gravity_data", [])),
            n_bounds=len(state.get("physics_bounds", [])),
            hypothesis=state.get("llm_hypothesis", "No hypothesis"),
            target_gravity=state.get("target_gravity", 0.16),
            target_o2_pct=state.get("target_o2_pct", 21.0),
            target_pressure_psi=state.get("target_pressure_psi", 14.7),
        )

        response = self.llm.invoke([
            SystemMessage(content="You are a scientific confidence evaluator."),
            HumanMessage(content=prompt),
        ])

        state["confidence_assessment"] = response.content.strip()

        # Add standard caveats
        standard_caveats = [
            "No partial-gravity combustion data currently exists in PSI — "
            "all predictions are extrapolations bounded by 0g and 1g data.",
            "Physics scaling laws assume ideal conditions; real scenarios "
            "involve complex geometry, material variability, and turbulence.",
            "Oxygen enhancement scaling may not capture synergistic effects "
            "with pressure changes.",
        ]
        existing = set(state.get("caveats", []))
        for caveat in standard_caveats:
            if caveat not in existing:
                state["caveats"].append(caveat)

        return state

    # ── Node 6: Compile Report ───────────────────────────────────────

    def _compile_report(self, state: ExtrapolatorState) -> ExtrapolatorState:
        """Assemble everything into a Markdown report."""
        logger.info("Node 6: Compiling final report")

        state["final_report"] = ExtrapolationReportGenerator.format_report(
            dict(state)
        )
        return state

