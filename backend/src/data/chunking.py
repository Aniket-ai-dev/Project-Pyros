"""Multi-facet scientific document chunker for NASA PSI investigations.

Each Investigation is split into five facet-specific LangChain Documents,
each carrying rich metadata for downstream filtering and retrieval:

    OVERVIEW        — name, objectives, approach
    FUEL_CONDITIONS — fuel specs, atmosphere conditions
    HARDWARE        — facility, sensors, related investigations
    FINDINGS        — key findings, Earth applications
    SAFETY_CONTEXT  — fire-safety pillar, relevance, narrative
"""

from __future__ import annotations

from langchain_core.documents import Document

from src.data.models import Investigation


class ScientificChunker:
    """Chunk investigations into multi-facet LangChain Documents.

    Each facet captures a different dimension of the investigation so that
    retrieval queries about e.g. "oxygen concentration" can hit the
    FUEL_CONDITIONS chunk directly rather than competing with hardware
    or findings text.
    """

    # Facet identifiers
    FACET_OVERVIEW = "OVERVIEW"
    FACET_FUEL_CONDITIONS = "FUEL_CONDITIONS"
    FACET_HARDWARE = "HARDWARE"
    FACET_FINDINGS = "FINDINGS"
    FACET_SAFETY_CONTEXT = "SAFETY_CONTEXT"

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #

    def chunk_investigation(self, inv: Investigation) -> list[Document]:
        """Produce 5 facet Documents for a single investigation.

        Args:
            inv: A populated ``Investigation`` model.

        Returns:
            List of ``Document`` objects, one per facet.
        """
        base_meta = self._base_metadata(inv)
        return [
            self._overview_chunk(inv, base_meta),
            self._fuel_conditions_chunk(inv, base_meta),
            self._hardware_chunk(inv, base_meta),
            self._findings_chunk(inv, base_meta),
            self._safety_context_chunk(inv, base_meta),
        ]

    def chunk_all(self, investigations: list[Investigation]) -> list[Document]:
        """Chunk every investigation and return a flat list of Documents.

        Args:
            investigations: All investigations to chunk.

        Returns:
            Flat list of all facet Documents.
        """
        docs: list[Document] = []
        for inv in investigations:
            docs.extend(self.chunk_investigation(inv))
        return docs

    # ------------------------------------------------------------------ #
    #  Shared metadata
    # ------------------------------------------------------------------ #

    @staticmethod
    def _base_metadata(inv: Investigation) -> dict:
        """Build metadata common to every facet of this investigation."""
        o2_values = [a.oxygen_pct for a in inv.atmosphere]
        oxygen_range = (
            f"{min(o2_values)}-{max(o2_values)}" if o2_values else "N/A"
        )
        return {
            "investigation_id": inv.id,
            "acronym": inv.acronym,
            "project": inv.project or "",
            "fuel_types": sorted({f.fuel_type.value for f in inv.fuels}),
            "oxygen_range": oxygen_range,
            "hardware": inv.hardware_facility,
            "gravity_condition": inv.gravity.value,
            "pillar": inv.fire_safety_pillar.value,
            "relevance": inv.relevance_to_crew_habitat,
        }

    # ------------------------------------------------------------------ #
    #  Facet builders
    # ------------------------------------------------------------------ #

    @staticmethod
    def _overview_chunk(inv: Investigation, base_meta: dict) -> Document:
        lines = [
            f"Investigation: {inv.name} ({inv.acronym})",
        ]
        if inv.project:
            lines.append(f"Project: {inv.project}")
        lines += [
            "",
            f"Objectives: {inv.objectives}",
            "",
            f"Approach: {inv.approach}",
        ]
        meta = {**base_meta, "facet_type": "OVERVIEW"}
        return Document(page_content="\n".join(lines), metadata=meta)

    @staticmethod
    def _fuel_conditions_chunk(inv: Investigation, base_meta: dict) -> Document:
        lines = [
            f"Investigation: {inv.name} ({inv.acronym})",
            "",
            "Fuel Specifications:",
        ]
        for fuel in inv.fuels:
            parts = [f"  - {fuel.material_name} ({fuel.fuel_type.value})"]
            if fuel.shape:
                parts.append(f"shape: {fuel.shape}")
            if fuel.dimensions_mm:
                parts.append(f"dimensions: {fuel.dimensions_mm} mm")
            lines.append(", ".join(parts))

        lines += ["", "Atmosphere Conditions:"]
        for atm in inv.atmosphere:
            atm_str = (
                f"  - {atm.oxygen_pct}% O2, {atm.pressure_psi} psi, "
                f"diluent: {atm.diluent}"
            )
            if atm.flow_velocity_cm_s is not None:
                atm_str += f", flow: {atm.flow_velocity_cm_s} cm/s"
            else:
                atm_str += ", quiescent (no forced flow)"
            lines.append(atm_str)

        meta = {**base_meta, "facet_type": "FUEL_CONDITIONS"}
        return Document(page_content="\n".join(lines), metadata=meta)

    @staticmethod
    def _hardware_chunk(inv: Investigation, base_meta: dict) -> Document:
        lines = [
            f"Investigation: {inv.name} ({inv.acronym})",
            f"Hardware/Facility: {inv.hardware_facility}",
            f"Gravity: {inv.gravity.value}",
            "",
            "Sensors and Diagnostics:",
        ]
        for sensor in inv.sensors:
            lines.append(
                f"  - {sensor.sensor_type}: measures {sensor.measurement_type} "
                f"({sensor.units})"
            )
        if inv.related_investigations:
            lines += [
                "",
                "Related Investigations: "
                + ", ".join(inv.related_investigations),
            ]

        meta = {**base_meta, "facet_type": "HARDWARE"}
        return Document(page_content="\n".join(lines), metadata=meta)

    @staticmethod
    def _findings_chunk(inv: Investigation, base_meta: dict) -> Document:
        lines = [
            f"Investigation: {inv.name} ({inv.acronym})",
            "",
            "Key Findings:",
        ]
        for finding in inv.key_findings:
            lines.append(f"  - {finding}")

        if inv.earth_applications:
            lines += ["", "Earth Applications:"]
            for app in inv.earth_applications:
                lines.append(f"  - {app}")

        meta = {**base_meta, "facet_type": "FINDINGS"}
        return Document(page_content="\n".join(lines), metadata=meta)

    @staticmethod
    def _safety_context_chunk(inv: Investigation, base_meta: dict) -> Document:
        # Generate a narrative about how this investigation contributes
        # to crew safety — deterministic, based on structured fields.
        pillar_desc = {
            "PREVENTION": (
                "prevention of fire through understanding flammability limits "
                "and material selection"
            ),
            "DETECTION": (
                "detection of smoke and combustion products to enable early "
                "warning systems"
            ),
            "SUPPRESSION": (
                "suppression and extinguishment of fires once ignited"
            ),
        }
        pillar = inv.fire_safety_pillar.value
        pillar_text = pillar_desc.get(pillar, pillar.lower())

        # Oxygen context
        o2_values = [a.oxygen_pct for a in inv.atmosphere]
        o2_narrative = ""
        if o2_values:
            max_o2 = max(o2_values)
            if max_o2 > 30:
                o2_narrative = (
                    f" Tests at up to {max_o2}% oxygen are highly relevant to "
                    f"planned lunar habitats where O2 concentration may exceed 30%."
                )
            elif max_o2 >= 21:
                o2_narrative = (
                    f" Tests at {max_o2}% oxygen provide Earth-baseline data."
                )

        # Gravity context
        grav = inv.gravity.value
        grav_narrative = ""
        if grav == "MICROGRAVITY":
            grav_narrative = (
                " Microgravity results from ISS represent one boundary for "
                "predicting behaviour at partial gravity (Moon/Mars)."
            )
        elif grav == "SIMULATED_PARTIAL":
            grav_narrative = (
                " This experiment simulated partial gravity, providing rare "
                "intermediate-gravity data points."
            )

        relevance_label = (
            "HIGH" if inv.relevance_to_crew_habitat >= 0.8
            else "MEDIUM" if inv.relevance_to_crew_habitat >= 0.5
            else "LOW"
        )

        narrative = (
            f"{inv.name} ({inv.acronym}) contributes to the fire safety pillar "
            f"of {pillar_text}. "
            f"Relevance to crew habitat fire safety: {relevance_label} "
            f"({inv.relevance_to_crew_habitat:.1f}/1.0)."
            f"{o2_narrative}{grav_narrative}"
        )

        lines = [
            f"Investigation: {inv.name} ({inv.acronym})",
            f"Fire Safety Pillar: {pillar}",
            f"Crew Habitat Relevance: {relevance_label} ({inv.relevance_to_crew_habitat})",
            "",
            "Safety Context:",
            narrative,
        ]

        meta = {**base_meta, "facet_type": "SAFETY_CONTEXT"}
        return Document(page_content="\n".join(lines), metadata=meta)

