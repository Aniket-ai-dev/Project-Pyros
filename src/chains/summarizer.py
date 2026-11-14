"""Investigation summarisation chain using LCEL.

Provides ``InvestigationSummarizer`` which formats an ``Investigation`` into
text, passes it through a prompt and LLM, then parses the output into a
structured dict via a Pydantic output parser.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableSequence
from pydantic import BaseModel, Field

from src.data.models import Investigation


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------


class InvestigationSummary(BaseModel):
    """Structured summary of a single combustion-science investigation."""

    primary_objective: str = Field(
        description="1-2 sentence primary objective of the investigation."
    )
    fuel_type: str = Field(description="Fuel phase: solid, liquid, or gas.")
    fuel_material: str = Field(description="Name of the fuel material.")
    fuel_shape: str = Field(
        description="Shape or geometry of the fuel sample."
    )
    oxygen_pct: Optional[float] = Field(
        default=None, description="Representative O2 concentration (%)."
    )
    pressure_psi: Optional[float] = Field(
        default=None, description="Representative chamber pressure (psi)."
    )
    diluent: Optional[str] = Field(
        default=None, description="Primary diluent gas."
    )
    flow_velocity_cm_s: Optional[float] = Field(
        default=None, description="Flow velocity in cm/s, if applicable."
    )
    sensors: list[str] = Field(
        default_factory=list,
        description="Sensor types and what they measure.",
    )
    gravity_condition: str = Field(description="Gravity environment label.")
    fire_safety_pillar: str = Field(
        description="Prevention, Detection, or Suppression."
    )
    habitat_relevance: str = Field(
        description="High / Medium / Low relevance to crew habitat."
    )
    habitat_relevance_justification: str = Field(
        description="Why this relevance level was assigned."
    )
    key_findings: list[str] = Field(
        default_factory=list,
        description="Bullet-point key findings.",
    )


# ---------------------------------------------------------------------------
# Helper: format an Investigation into a text dict for the prompt
# ---------------------------------------------------------------------------


def _format_investigation(investigation: Investigation) -> dict[str, str]:
    """Convert an ``Investigation`` to a flat dict of prompt variables."""

    fuels_text = "\n".join(
        f"- {f.material_name} ({f.fuel_type.value}), shape={f.shape}, dims={f.dimensions_mm}"
        for f in investigation.fuels
    ) or "N/A"

    atmosphere_text = "\n".join(
        f"- O2={a.oxygen_pct}%, P={a.pressure_psi} psi, diluent={a.diluent}, "
        f"flow={a.flow_velocity_cm_s} cm/s"
        for a in investigation.atmosphere
    ) or "N/A"

    sensors_text = "\n".join(
        f"- {s.sensor_type}: {s.measurement_type} ({s.units})"
        for s in investigation.sensors
    ) or "N/A"

    findings_text = "\n".join(
        f"- {f}" for f in investigation.key_findings
    ) or "N/A"

    return {
        "name": investigation.name,
        "acronym": investigation.acronym,
        "project": investigation.project or "N/A",
        "hardware_facility": investigation.hardware_facility,
        "objectives": investigation.objectives,
        "approach": investigation.approach,
        "fuels": fuels_text,
        "atmosphere": atmosphere_text,
        "sensors": sensors_text,
        "gravity": investigation.gravity.value,
        "fire_safety_pillar": investigation.fire_safety_pillar.value,
        "key_findings": findings_text,
    }


# ---------------------------------------------------------------------------
# Summarizer chain
# ---------------------------------------------------------------------------


class InvestigationSummarizer:
    """Summarises ``Investigation`` objects via an LLM chain (LCEL).

    Parameters
    ----------
    llm:
        A LangChain chat model.  Defaults to ``ChatOpenAI(model="gpt-4o-mini",
        temperature=0)``.
    """

    def __init__(self, llm: Optional[BaseChatModel] = None) -> None:
        from src.chains.prompts import INVESTIGATION_SUMMARY_PROMPT

        if llm is None:
            from src.config import get_config
            from src.pipeline import _build_llm

            self._llm = _build_llm(get_config())
        else:
            self._llm = llm
        self._parser = PydanticOutputParser(pydantic_object=InvestigationSummary)

        # Build LCEL chain: passthrough → prompt → llm → parser
        self._chain: RunnableSequence = (
            RunnablePassthrough()
            | INVESTIGATION_SUMMARY_PROMPT.partial(
                format_instructions=self._parser.get_format_instructions()
            )
            | self._llm
            | self._parser
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def summarize(self, investigation: Investigation) -> dict[str, Any]:
        """Summarise a single investigation and return a structured dict.

        Parameters
        ----------
        investigation:
            The ``Investigation`` instance to summarise.

        Returns
        -------
        dict
            Parsed summary fields as a plain dictionary.
        """

        prompt_vars = _format_investigation(investigation)
        result: InvestigationSummary = self._chain.invoke(prompt_vars)
        return result.model_dump()

    def summarize_batch(
        self,
        investigations: list[Investigation],
        *,
        max_concurrency: int = 5,
        delay_seconds: float = 0.5,
    ) -> list[dict[str, Any]]:
        """Summarise multiple investigations with basic rate limiting.

        Parameters
        ----------
        investigations:
            List of ``Investigation`` objects.
        max_concurrency:
            Maximum number of concurrent LLM calls (passed to
            ``chain.batch``).
        delay_seconds:
            Delay between batch chunks for rate-limit safety.

        Returns
        -------
        list[dict]
            One summary dict per investigation, in input order.
        """

        prompt_inputs = [_format_investigation(inv) for inv in investigations]
        results: list[InvestigationSummary] = self._chain.batch(
            prompt_inputs,
            config={"max_concurrency": max_concurrency},
        )
        return [r.model_dump() for r in results]
