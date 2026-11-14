"""Cross-investigation comparison chain using LCEL.

Provides ``CrossInvestigationComparator`` which takes 2-4 ``Investigation``
objects, summarises each (reusing cached summaries when available), then runs a
comparison prompt through an LLM and returns a structured ``ComparisonReport``.
"""

from __future__ import annotations

import json
from typing import Any, Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough, RunnableSequence
from pydantic import BaseModel, Field

from src.data.models import Investigation
from src.chains.summarizer import InvestigationSummarizer


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class ComparisonReport(BaseModel):
    """Structured output from a cross-investigation comparison."""

    shared_variables: dict[str, Any] = Field(
        description=(
            "Variables that are the same across all compared investigations "
            "(e.g. shared hardware, common gravity condition)."
        )
    )
    differing_variables: list[dict[str, Any]] = Field(
        description=(
            "List of dicts, each with keys: variable, values (per-investigation), "
            "significance."
        )
    )
    hardware_relationships: list[str] = Field(
        description="Hardware-level relationships between investigations."
    )
    combined_insight: str = Field(
        description="What can we learn by looking at these investigations together?"
    )
    gap_analysis: str = Field(
        description="Conditions or parameters that remain untested between the investigations."
    )
    recommendations: list[str] = Field(
        description="Recommendations for future research based on identified gaps."
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _summaries_to_text(summaries: list[dict[str, Any]]) -> str:
    """Render a list of summary dicts as numbered text blocks for the prompt."""

    parts: list[str] = []
    for idx, s in enumerate(summaries, 1):
        block = (
            f"### Investigation {idx}\n"
            f"**Objective:** {s.get('primary_objective', 'N/A')}\n"
            f"**Fuel:** {s.get('fuel_material', 'N/A')} ({s.get('fuel_type', 'N/A')}), "
            f"shape: {s.get('fuel_shape', 'N/A')}\n"
            f"**Atmosphere:** O2={s.get('oxygen_pct', 'N/A')}%, "
            f"P={s.get('pressure_psi', 'N/A')} psi, "
            f"diluent={s.get('diluent', 'N/A')}, "
            f"flow={s.get('flow_velocity_cm_s', 'N/A')} cm/s\n"
            f"**Gravity:** {s.get('gravity_condition', 'N/A')}\n"
            f"**Fire-safety pillar:** {s.get('fire_safety_pillar', 'N/A')}\n"
            f"**Habitat relevance:** {s.get('habitat_relevance', 'N/A')} — "
            f"{s.get('habitat_relevance_justification', '')}\n"
            f"**Key findings:**\n"
        )
        for finding in s.get("key_findings", []):
            block += f"  - {finding}\n"
        parts.append(block)
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Comparator chain
# ---------------------------------------------------------------------------


class CrossInvestigationComparator:
    """Compare 2-4 investigations via summarisation + comparison LLM chain.

    Parameters
    ----------
    llm:
        Chat model for the comparison step.  Defaults to ``ChatOpenAI(
        model="gpt-4o-mini", temperature=0)``.
    summarizer:
        An ``InvestigationSummarizer`` instance.  One is created automatically
        if not supplied; pass an existing one to share LLM / cache.
    """

    def __init__(
        self,
        llm: Optional[BaseChatModel] = None,
        summarizer: Optional[InvestigationSummarizer] = None,
    ) -> None:
        from src.chains.prompts import CROSS_COMPARISON_PROMPT

        if llm is None:
            from src.config import get_config
            from src.pipeline import _build_llm

            self._llm = _build_llm(get_config())
        else:
            self._llm = llm
        self._summarizer = summarizer or InvestigationSummarizer(llm=self._llm)
        self._parser = PydanticOutputParser(pydantic_object=ComparisonReport)

        # LCEL chain: passthrough → prompt → LLM → parse
        self._chain: RunnableSequence = (
            RunnablePassthrough()
            | CROSS_COMPARISON_PROMPT.partial(
                format_instructions=self._parser.get_format_instructions()
            )
            | self._llm
            | self._parser
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def compare(
        self,
        investigations: list[Investigation],
        *,
        precomputed_summaries: Optional[list[dict[str, Any]]] = None,
    ) -> ComparisonReport:
        """Compare 2-4 investigations and return a ``ComparisonReport``.

        Parameters
        ----------
        investigations:
            Between 2 and 4 ``Investigation`` objects to compare.
        precomputed_summaries:
            Optional pre-computed summaries (one per investigation, same order).
            When provided the summarisation step is skipped.

        Returns
        -------
        ComparisonReport
            Structured comparison output.

        Raises
        ------
        ValueError
            If fewer than 2 or more than 4 investigations are provided.
        """

        if not 2 <= len(investigations) <= 4:
            raise ValueError(
                f"compare() requires 2-4 investigations, got {len(investigations)}."
            )

        # Summarise each investigation (or reuse pre-computed)
        if precomputed_summaries is not None:
            summaries = precomputed_summaries
        else:
            summaries = self._summarizer.summarize_batch(investigations)

        # Annotate summaries with IDs for traceability
        for summary, inv in zip(summaries, investigations):
            summary["investigation_id"] = inv.id
            summary["acronym"] = inv.acronym

        summaries_text = _summaries_to_text(summaries)

        result: ComparisonReport = self._chain.invoke(
            {"investigation_summaries": summaries_text}
        )
        return result

    def compare_by_hardware(
        self,
        investigations: list[Investigation],
        hardware_a: str,
        hardware_b: str,
    ) -> ComparisonReport:
        """Convenience: filter investigations by two hardware types and compare.

        Useful for the BASS-II vs SPICE (MSG/SPICE duct) comparison called out
        in the challenge description.

        Parameters
        ----------
        investigations:
            Full list of investigations to filter from.
        hardware_a, hardware_b:
            Hardware facility names (case-insensitive substring match).

        Returns
        -------
        ComparisonReport
        """

        hw_a_lower = hardware_a.lower()
        hw_b_lower = hardware_b.lower()
        selected = [
            inv
            for inv in investigations
            if hw_a_lower in inv.hardware_facility.lower()
            or hw_b_lower in inv.hardware_facility.lower()
        ]
        if len(selected) < 2:
            raise ValueError(
                f"Found only {len(selected)} investigations matching "
                f"'{hardware_a}' or '{hardware_b}'; need at least 2."
            )
        # Cap at 4
        return self.compare(selected[:4])

    def compare_shared_instruments(
        self,
        investigations: list[Investigation],
        instrument_keyword: str,
    ) -> ComparisonReport:
        """Convenience: compare investigations sharing a named instrument.

        Useful for the SAME vs DAFT shared-instrument comparison.

        Parameters
        ----------
        investigations:
            Full list of investigations.
        instrument_keyword:
            Keyword to match in sensor_type or measurement_type fields.

        Returns
        -------
        ComparisonReport
        """

        kw = instrument_keyword.lower()
        selected: list[Investigation] = []
        for inv in investigations:
            for sensor in inv.sensors:
                if (
                    kw in sensor.sensor_type.lower()
                    or kw in sensor.measurement_type.lower()
                ):
                    selected.append(inv)
                    break

        if len(selected) < 2:
            # Fall back: match related_investigations containing keyword
            for inv in investigations:
                if inv not in selected and any(
                    kw in rel.lower() for rel in inv.related_investigations
                ):
                    selected.append(inv)

        if len(selected) < 2:
            raise ValueError(
                f"Found only {len(selected)} investigations sharing "
                f"instrument '{instrument_keyword}'; need at least 2."
            )
        return self.compare(selected[:4])
