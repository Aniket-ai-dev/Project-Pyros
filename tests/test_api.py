"""Integration tests for FastAPI endpoints, including incidents, spinoffs, and dashboard.
"""

from __future__ import annotations

import unittest
from fastapi.testclient import TestClient
from src.api import app


class TestAPIEndpoints(unittest.TestCase):
    """Verify all REST API endpoints and dashboard UI serving."""

    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")

    def test_incidents_endpoint(self) -> None:
        response = self.client.get("/incidents")
        self.assertEqual(response.status_code, 200)
        incidents = response.json()
        self.assertIsInstance(incidents, list)
        self.assertEqual(len(incidents), 3)

        ids = [i["id"] for i in incidents]
        self.assertIn("apollo1", ids)
        self.assertIn("apollo13", ids)
        self.assertIn("mir1997", ids)

        # Validate Apollo 1 structure
        apollo1 = next(i for i in incidents if i["id"] == "apollo1")
        self.assertEqual(apollo1["atmosphere"]["oxygen_pct"], 100.0)
        self.assertEqual(apollo1["atmosphere"]["pressure_psi"], 16.7)
        self.assertGreater(len(apollo1["failure_mechanisms"]), 0)
        self.assertGreater(len(apollo1["psi_remedies"]), 0)
        self.assertTrue(apollo1["official_url"].startswith("https://sma.nasa.gov/"))

    def test_spinoffs_endpoint(self) -> None:
        response = self.client.get("/spinoffs")
        self.assertEqual(response.status_code, 200)
        spinoffs = response.json()
        self.assertIsInstance(spinoffs, list)
        self.assertEqual(len(spinoffs), 3)

        spinoff_ids = [s["spinoff_id"] for s in spinoffs]
        self.assertIn("9582", spinoff_ids)  # Air Tanks
        self.assertIn("9407", spinoff_ids)  # Smoke Detector
        self.assertIn("9918", spinoff_ids)  # Fire Attire

        for s in spinoffs:
            self.assertIn("space_origin", s)
            self.assertIn("psi_connection", s)
            self.assertIn("terrestrial_impact", s)
            self.assertIn("metrics", s)
            self.assertTrue(s["official_url"].startswith("https://spinoff.nasa.gov/"))

    def test_dashboard_contains_mission_tabs_and_handlers(self) -> None:
        response = self.client.get("/dashboard")
        self.assertEqual(response.status_code, 200)
        html = response.text
        self.assertIn("tab-btn-telemetry", html)
        self.assertIn("tab-btn-incidents", html)
        self.assertIn("tab-btn-spinoffs", html)
        self.assertIn("switchMissionTab", html)
        self.assertIn("loadIncidents", html)
        self.assertIn("loadSpinoffs", html)
        self.assertIn("simulateIncident", html)
        self.assertIn("openAcademicModal", html)
        self.assertIn("closeAcademicModal", html)
        self.assertIn("W1oXykoz9zg", html)  # YouTube ScienceCasts embed
        self.assertIn("NASA Policy Notice", html)  # Mandatory NASA disclaimer

    def test_physics_bounds_endpoint(self) -> None:
        payload = {"gravity_g": 0.16, "o2_pct": 34.0, "pressure_psi": 10.2}
        response = self.client.post("/physics/bounds", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()["bounds"]
        self.assertAlmostEqual(data["oxygen_partial_pressure_psi"]["value"], 3.468, places=2)
        self.assertGreater(data["flame_height_scaling"]["estimated_mm"], 30.0)
