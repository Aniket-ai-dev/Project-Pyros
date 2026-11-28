"""Integration tests for the NASA Fire Safety Intelligence Engine.

Tests the data layer, chunking, knowledge graph, and retriever using
real structured data (no LLM calls — those are mocked).
"""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from src.data.models import (
    AtmosphereCondition,
    FireSafetyPillar,
    FuelSpec,
    FuelType,
    GravityCondition,
    Investigation,
)
from src.data.psi_knowledge_base import PSIKnowledgeBase
from src.data.chunking import ScientificChunker
from src.knowledge.graph import (
    InvestigationGraph,
    SHARES_HARDWARE,
    SAME_PROJECT,
    CONTINUATION_OF,
    SHARED_INSTRUMENT,
)
from src.extrapolator.physics_constraints import CombustionPhysics


class TestPSIKnowledgeBase(unittest.TestCase):
    """Verify the knowledge base loads all expected investigations."""

    def setUp(self) -> None:
        self.kb = PSIKnowledgeBase()

    def test_loads_investigations(self) -> None:
        """Knowledge base should contain at least 15 investigations."""
        all_inv = self.kb.get_all()
        self.assertGreaterEqual(len(all_inv), 15, "Expected at least 15 investigations")

    def test_get_by_id(self) -> None:
        """Should retrieve BRE by its ID and handle missing IDs cleanly."""
        bre = self.kb.get_by_id("bre")
        self.assertIsNotNone(bre)
        self.assertEqual(bre.acronym, "BRE")
        self.assertEqual(bre.project, "ACME")
        self.assertIsNone(self.kb.find_by_id("nonexistent-id"))
        with self.assertRaises(KeyError):
            self.kb.get_by_id("nonexistent-id")

    def test_get_by_pillar(self) -> None:
        """Should return investigations for each fire safety pillar."""
        prevention = self.kb.get_by_pillar("PREVENTION")
        self.assertGreater(len(prevention), 0)

        detection = self.kb.get_by_pillar("DETECTION")
        self.assertGreater(len(detection), 0)

        suppression = self.kb.get_by_pillar("SUPPRESSION")
        self.assertGreater(len(suppression), 0)

    def test_get_by_hardware(self) -> None:
        """CIR hardware should have multiple investigations."""
        cir = self.kb.get_by_hardware("CIR")
        self.assertGreaterEqual(len(cir), 3)

    def test_get_by_fuel_type(self) -> None:
        """Should find investigations by fuel type."""
        gas = self.kb.get_by_fuel_type("gas")
        self.assertGreater(len(gas), 0)

        solid = self.kb.get_by_fuel_type("solid")
        self.assertGreater(len(solid), 0)

    def test_fire_safety_relevant(self) -> None:
        """High-relevance filter should return a subset."""
        high = self.kb.get_fire_safety_relevant(0.8)
        all_inv = self.kb.get_all()
        self.assertLessEqual(len(high), len(all_inv))
        for inv in high:
            self.assertGreaterEqual(inv.relevance_to_crew_habitat, 0.8)

    def test_to_documents(self) -> None:
        """to_documents should produce LangChain Documents with metadata."""
        docs = self.kb.to_documents()
        self.assertGreater(len(docs), 0)
        for doc in docs:
            self.assertIn("investigation_id", doc.metadata)
            self.assertIn("pillar", doc.metadata)
            self.assertTrue(len(doc.page_content) > 0)


class TestScientificChunker(unittest.TestCase):
    """Verify multi-facet chunking produces correct output."""

    def setUp(self) -> None:
        self.chunker = ScientificChunker()
        self.sample_inv = Investigation(
            id="test-inv",
            name="Test Investigation",
            acronym="TEST",
            project="TEST_PROJECT",
            hardware_facility="CIR",
            objectives="Test fire behavior in microgravity.",
            approach="Burn stuff and measure things.",
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="methane", shape="spherical burner"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2"),
            ],
            sensors=[],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.9,
            key_findings=["Fire is different in space."],
            related_investigations=["bre"],
        )

    def test_produces_five_facets(self) -> None:
        """Each investigation should produce exactly 5 chunks."""
        chunks = self.chunker.chunk_investigation(self.sample_inv)
        self.assertEqual(len(chunks), 5)

    def test_facet_types(self) -> None:
        """Each chunk should have the correct facet_type metadata."""
        chunks = self.chunker.chunk_investigation(self.sample_inv)
        facet_types = {c.metadata["facet_type"] for c in chunks}
        expected = {"OVERVIEW", "FUEL_CONDITIONS", "HARDWARE", "FINDINGS", "SAFETY_CONTEXT"}
        self.assertEqual(facet_types, expected)

    def test_metadata_propagation(self) -> None:
        """All chunks should carry base metadata."""
        chunks = self.chunker.chunk_investigation(self.sample_inv)
        for chunk in chunks:
            self.assertEqual(chunk.metadata["investigation_id"], "test-inv")
            self.assertEqual(chunk.metadata["hardware"], "CIR")
            self.assertEqual(chunk.metadata["pillar"], "PREVENTION")
            self.assertEqual(chunk.metadata["gravity_condition"], "MICROGRAVITY")

    def test_chunk_all(self) -> None:
        """chunk_all should handle multiple investigations."""
        kb = PSIKnowledgeBase()
        all_chunks = self.chunker.chunk_all(kb.get_all())
        # 5 facets per investigation
        self.assertEqual(len(all_chunks), 5 * len(kb.get_all()))


class TestInvestigationGraph(unittest.TestCase):
    """Verify the knowledge graph builds correct relationships."""

    def setUp(self) -> None:
        self.graph = InvestigationGraph()
        self.kb = PSIKnowledgeBase()
        self.graph.build(self.kb.get_all())

    def test_graph_has_nodes(self) -> None:
        """Graph should have a node for each investigation."""
        n_inv = len(self.kb.get_all())
        self.assertEqual(len(self.graph._graph.nodes), n_inv)

    def test_acme_project_edges(self) -> None:
        """All ACME investigations should share SAME_PROJECT edges."""
        acme_ids = [inv.id for inv in self.kb.get_all() if inv.project == "ACME"]
        if len(acme_ids) >= 2:
            for i, a in enumerate(acme_ids):
                for b in acme_ids[i + 1:]:
                    edges = [
                        (u, v, d) for u, v, d in self.graph._graph.edges(data=True)
                        if u == a and v == b and d.get("type") == SAME_PROJECT
                    ]
                    self.assertGreater(len(edges), 0, f"Missing SAME_PROJECT edge: {a} → {b}")

    def test_shared_hardware_group(self) -> None:
        """BRE should share hardware with other CIR investigations."""
        bre = self.kb.get_by_id("bre")
        if bre:
            group = self.graph.get_shared_hardware_group("bre")
            self.assertGreater(len(group), 0, "BRE should share CIR hardware with others")

    def test_explain_relationship(self) -> None:
        """explain_relationship should return meaningful text."""
        explanation = self.graph.explain_relationship("bre", "bass")
        self.assertTrue(len(explanation) > 10)

    def test_get_related(self) -> None:
        """get_related should return edges within hop distance."""
        related = self.graph.get_related("bre", max_hops=1)
        self.assertGreater(len(related), 0)


class TestCombustionPhysics(unittest.TestCase):
    """Verify physics constraint calculations."""

    def test_buoyancy_earth(self) -> None:
        self.assertAlmostEqual(CombustionPhysics.buoyancy_strength(1.0), 1.0)

    def test_buoyancy_moon(self) -> None:
        self.assertAlmostEqual(CombustionPhysics.buoyancy_strength(0.16), 0.16)

    def test_buoyancy_micro(self) -> None:
        self.assertAlmostEqual(CombustionPhysics.buoyancy_strength(0.0), 0.0)

    def test_flame_height_increases_at_low_g(self) -> None:
        height, conf = CombustionPhysics.flame_height_scaling(0.16, 30.0)
        self.assertGreater(height, 30.0, "Flame should be taller at lower g")

    def test_convection_decreases_at_low_g(self) -> None:
        earth_v = CombustionPhysics.natural_convection_velocity(1.0)
        moon_v = CombustionPhysics.natural_convection_velocity(0.16)
        self.assertGreater(earth_v, moon_v, "Convection should be weaker at lower g")

    def test_o2_enhancement(self) -> None:
        factor = CombustionPhysics.oxygen_enhancement_factor(30.0)
        self.assertGreater(factor, 1.0, "30% O2 should be more flammable than 21%")

    def test_o2_enhancement_baseline(self) -> None:
        factor = CombustionPhysics.oxygen_enhancement_factor(21.0)
        self.assertAlmostEqual(factor, 1.0, places=2)

    def test_spread_rate_bounds(self) -> None:
        lower, upper = CombustionPhysics.spread_rate_bounds(0.16, 0.5, 2.0)
        self.assertGreater(upper, lower)
        self.assertGreater(lower, 0.0)

    def test_flammability_limit_bounds(self) -> None:
        lower, upper = CombustionPhysics.flammability_limit_bounds(
            o2_pct=30.0, pressure_psi=10.2, gravity_g=0.16,
            micro_g_limit=12.0, earth_g_limit=15.0,
        )
        self.assertGreater(upper, lower)


class TestLLMQuotaCircuitBreaker(unittest.TestCase):
    """Verify 429 daily quota errors fast-fail and engage cooldown."""

    def setUp(self) -> None:
        from src.pipeline import reset_llm_cooldown
        reset_llm_cooldown()

    def tearDown(self) -> None:
        from src.pipeline import reset_llm_cooldown
        reset_llm_cooldown()

    def test_daily_quota_fast_fails_without_sleeping(self) -> None:
        from langchain_core.messages import HumanMessage
        from src.pipeline import _safe_invoke_llm, is_llm_in_cooldown

        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = RuntimeError(
            "429 RESOURCE_EXHAUSTED GenerateRequestsPerDayPerProjectPerModel-FreeTier"
        )
        with patch("time.sleep") as mock_sleep:
            answer = _safe_invoke_llm(
                mock_llm,
                [HumanMessage(content="Predict flammability of solid polymers in a Lunar habitat at 34% O2 and 10.2 psi")],
                question_text="Predict flammability of solid polymers in a Lunar habitat at 34% O2 and 10.2 psi",
            )
            mock_sleep.assert_not_called()

        self.assertTrue(is_llm_in_cooldown())
        self.assertEqual(mock_llm.invoke.call_count, 1)
        self.assertIn("VERIFIED KNOWLEDGE BASE ANALYSIS", answer)

        # Subsequent call should skip invoke entirely during cooldown
        answer2 = _safe_invoke_llm(
            mock_llm,
            [HumanMessage(content="Question: Lunar habitat polymers 34% O2 10.2 psi")],
        )
        self.assertEqual(mock_llm.invoke.call_count, 1)
        self.assertTrue(len(answer2) > 20)


if __name__ == "__main__":
    unittest.main()

