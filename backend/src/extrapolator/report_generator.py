"""Format extrapolation results into structured Markdown reports.

Produces a human-readable report from the completed ``ExtrapolatorState``
dictionary, with sections covering the data used, physics constraints
applied, predictions, confidence assessment, and caveats.
"""

from __future__ import annotations

from typing import Any


class ExtrapolationReportGenerator:
    """Generate Markdown reports from completed extrapolation state."""

    # ------------------------------------------------------------------ #
    #  Public interface
    # ------------------------------------------------------------------ #

    @staticmethod
    def format_report(state: dict[str, Any]) -> str:
        """Render a full Markdown report from an ``ExtrapolatorState`` dict.

        Sections
        --------
        1. Executive Summary
        2. Data Endpoints Used
        3. Physics Constraints Applied
        4. Predicted Behavior
        5. Confidence Assessment
        6. Caveats & Limitations
        7. Recommendations for Future Research

        Args:
            state: A completed ``ExtrapolatorState`` dictionary.

        Returns:
            A Markdown-formatted string.
        """
        sections: list[str] = []

        # -------------------------------------------------------------- #
        # Header
        # -------------------------------------------------------------- #
        gravity = state.get("target_gravity", "?")
        fuel = state.get("fuel_description", "unspecified fuel")
        sections.append(
            f"# Partial-Gravity Flammability Extrapolation Report\n\n"
            f"**Target gravity:** {gravity} g  \n"
            f"**Target O₂:** {state.get('target_o2_pct', '?')} %  \n"
            f"**Target pressure:** {state.get('target_pressure_psi', '?')} psi  \n"
            f"**Fuel:** {fuel}\n"
        )

        # -------------------------------------------------------------- #
        # 1. Executive Summary
        # -------------------------------------------------------------- #
        sections.append("## 1. Executive Summary\n")
        if state.get("final_report"):
            sections.append(state["final_report"] + "\n")
        elif state.get("llm_hypothesis"):
            sections.append(state["llm_hypothesis"][:500] + "\n")
        else:
            sections.append("*No hypothesis was generated.*\n")

        # -------------------------------------------------------------- #
        # 2. Data Endpoints Used
        # -------------------------------------------------------------- #
        sections.append("## 2. Data Endpoints Used\n")
        sections.append(
            _format_data_endpoints(
                state.get("microgravity_data", []),
                state.get("earth_gravity_data", []),
            )
        )

        # -------------------------------------------------------------- #
        # 3. Physics Constraints Applied
        # -------------------------------------------------------------- #
        sections.append("## 3. Physics Constraints Applied\n")
        sections.append(_format_physics_bounds(state.get("physics_bounds", [])))

        # -------------------------------------------------------------- #
        # 4. Predicted Behavior
        # -------------------------------------------------------------- #
        sections.append("## 4. Predicted Behavior\n")
        if state.get("llm_hypothesis"):
            sections.append(state["llm_hypothesis"] + "\n")
        else:
            sections.append("*No prediction available.*\n")

        # -------------------------------------------------------------- #
        # 5. Confidence Assessment
        # -------------------------------------------------------------- #
        sections.append("## 5. Confidence Assessment\n")
        if state.get("confidence_assessment"):
            sections.append(state["confidence_assessment"] + "\n")
        else:
            sections.append("*No confidence assessment available.*\n")

        # -------------------------------------------------------------- #
        # 6. Caveats & Limitations
        # -------------------------------------------------------------- #
        sections.append("## 6. Caveats & Limitations\n")
        caveats = state.get("caveats", [])
        if caveats:
            for caveat in caveats:
                sections.append(f"- {caveat}")
            sections.append("")
        else:
            sections.append("*No caveats recorded.*\n")

        # -------------------------------------------------------------- #
        # 7. Recommendations for Future Research
        # -------------------------------------------------------------- #
        sections.append("## 7. Recommendations for Future Research\n")
        sections.append(_generate_recommendations(state))

        return "\n".join(sections)


# ------------------------------------------------------------------ #
#  Internal helpers
# ------------------------------------------------------------------ #


def _format_data_endpoints(
    micro_data: list[dict[str, Any]],
    earth_data: list[dict[str, Any]],
) -> str:
    """Format microgravity and Earth-gravity data into Markdown tables."""
    lines: list[str] = []

    lines.append("### Microgravity (0 g) Data Points\n")
    if micro_data:
        lines.append("| Parameter | Value | Source |")
        lines.append("|-----------|-------|--------|")
        for dp in micro_data:
            param = dp.get("parameter", "—")
            value = dp.get("value", "—")
            source = dp.get("source", "—")
            lines.append(f"| {param} | {value} | {source} |")
        lines.append("")
    else:
        lines.append("*No microgravity data available.*\n")

    lines.append("### Earth Gravity (1 g) Baseline Data Points\n")
    if earth_data:
        lines.append("| Parameter | Value | Source |")
        lines.append("|-----------|-------|--------|")
        for dp in earth_data:
            param = dp.get("parameter", "—")
            value = dp.get("value", "—")
            source = dp.get("source", "—")
            lines.append(f"| {param} | {value} | {source} |")
        lines.append("")
    else:
        lines.append("*No Earth-gravity baseline data available.*\n")

    return "\n".join(lines)


def _format_physics_bounds(bounds: list[dict[str, Any]]) -> str:
    """Format physics bounds into a readable Markdown block."""
    if not bounds:
        return "*No physics bounds were computed.*\n"

    lines: list[str] = []
    for b in bounds:
        name = b.get("parameter_name", "Unknown parameter")
        lo = b.get("lower_bound", "?")
        hi = b.get("upper_bound", "?")
        conf = b.get("confidence", "?")
        basis = b.get("physical_basis", "")
        lines.append(f"### {name}\n")
        lines.append(f"- **Range:** [{lo}, {hi}]")
        lines.append(f"- **Confidence:** {conf}")
        if basis:
            lines.append(f"- **Physical basis:** {basis}")
        cavs = b.get("caveats", [])
        if cavs:
            lines.append("- **Caveats:**")
            for c in cavs:
                lines.append(f"  - {c}")
        lines.append("")

    return "\n".join(lines)


def _generate_recommendations(state: dict[str, Any]) -> str:
    """Generate research recommendations based on gaps in the analysis."""
    recs: list[str] = []

    gravity = state.get("target_gravity", 0.0)
    micro_data = state.get("microgravity_data", [])
    earth_data = state.get("earth_gravity_data", [])

    # Always recommend direct testing
    if isinstance(gravity, (int, float)):
        g_label = f"{gravity} g"
    else:
        g_label = "partial-gravity"
    recs.append(
        f"Direct experimental testing at {g_label} (e.g. via parabolic flight, "
        f"centrifuge on ISS, or lunar/Martian surface platforms) is essential to "
        f"validate these extrapolations."
    )

    if not micro_data:
        recs.append(
            "No microgravity data was available for this fuel — conducting "
            "ISS-based combustion experiments is a high priority."
        )

    if not earth_data:
        recs.append(
            "Earth-gravity baseline data was not found — standard laboratory "
            "characterisation should be performed."
        )

    # Recommend computational validation
    recs.append(
        "Computational fluid dynamics (CFD) simulations at intermediate gravity "
        "levels can help bridge the gap between the 0 g and 1 g endpoints."
    )

    # Recommend sensitivity studies
    recs.append(
        "Sensitivity studies varying O₂ concentration and pressure simultaneously "
        "at partial gravity would strengthen the predictive model."
    )

    return "\n".join(f"- {r}" for r in recs) + "\n"
