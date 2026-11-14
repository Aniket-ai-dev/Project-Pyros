"""LangChain prompt templates for NASA PSI combustion-science analysis chains.

Provides reusable ``ChatPromptTemplate`` objects for investigation summarisation,
cross-investigation comparison, scenario-based ranking, and fire-safety insight
generation.  Every template expects plain-text or JSON input variables and
produces structured JSON output suitable for Pydantic parsing.
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

# ---------------------------------------------------------------------------
# 1. Investigation Summary
# ---------------------------------------------------------------------------

INVESTIGATION_SUMMARY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are a combustion-science analyst specialising in NASA "
                "microgravity fire-safety research.  Given raw investigation "
                "details, extract a standardised summary as JSON.\n\n"
                "Respond ONLY with valid JSON matching this schema:\n"
                "{format_instructions}"
            ),
        ),
        (
            "human",
            (
                "Summarise the following investigation.\n\n"
                "--- INVESTIGATION ---\n"
                "Name: {name}\n"
                "Acronym: {acronym}\n"
                "Project: {project}\n"
                "Hardware / Facility: {hardware_facility}\n\n"
                "Objectives:\n{objectives}\n\n"
                "Approach:\n{approach}\n\n"
                "Fuel specifications:\n{fuels}\n\n"
                "Atmosphere conditions:\n{atmosphere}\n\n"
                "Sensors / diagnostics:\n{sensors}\n\n"
                "Gravity condition: {gravity}\n"
                "Fire-safety pillar: {fire_safety_pillar}\n"
                "Key findings:\n{key_findings}\n"
                "---\n"
            ),
        ),
    ]
)

# ---------------------------------------------------------------------------
# 2. Cross-Investigation Comparison
# ---------------------------------------------------------------------------

CROSS_COMPARISON_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are a combustion-science analyst.  Given summaries of 2-4 "
                "NASA microgravity combustion investigations, produce a detailed "
                "cross-comparison.\n\n"
                "Respond ONLY with valid JSON matching this schema:\n"
                "{format_instructions}"
            ),
        ),
        (
            "human",
            (
                "Compare the following investigations:\n\n"
                "{investigation_summaries}\n\n"
                "For each pair consider:\n"
                "- BASS-II vs SPICE hardware differences\n"
                "- SAME vs DAFT shared instruments\n"
                "- Any continuation relationships (e.g. FLEX → FLEX-2)\n\n"
                "Produce a comparison covering:\n"
                "1. Shared variables across all investigations\n"
                "2. Differing variables (as a list of dicts with variable, "
                "per-investigation values, and significance)\n"
                "3. Hardware relationships\n"
                "4. Combined insight — what can we learn by looking at these "
                "together?\n"
                "5. Gap analysis — what conditions remain untested between them?\n"
                "6. Recommendations for future work\n"
            ),
        ),
    ]
)

# ---------------------------------------------------------------------------
# 3. Scenario-Based Ranking
# ---------------------------------------------------------------------------

SCENARIO_RANKING_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are a fire-safety advisor for NASA crewed missions.  "
                "Given a target scenario and a list of investigation summaries, "
                "rank the investigations by relevance to the scenario.\n\n"
                "Consider these matching criteria:\n"
                "- O2 concentration match\n"
                "- Pressure match\n"
                "- Fuel type match\n"
                "- Gravity relevance\n"
                "- Hardware capability match\n\n"
                "Respond ONLY with valid JSON matching this schema:\n"
                "{format_instructions}"
            ),
        ),
        (
            "human",
            (
                "Target scenario:\n{scenario}\n\n"
                "Investigations:\n{investigation_summaries}\n\n"
                "Rank the top {top_k} investigations by relevance.  For each, "
                "provide: investigation_id, rank, relevance_score (0-1), "
                "justification, matching_conditions, and gaps (conditions the "
                "investigation did NOT cover that the scenario requires)."
            ),
        ),
    ]
)

# ---------------------------------------------------------------------------
# 4. Safety Insight Generation
# ---------------------------------------------------------------------------

SAFETY_INSIGHT_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are a spacecraft fire-safety expert.  Using retrieved "
                "investigation data, generate actionable fire-safety "
                "recommendations for a specific environment.\n\n"
                "Structure your response as JSON matching this schema:\n"
                "{format_instructions}"
            ),
        ),
        (
            "human",
            (
                "Environment type: {environment}\n\n"
                "Retrieved investigation data:\n{investigation_data}\n\n"
                "Generate fire-safety recommendations covering:\n"
                "1. Prevention measures informed by material flammability data\n"
                "2. Detection strategies supported by investigation evidence\n"
                "3. Suppression approaches validated by experimental results\n"
                "4. Gaps in current knowledge for this environment\n"
                "5. Confidence level and evidence quality assessment\n"
            ),
        ),
    ]
)
