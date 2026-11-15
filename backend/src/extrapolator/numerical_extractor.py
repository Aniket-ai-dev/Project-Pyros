"""Zero-shot numerical extraction from unstructured scientific text.

Uses an LLM with a carefully crafted prompt to pull every explicitly-stated
numerical value from combustion-science text, without inferring or
calculating anything the source did not state directly.
"""

from __future__ import annotations

import json
from typing import Any, Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from src.data.models import Investigation


# ------------------------------------------------------------------ #
#  Output schema
# ------------------------------------------------------------------ #

class ExperimentalParameters(BaseModel):
    """Parameters extracted from scientific text about combustion experiments.

    Every field is ``None`` unless the source text *explicitly* states the
    value — the extractor never infers or calculates.
    """

    oxygen_pct: Optional[float] = Field(
        default=None,
        description="Oxygen concentration as a percentage (e.g. 21.0).",
    )
    pressure_psi: Optional[float] = Field(
        default=None,
        description="Total chamber pressure in psi.",
    )
    pressure_atm: Optional[float] = Field(
        default=None,
        description="Total chamber pressure in atm.",
    )
    flow_velocity_cm_s: Optional[float] = Field(
        default=None,
        description="Co-flow or forced flow velocity in cm/s.",
    )
    fuel_type: Optional[str] = Field(
        default=None,
        description="Name / type of fuel material.",
    )
    fuel_dimensions: Optional[dict[str, Any]] = Field(
        default=None,
        description="Fuel sample dimensions as key-value pairs, e.g. {'diameter_mm': 2.0}.",
    )
    temperature_K: Optional[float] = Field(
        default=None,
        description="Temperature in Kelvin.",
    )
    flame_height_mm: Optional[float] = Field(
        default=None,
        description="Visible flame height in mm.",
    )
    spread_rate_mm_s: Optional[float] = Field(
        default=None,
        description="Flame spread rate in mm/s.",
    )
    burn_time_s: Optional[float] = Field(
        default=None,
        description="Total burn time in seconds.",
    )
    gravity_level: Optional[float] = Field(
        default=None,
        description="Gravity level: 0 for microgravity, 1 for Earth gravity, fractional for partial.",
    )
    raw_values: list[dict[str, Any]] = Field(
        default_factory=list,
        description="All extracted numerical values with their surrounding context.",
    )


# ------------------------------------------------------------------ #
#  Extraction prompt
# ------------------------------------------------------------------ #

_SYSTEM_PROMPT = """\
You are a specialist scientific data extractor.  Your ONLY job is to find
every numerical value explicitly stated in the text provided by the user.

RULES — read carefully:
1. Extract ONLY values that appear verbatim in the text.
2. NEVER infer, calculate, or convert values.  If the text says "14.7 psi",
   record 14.7 psi — do NOT also output 1.0 atm.
3. For each value record:
   - "value": the number
   - "unit": the unit as written
   - "parameter": what it measures (e.g. "oxygen concentration")
   - "context": the sentence or phrase where it appears (≤ 30 words)
4. After listing all raw values, fill in the summary fields below ONLY if a
   matching raw value exists.  Leave fields as null otherwise.

Return valid JSON matching this schema EXACTLY:
{
  "oxygen_pct": <float or null>,
  "pressure_psi": <float or null>,
  "pressure_atm": <float or null>,
  "flow_velocity_cm_s": <float or null>,
  "fuel_type": <string or null>,
  "fuel_dimensions": <object or null>,
  "temperature_K": <float or null>,
  "flame_height_mm": <float or null>,
  "spread_rate_mm_s": <float or null>,
  "burn_time_s": <float or null>,
  "gravity_level": <float or null>,
  "raw_values": [
    {"value": <number>, "unit": "<unit>", "parameter": "<name>", "context": "<…>"},
    …
  ]
}

Return ONLY the JSON object — no markdown fences, no commentary.
"""


# ------------------------------------------------------------------ #
#  Extractor class
# ------------------------------------------------------------------ #

class NumericalExtractor:
    """Extract numerical experimental parameters from unstructured text.

    Uses a chat LLM with a zero-shot extraction prompt to pull every
    explicitly-stated number from combustion-science prose and map it to
    structured fields.

    Args:
        llm: A LangChain ``BaseChatModel``.  If *None*, a default
             ``ChatOpenAI(model="gpt-4o-mini", temperature=0)`` is created
             lazily on first use.
    """

    def __init__(self, llm: BaseChatModel | None = None) -> None:
        self._llm = llm

    # -- lazy init ---------------------------------------------------- #

    @property
    def llm(self) -> BaseChatModel:
        """Return (and lazily initialise) the backing LLM."""
        if self._llm is None:
            from langchain_openai import ChatOpenAI

            self._llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        return self._llm

    # -- core extraction ---------------------------------------------- #

    def extract_parameters(self, text: str) -> ExperimentalParameters:
        """Extract all numerical parameters from *text*.

        Args:
            text: Unstructured scientific prose (abstract, findings, etc.).

        Returns:
            An ``ExperimentalParameters`` instance with every field that
            could be populated from explicitly-stated values.
        """
        if not text or not text.strip():
            return ExperimentalParameters()

        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=text),
        ]

        response = self.llm.invoke(messages)
        content = response.content.strip()

        # Strip markdown fences if the LLM wrapped the JSON despite instructions
        if content.startswith("```"):
            lines = content.splitlines()
            # Remove opening ``` line and closing ``` line
            lines = [
                line
                for line in lines
                if not line.strip().startswith("```")
            ]
            content = "\n".join(lines)

        try:
            data: dict[str, Any] = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: return empty result rather than crashing
            return ExperimentalParameters()

        return ExperimentalParameters(**data)

    # -- convenience -------------------------------------------------- #

    def extract_from_investigation(
        self,
        investigation: Investigation,
    ) -> ExperimentalParameters:
        """Extract numerical parameters from an ``Investigation``'s text fields.

        Concatenates the investigation's objectives, approach, and key
        findings into a single block of text and runs extraction on it.

        Args:
            investigation: A populated ``Investigation`` model.

        Returns:
            ``ExperimentalParameters`` with values found in the text.
        """
        parts: list[str] = []
        if investigation.objectives:
            parts.append(f"Objectives: {investigation.objectives}")
        if investigation.approach:
            parts.append(f"Approach: {investigation.approach}")
        if investigation.key_findings:
            parts.append("Key findings: " + " | ".join(investigation.key_findings))

        # Include atmosphere conditions as text — they contain explicit numbers
        for atm in investigation.atmosphere:
            atm_text = (
                f"Atmosphere condition: {atm.oxygen_pct}% O2, "
                f"{atm.pressure_psi} psi, diluent {atm.diluent}"
            )
            if atm.flow_velocity_cm_s is not None:
                atm_text += f", flow velocity {atm.flow_velocity_cm_s} cm/s"
            parts.append(atm_text)

        # Include fuel specs
        for fuel in investigation.fuels:
            fuel_text = f"Fuel: {fuel.material_name} ({fuel.fuel_type.value})"
            if fuel.shape:
                fuel_text += f", shape: {fuel.shape}"
            if fuel.dimensions_mm:
                fuel_text += f", dimensions: {fuel.dimensions_mm} mm"
            parts.append(fuel_text)

        combined = "\n".join(parts)
        return self.extract_parameters(combined)
