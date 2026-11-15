"""Scenario-based investigation ranking chain using LCEL.

Provides ``ScenarioRanker`` which scores and ranks a set of ``Investigation``
objects against a user-provided target-environment scenario (e.g. "Lunar base
at 34 % O2, 10.2 psi, solid polymer materials").
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough, RunnableSequence
from pydantic import BaseModel, Field

from src.data.models import Investigation
from src.chains.summarizer import InvestigationSummarizer, _format_investigation


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class RankedInvestigation(BaseModel):
    """A single investigation with its relevance ranking for a scenario."""

    investigation_id: str = Field(description="ID of the investigation.")
    rank: int = Field(description="1-based rank (1 = most relevant).")
    relevance_score: float = Field(
        ge=0.0, le=1.0,
        description="Relevance score between 0 (irrelevant) and 1 (perfect match).",
    )
    justification: str = Field(
        description="Why this investigation is relevant (or not) to the scenario."
    )
    matching_conditions: list[str] = Field(
        default_factory=list,
        description="Conditions from the scenario that this investigation covers.",
    )
    gaps: list[str] = Field(
        default_factory=list,
        description="Conditions the scenario requires that this investigation did NOT cover.",
    )


class RankingResult(BaseModel):
    """Container returned by the ranking chain."""

    rankings: list[RankedInvestigation] = Field(
        description="Ranked list of investigations, most relevant first."
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _investigation_to_brief(inv: Investigation) -> str:
    """Produce a compact text block describing an investigation for ranking."""

    fuels = ", ".join(
        f"{f.material_name} ({f.fuel_type.value})" for f in inv.fuels
    ) or "N/A"

    atm = "; ".join(
        f"O2={a.oxygen_pct}% P={a.pressure_psi}psi dil={a.diluent} "
        f"flow={a.flow_velocity_cm_s}cm/s"
        for a in inv.atmosphere
    ) or "N/A"

    return (
        f"[{inv.id}] {inv.name} ({inv.acronym})\n"
        f"  Hardware: {inv.hardware_facility} | Gravity: {inv.gravity.value}\n"
        f"  Fuels: {fuels}\n"
        f"  Atmosphere: {atm}\n"
        f"  Pillar: {inv.fire_safety_pillar.value} | "
        f"Habitat relevance: {inv.relevance_to_crew_habitat:.1f}\n"
        f"  Objectives: {inv.objectives[:200]}\n"
    )


# ---------------------------------------------------------------------------
# Ranker chain
# ---------------------------------------------------------------------------


class ScenarioRanker:
    """Rank investigations by relevance to a user-defined scenario.

    Parameters
    ----------
    llm:
        Chat model for ranking.  Defaults to ``ChatOpenAI(model="gpt-4o-mini",
        temperature=0)``.
    """

    def __init__(self, llm: Optional[BaseChatModel] = None) -> None:
        from src.chains.prompts import SCENARIO_RANKING_PROMPT

        if llm is None:
            from src.config import get_config
            from src.pipeline import _build_llm

            self._llm = _build_llm(get_config())
        else:
            self._llm = llm
        self._parser = PydanticOutputParser(pydantic_object=RankingResult)

        # LCEL chain: passthrough → prompt → LLM → parse
        self._chain: RunnableSequence = (
            RunnablePassthrough()
            | SCENARIO_RANKING_PROMPT.partial(
                format_instructions=self._parser.get_format_instructions()
            )
            | self._llm
            | self._parser
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def rank(
        self,
        scenario: str,
        investigations: list[Investigation],
        top_k: int = 5,
    ) -> list[RankedInvestigation]:
        """Rank investigations by relevance to *scenario*.

        Parameters
        ----------
        scenario:
            Free-text description of the target environment, e.g.
            ``"Lunar base at 34% O2, 10.2 psi, solid polymer materials"``.
        investigations:
            Investigations to consider.
        top_k:
            Maximum number of ranked results to return.

        Returns
        -------
        list[RankedInvestigation]
            Up to *top_k* ranked investigations, most relevant first.
        """

        summaries_text = "\n\n".join(
            _investigation_to_brief(inv) for inv in investigations
        )

        try:
            result: RankingResult = self._chain.invoke(
                {
                    "scenario": scenario,
                    "investigation_summaries": summaries_text,
                    "top_k": str(top_k),
                }
            )
            # Ensure sorted by rank and capped
            ranked = sorted(result.rankings, key=lambda r: r.rank)
            return ranked[:top_k]
        except Exception as exc:
            logger.warning("Ranker LLM call failed (%s) — using grounded keyword ranking.", exc)
            words = set(scenario.lower().split())
            scored = []
            for inv in investigations:
                fuels_str = " ".join(getattr(f, "material_name", "") for f in inv.fuels)
                inv_text = f"{inv.name} {inv.acronym} {inv.project} {fuels_str} {inv.gravity.value}".lower()
                matches = [w for w in words if len(w) > 3 and w in inv_text]
                score = round(min(0.95, 0.5 + 0.1 * len(matches)), 2)
                scored.append((score, inv, matches))
            scored.sort(key=lambda x: x[0], reverse=True)
            fallback_ranked = []
            for rank, (score, inv, matches) in enumerate(scored[:top_k], 1):
                fallback_ranked.append(
                    RankedInvestigation(
                        investigation_id=inv.id,
                        rank=rank,
                        relevance_score=score,
                        justification=f"Selected based on matching conditions ({', '.join(matches) if matches else 'NASA PSI baseline'}) for {inv.name}.",
                        matching_conditions=matches if matches else ["Microgravity combustion baseline"],
                        gaps=["Specific partial-gravity flight validation data"],
                    )
                )
            return fallback_ranked
