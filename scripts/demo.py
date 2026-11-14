#!/usr/bin/env python3
"""NASA Fire Safety Intelligence Engine — Interactive Demo.

Run with:  python scripts/demo.py

This script demonstrates all pipeline components that work WITHOUT an
API key (knowledge base, chunking, graph, physics).  When an OPENAI_API_KEY
is set, it also runs the LLM-powered chains (summarisation, comparison,
scenario analysis, partial-gravity extrapolation).
"""

from __future__ import annotations

import os
import sys
import json
import textwrap

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from src.data.psi_knowledge_base import PSIKnowledgeBase
from src.data.chunking import ScientificChunker
from src.knowledge.graph import InvestigationGraph
from src.extrapolator.physics_constraints import CombustionPhysics


# ── Formatting helpers ───────────────────────────────────────────────────

SEP = "═" * 72
THIN = "─" * 72


def heading(title: str) -> None:
    print(f"\n{SEP}")
    print(f"  {title}")
    print(SEP)


def subheading(title: str) -> None:
    print(f"\n{THIN}")
    print(f"  {title}")
    print(THIN)


def wrap(text: str, width: int = 70) -> str:
    return textwrap.fill(text, width=width, initial_indent="  ", subsequent_indent="  ")


# ── Demo ─────────────────────────────────────────────────────────────────

def main():
    heading("NASA FIRE SAFETY INTELLIGENCE ENGINE — DEMO")
    print("  This demo showcases the data layer, knowledge graph, and")
    print("  physics engine. No API key is required for these features.\n")

    # ── 1. Knowledge Base ────────────────────────────────────────────
    heading("1. PSI KNOWLEDGE BASE")
    kb = PSIKnowledgeBase()
    invs = kb.get_all()
    print(f"  Loaded {len(invs)} investigations from NASA PSI database\n")

    print("  ID               | Acronym       | Hardware              | Pillar      | Relevance")
    print("  " + "-" * 90)
    for inv in invs:
        print(
            f"  {inv.id:17s}| {inv.acronym:14s}| {inv.hardware_facility:22s}| "
            f"{inv.fire_safety_pillar.value:12s}| {inv.relevance_to_crew_habitat:.1f}"
        )

    # ── 2. Filter by Fire Safety Pillar ──────────────────────────────
    subheading("Filter: Prevention Investigations")
    prevention = kb.get_by_pillar("PREVENTION")
    for inv in prevention:
        print(f"  • {inv.acronym}: {inv.name}")
        o2_vals = [f"{a.oxygen_pct}%" for a in inv.atmosphere]
        if o2_vals:
            print(f"    O₂ range: {', '.join(o2_vals)}")

    subheading("Filter: High Relevance to Crew Habitat (≥0.8)")
    high_rel = kb.get_fire_safety_relevant(0.8)
    for inv in high_rel:
        print(f"  • {inv.acronym} ({inv.relevance_to_crew_habitat:.1f}): {inv.name}")

    # ── 3. Chunking ──────────────────────────────────────────────────
    heading("2. SCIENTIFIC CHUNKING")
    chunker = ScientificChunker()
    docs = chunker.chunk_all(invs)
    print(f"  Total chunks: {len(docs)}  ({len(docs) // len(invs)} facets per investigation)")
    print(f"  Facet types: OVERVIEW, FUEL_CONDITIONS, HARDWARE, FINDINGS, SAFETY_CONTEXT\n")

    # Show a sample chunk
    sample = [d for d in docs if d.metadata["investigation_id"] == "bass" and d.metadata["facet_type"] == "FUEL_CONDITIONS"]
    if sample:
        print("  Sample chunk (BASS — FUEL_CONDITIONS):")
        for line in sample[0].page_content.split("\n")[:10]:
            print(f"    {line}")
        print("    ...")

    # ── 4. Knowledge Graph ───────────────────────────────────────────
    heading("3. INVESTIGATION KNOWLEDGE GRAPH")
    graph = InvestigationGraph()
    graph.build(invs)
    print(f"  Nodes: {graph._graph.number_of_nodes()}")
    print(f"  Edges: {graph._graph.number_of_edges()}")

    subheading("Hardware Groups")
    for inv_id in ["bre", "flex", "bass", "same"]:
        group = graph.get_shared_hardware_group(inv_id)
        if group:
            print(f"  {inv_id.upper()} shares hardware with: {', '.join(g.upper() for g in group)}")

    subheading("Relationship Explanations")
    pairs = [("bre", "bass"), ("same", "daft"), ("flex", "cfi"), ("saffire1", "saffire3")]
    for a, b in pairs:
        explanation = graph.explain_relationship(a, b)
        print(f"\n  {a.upper()} ↔ {b.upper()}:")
        for line in explanation.split("\n"):
            print(f"    {line}")

    # ── 5. Physics Constraints ───────────────────────────────────────
    heading("4. COMBUSTION PHYSICS CONSTRAINTS (No LLM — Pure Physics)")
    physics = CombustionPhysics()

    scenarios = [
        ("Moon Base", 0.16, 34.0, 10.2),
        ("Mars Habitat", 0.38, 30.0, 10.2),
        ("ISS (microgravity)", 0.0, 21.0, 14.7),
        ("Earth (baseline)", 1.0, 21.0, 14.7),
    ]

    for name, g, o2, psi in scenarios:
        subheading(f"Scenario: {name}  |  {g}g  |  {o2}% O₂  |  {psi} psi")

        buoyancy = physics.buoyancy_strength(g)
        conv = physics.natural_convection_velocity(g)
        o2_factor = physics.oxygen_enhancement_factor(o2)
        height, h_conf = physics.flame_height_scaling(g, 30.0)
        spread_lo, spread_hi = physics.spread_rate_bounds(g, 0.5, 2.0)
        flam_lo, flam_hi = physics.flammability_limit_bounds(o2, psi, g, 12.0, 15.0)

        print(f"  Buoyancy strength:            {buoyancy:.2f} (Earth = 1.00)")
        print(f"  Natural convection velocity:  {conv:.3f} m/s")
        print(f"  O₂ enhancement factor:        {o2_factor:.2f}x vs 21% O₂")
        print(f"  Flame height (30mm at 1g):    ~{height:.0f} mm (confidence: {h_conf:.1f})")
        print(f"  Spread rate bounds:           [{spread_lo:.2f}, {spread_hi:.2f}] mm/s")
        print(f"  Flammability limit bounds:    [{flam_lo:.2f}, {flam_hi:.2f}]")

    # ── 6. Specific Investigation Deep Dive ──────────────────────────
    heading("5. INVESTIGATION DEEP DIVE — CFI-G (Highest O₂)")
    cfig = kb.get_by_id("cfig")
    if cfig:
        print(f"  Name:      {cfig.name}")
        print(f"  Acronym:   {cfig.acronym}")
        print(f"  Project:   {cfig.project}")
        print(f"  Hardware:  {cfig.hardware_facility}")
        print(f"  Pillar:    {cfig.fire_safety_pillar.value}")
        print(f"  Relevance: {cfig.relevance_to_crew_habitat}")
        print(f"\n  Objectives:")
        print(wrap(cfig.objectives))
        print(f"\n  Fuels:")
        for f in cfig.fuels:
            print(f"    • {f.material_name} ({f.fuel_type.value}) — {f.shape or 'N/A'}")
        print(f"\n  Atmosphere Conditions:")
        for a in cfig.atmosphere:
            flow = f", flow: {a.flow_velocity_cm_s} cm/s" if a.flow_velocity_cm_s else ", quiescent"
            print(f"    • {a.oxygen_pct}% O₂, {a.pressure_psi} psi, diluent: {a.diluent}{flow}")
        print(f"\n  Key Findings:")
        for finding in cfig.key_findings:
            print(f"    • {finding}")

    # ── 7. LLM features check ────────────────────────────────────────
    heading("6. LLM-POWERED FEATURES")
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key and api_key not in ("test-key-for-import-check", ""):
        print("  API key detected! LLM features are available.")
        print("  Run the API server to use them:")
        print("    python src/api.py")
        print()
        print("  Or use the pipeline directly in Python:")
        print("    from src.pipeline import NASAFireSafetyPipeline")
        print('    pipeline = NASAFireSafetyPipeline()')
        print('    pipeline.initialize()')
        print('    result = pipeline.query("What is the most relevant investigation for lunar fire safety?")')
    else:
        print("  No API key found. To enable LLM features:")
        print("    1. Copy .env.example to .env")
        print("    2. Add your OPENAI_API_KEY or GOOGLE_API_KEY")
        print("    3. Re-run this demo or start the API server")
        print()
        print("  Data-only API is still fully functional:")
        print("    python src/api.py")
        print("    → GET  http://localhost:8000/investigations")
        print("    → GET  http://localhost:8000/investigations/bass")
        print("    → GET  http://localhost:8000/investigations/bre/related")
        print("    → POST http://localhost:8000/physics/bounds")

    heading("DEMO COMPLETE")
    print(f"  {len(invs)} investigations  |  {len(docs)} document chunks  |  "
          f"{graph._graph.number_of_edges()} graph edges")
    print(f"  System is ready for queries.\n")


if __name__ == "__main__":
    main()

