"""Scenario-aware retrieval for fire safety assessments.

Wraps :class:`HybridRetriever` with scenario-specific query generation,
sub-query fan-out, de-duplication, and domain-aware re-ranking to
surface the most relevant combustion science evidence for a given
operational scenario.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from src.retrieval.hybrid_retriever import HybridRetriever


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class EnvironmentType(str, Enum):
    """Operational environment type for fire safety scenarios."""

    SPACECRAFT = "spacecraft"
    LUNAR_BASE = "lunar_base"
    MARS_HAB = "mars_hab"
    ROVER = "rover"


class ScenarioParams(BaseModel):
    """Structured parameters parsed from a natural-language scenario.

    Fields may be *None* when the scenario does not specify them.
    """

    environment_type: EnvironmentType = Field(
        description="Operational environment: spacecraft, lunar_base, mars_hab, or rover.",
    )
    oxygen_pct: Optional[float] = Field(
        default=None,
        description="Oxygen concentration as a percentage.",
    )
    pressure_psi: Optional[float] = Field(
        default=None,
        description="Atmospheric pressure in psi.",
    )
    fuel_types: list[str] = Field(
        default_factory=list,
        description="Fuel or material types present in the scenario.",
    )
    gravity_level: Optional[float] = Field(
        default=None,
        description="Gravity level (0 = micro, 1 = Earth, 0.16 = Moon, 0.38 = Mars).",
    )
    flow_conditions: Optional[str] = Field(
        default=None,
        description="Airflow or ventilation conditions described.",
    )
    safety_focus: Optional[str] = Field(
        default=None,
        description="Primary safety focus: prevention, detection, or suppression.",
    )


class ScenarioRetrievalResult(BaseModel):
    """Result of a scenario-driven retrieval pass."""

    scenario_params: ScenarioParams = Field(
        description="Structured parameters extracted from the scenario.",
    )
    retrieved_documents: list[Document] = Field(
        default_factory=list,
        description="Ranked list of retrieved documents.",
    )
    investigation_ids: list[str] = Field(
        default_factory=list,
        description="Unique investigation IDs present in the results.",
    )
    coverage_analysis: dict[str, str] = Field(
        default_factory=dict,
        description="Coverage assessment per scenario dimension (e.g. 'oxygen': 'well-covered').",
    )

    class Config:
        arbitrary_types_allowed = True


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_SCENARIO_PARSE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a combustion science expert at NASA. Parse the following "
            "scenario into structured parameters. Extract ONLY what is "
            "explicitly stated or clearly implied.\n\n"
            "Respond in this exact format (use null for missing values):\n"
            "environment_type: <spacecraft|lunar_base|mars_hab|rover>\n"
            "oxygen_pct: <number or null>\n"
            "pressure_psi: <number or null>\n"
            "fuel_types: <comma-separated list or empty>\n"
            "gravity_level: <number 0-1 or null>\n"
            "flow_conditions: <description or null>\n"
            "safety_focus: <prevention|detection|suppression or null>",
        ),
        ("human", "{scenario}"),
    ]
)

_SUBQUERY_GEN_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a NASA combustion science search specialist. Given a "
            "fire-safety scenario and its parsed parameters, generate 4-6 "
            "targeted sub-queries that together cover the key scientific "
            "facets of the scenario.\n\n"
            "Consider these dimensions:\n"
            "- Oxygen concentration effects on flammability\n"
            "- Material/fuel flammability under scenario conditions\n"
            "- Gravity effects on flame behaviour\n"
            "- Detection methods suitable for the environment\n"
            "- Suppression strategies for the conditions\n"
            "- Relevant ISS combustion experiments and their findings\n\n"
            "Return ONLY the queries, one per line. No numbering or "
            "explanations.",
        ),
        (
            "human",
            "Scenario: {scenario}\n\nParsed parameters:\n{params}",
        ),
    ]
)


# ---------------------------------------------------------------------------
# Retriever
# ---------------------------------------------------------------------------

class ScenarioRetriever:
    """Scenario-aware retrieval layer.

    Wraps a :class:`HybridRetriever` with scenario-specific query
    generation, sub-query fan-out, de-duplication, and domain-aware
    re-ranking.

    Args:
        hybrid_retriever: Underlying hybrid retriever instance.
        llm: LangChain chat model for scenario parsing and query
            generation. Defaults to ``ChatOpenAI(model="gpt-4o-mini")``.
    """

    # Boost weights for scenario-specific re-ranking
    _O2_OVERLAP_BOOST: float = 0.15
    _FUEL_MATCH_BOOST: float = 0.10
    _PILLAR_MATCH_BOOST: float = 0.10

    def __init__(
        self,
        hybrid_retriever: HybridRetriever,
        llm=None,
    ) -> None:
        self.retriever = hybrid_retriever
        self.llm = llm or ChatOpenAI(model="gpt-4o-mini", temperature=0.0)

    # ------------------------------------------------------------------
    # Scenario parsing
    # ------------------------------------------------------------------

    def parse_scenario(self, scenario_text: str) -> ScenarioParams:
        """Parse a natural-language scenario into :class:`ScenarioParams`.

        Args:
            scenario_text: Free-form scenario description.

        Returns:
            Structured scenario parameters.
        """
        from langchain_core.output_parsers import StrOutputParser

        chain = _SCENARIO_PARSE_PROMPT | self.llm | StrOutputParser()
        raw: str = chain.invoke({"scenario": scenario_text})
        return self._parse_raw_params(raw)

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def retrieve_for_scenario(
        self,
        scenario_text: str,
        top_k: int = 10,
    ) -> ScenarioRetrievalResult:
        """Retrieve documents relevant to *scenario_text*.

        Workflow:
        1. Parse scenario → :class:`ScenarioParams`
        2. Generate targeted sub-queries covering multiple facets
        3. Run each sub-query through the hybrid retriever
        4. De-duplicate and re-rank with scenario-specific boosting
        5. Analyse coverage

        Args:
            scenario_text: Natural-language fire-safety scenario.
            top_k: Number of final results to return.

        Returns:
            :class:`ScenarioRetrievalResult` with documents, IDs, and
            coverage analysis.
        """
        params = self.parse_scenario(scenario_text)

        # Generate sub-queries
        sub_queries = self._generate_sub_queries(scenario_text, params)

        # Fan-out retrieval
        all_results: list[tuple[Document, float]] = []
        for query in sub_queries:
            results = self.retriever.retrieve_with_scores(
                query, top_k=top_k
            )
            all_results.extend(results)

        # De-duplicate by page_content
        seen_contents: set[str] = set()
        unique_results: list[tuple[Document, float]] = []
        for doc, score in all_results:
            content_key = doc.page_content[:200]  # first 200 chars as key
            if content_key not in seen_contents:
                seen_contents.add(content_key)
                unique_results.append((doc, score))

        # Scenario-specific re-ranking
        boosted = self._apply_scenario_boosts(unique_results, params)
        boosted.sort(key=lambda x: x[1], reverse=True)
        top_results = boosted[:top_k]

        # Collect unique investigation IDs
        inv_ids: list[str] = []
        seen_ids: set[str] = set()
        for doc, _ in top_results:
            inv_id = doc.metadata.get("investigation_id", "")
            if inv_id and inv_id not in seen_ids:
                seen_ids.add(inv_id)
                inv_ids.append(inv_id)

        # Coverage analysis
        coverage = self._analyse_coverage(top_results, params)

        return ScenarioRetrievalResult(
            scenario_params=params,
            retrieved_documents=[doc for doc, _ in top_results],
            investigation_ids=inv_ids,
            coverage_analysis=coverage,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _generate_sub_queries(
        self,
        scenario_text: str,
        params: ScenarioParams,
    ) -> list[str]:
        """Generate sub-queries for *scenario_text* using the LLM."""
        from langchain_core.output_parsers import StrOutputParser

        chain = _SUBQUERY_GEN_PROMPT | self.llm | StrOutputParser()
        raw: str = chain.invoke({
            "scenario": scenario_text,
            "params": params.model_dump_json(indent=2),
        })
        queries = [
            line.strip()
            for line in raw.strip().splitlines()
            if line.strip()
        ]
        # Always include the original scenario as a query
        if scenario_text not in queries:
            queries.insert(0, scenario_text)
        return queries

    def _apply_scenario_boosts(
        self,
        results: list[tuple[Document, float]],
        params: ScenarioParams,
    ) -> list[tuple[Document, float]]:
        """Apply scenario-specific boosting to RRF scores."""
        boosted: list[tuple[Document, float]] = []
        for doc, score in results:
            boost = 0.0

            # Boost for O2 range overlap
            if params.oxygen_pct is not None:
                doc_o2_min = doc.metadata.get("oxygen_range_min")
                doc_o2_max = doc.metadata.get("oxygen_range_max")
                if doc_o2_min is not None and doc_o2_max is not None:
                    try:
                        o2_min = float(doc_o2_min)
                        o2_max = float(doc_o2_max)
                        if o2_min <= params.oxygen_pct <= o2_max:
                            boost += self._O2_OVERLAP_BOOST
                        elif abs(params.oxygen_pct - o2_min) <= 5 or abs(params.oxygen_pct - o2_max) <= 5:
                            boost += self._O2_OVERLAP_BOOST * 0.5
                    except (ValueError, TypeError):
                        pass

            # Boost for matching fuel types
            if params.fuel_types:
                doc_fuels = doc.metadata.get("fuel_types", [])
                if isinstance(doc_fuels, str):
                    doc_fuels = [doc_fuels]
                for fuel in params.fuel_types:
                    if any(
                        fuel.lower() in df.lower() or df.lower() in fuel.lower()
                        for df in doc_fuels
                    ):
                        boost += self._FUEL_MATCH_BOOST
                        break

            # Boost for matching safety pillar
            if params.safety_focus:
                doc_pillar = doc.metadata.get("pillar", "")
                if isinstance(doc_pillar, str) and doc_pillar.lower() == params.safety_focus.lower():
                    boost += self._PILLAR_MATCH_BOOST

            boosted.append((doc, score + boost))
        return boosted

    def _analyse_coverage(
        self,
        results: list[tuple[Document, float]],
        params: ScenarioParams,
    ) -> dict[str, str]:
        """Assess how well results cover each scenario dimension."""
        coverage: dict[str, str] = {}

        # Check O2 coverage
        if params.oxygen_pct is not None:
            o2_covered = any(
                _metadata_o2_overlaps(doc, params.oxygen_pct)
                for doc, _ in results
            )
            coverage["oxygen"] = "well-covered" if o2_covered else "gap — no direct O2 data match"
        else:
            coverage["oxygen"] = "not specified"

        # Check fuel coverage
        if params.fuel_types:
            fuel_found = set()
            for doc, _ in results:
                doc_fuels = doc.metadata.get("fuel_types", [])
                if isinstance(doc_fuels, str):
                    doc_fuels = [doc_fuels]
                for pf in params.fuel_types:
                    if any(pf.lower() in df.lower() for df in doc_fuels):
                        fuel_found.add(pf)
            if fuel_found == set(params.fuel_types):
                coverage["fuel_types"] = "well-covered"
            elif fuel_found:
                missing = set(params.fuel_types) - fuel_found
                coverage["fuel_types"] = f"partial — missing: {', '.join(missing)}"
            else:
                coverage["fuel_types"] = "gap — no fuel type matches"
        else:
            coverage["fuel_types"] = "not specified"

        # Check gravity coverage
        if params.gravity_level is not None:
            gravity_labels = {
                0.0: "MICROGRAVITY",
                0.16: "PARTIAL_LUNAR",
                0.38: "PARTIAL_MARS",
                1.0: "EARTH",
            }
            target_label = gravity_labels.get(
                params.gravity_level,
                f"~{params.gravity_level}g",
            )
            grav_found = any(
                doc.metadata.get("gravity_condition", "").upper()
                in ("MICROGRAVITY", target_label)
                for doc, _ in results
            )
            coverage["gravity"] = (
                "well-covered" if grav_found
                else f"gap — no data for {target_label}"
            )
        else:
            coverage["gravity"] = "not specified"

        # Check safety pillar coverage
        if params.safety_focus:
            pillar_found = any(
                doc.metadata.get("pillar", "").lower() == params.safety_focus.lower()
                for doc, _ in results
            )
            coverage["safety_pillar"] = (
                "well-covered" if pillar_found
                else f"gap — no {params.safety_focus} documents"
            )
        else:
            coverage["safety_pillar"] = "not specified"

        return coverage

    @staticmethod
    def _parse_raw_params(raw: str) -> ScenarioParams:
        """Parse the LLM's structured text output into ScenarioParams."""
        values: dict[str, str] = {}
        for line in raw.strip().splitlines():
            if ":" not in line:
                continue
            key, _, val = line.partition(":")
            values[key.strip().lower()] = val.strip()

        def _to_float(v: str) -> Optional[float]:
            if not v or v.lower() == "null":
                return None
            try:
                return float(v)
            except ValueError:
                return None

        def _to_str_or_none(v: str) -> Optional[str]:
            if not v or v.lower() == "null":
                return None
            return v

        env_raw = values.get("environment_type", "spacecraft").lower()
        try:
            env_type = EnvironmentType(env_raw)
        except ValueError:
            env_type = EnvironmentType.SPACECRAFT

        fuel_raw = values.get("fuel_types", "")
        fuels = (
            [f.strip() for f in fuel_raw.split(",") if f.strip() and f.strip().lower() != "empty"]
            if fuel_raw and fuel_raw.lower() not in ("null", "empty")
            else []
        )

        return ScenarioParams(
            environment_type=env_type,
            oxygen_pct=_to_float(values.get("oxygen_pct", "")),
            pressure_psi=_to_float(values.get("pressure_psi", "")),
            fuel_types=fuels,
            gravity_level=_to_float(values.get("gravity_level", "")),
            flow_conditions=_to_str_or_none(values.get("flow_conditions", "")),
            safety_focus=_to_str_or_none(values.get("safety_focus", "")),
        )


# ---------------------------------------------------------------------------
# Module-level helpers
# ---------------------------------------------------------------------------

def _metadata_o2_overlaps(doc: Document, target_o2: float) -> bool:
    """Check if *doc* metadata O2 range overlaps *target_o2*."""
    try:
        o2_min = float(doc.metadata.get("oxygen_range_min", 0))
        o2_max = float(doc.metadata.get("oxygen_range_max", 0))
        return o2_min <= target_o2 <= o2_max
    except (ValueError, TypeError):
        return False
