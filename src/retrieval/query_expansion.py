"""Query expansion for improved recall in combustion-science retrieval.

Generates variant queries that capture different facets of a user's question,
including NASA-specific technical terminology, investigation names, hardware
identifiers, and standard combustion science vocabulary.
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI


# Technical vocabulary for NASA combustion science
_NASA_COMBUSTION_TERMS: dict[str, list[str]] = {
    "fire": [
        "combustion", "flammability", "ignition", "flame spread",
        "burning rate", "fire safety",
    ],
    "microgravity": [
        "zero gravity", "0g", "weightlessness", "reduced gravity",
        "ISS", "International Space Station",
    ],
    "lunar": [
        "Moon", "1/6 g", "0.16 g", "lunar gravity", "Artemis",
        "lunar base", "lunar habitat",
    ],
    "mars": [
        "Martian", "0.38 g", "Mars gravity", "Mars habitat",
    ],
    "oxygen": [
        "O2 concentration", "enriched oxygen", "oxygen percentage",
        "LOX", "elevated oxygen",
    ],
    "suppression": [
        "extinguishment", "fire suppression", "CO2 suppression",
        "diluent", "inerting",
    ],
    "detection": [
        "smoke detection", "aerosol detection", "smoke particle",
        "particulate sensor",
    ],
    "fuel": [
        "propellant", "flammable material", "solid fuel", "liquid fuel",
        "gaseous fuel", "droplet combustion",
    ],
    "hardware": [
        "CIR", "Combustion Integrated Rack", "MSG",
        "Microgravity Science Glovebox", "SPICE flow duct",
    ],
    "investigation": [
        "ACME", "BRE", "CFI", "CFI-G", "E-FIELD Flames",
        "FLEX", "FLEX-2", "BASS", "BASS-II", "SPICE", "SLICE",
        "Saffire", "SAME", "DAFT", "LUCI", "FM2",
    ],
}


class QueryExpander:
    """Expand user queries into multiple variant queries for better recall.

    Uses an LLM specialised for combustion science terminology to generate
    3–5 reformulations that capture different facets of the original
    question.

    Args:
        llm: LangChain chat model. Defaults to ``ChatOpenAI(model="gpt-4o-mini", temperature=0.3)``.
    """

    _EXPANSION_PROMPT = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a combustion science and fire safety search specialist "
                "for NASA's Physical Sciences Informatics (PSI) database. Your "
                "job is to take a user query and generate 3-5 alternative search "
                "queries that capture different scientific facets of the same "
                "question.\n\n"
                "Guidelines:\n"
                "- Use precise combustion science terminology.\n"
                "- Cover different aspects: fuel type, atmosphere conditions, "
                "gravity effects, measurement techniques, safety implications.\n"
                "- Include relevant NASA investigation acronyms when applicable "
                "(BRE, FLEX, BASS, Saffire, SAME, SPICE, SLICE, CFI, E-FIELD, etc.).\n"
                "- Each query should be a focused, standalone search query.\n"
                "- Do NOT number the queries or add explanations.\n\n"
                "Return ONLY the queries, one per line.",
            ),
            ("human", "{query}"),
        ]
    )

    def __init__(self, llm=None) -> None:
        self.llm = llm or ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
        self._chain = self._EXPANSION_PROMPT | self.llm | StrOutputParser()

    def expand(self, query: str) -> list[str]:
        """Generate 3–5 variant queries from *query*.

        Each variant targets a different scientific facet so that the
        union of retrieval results covers the question more broadly.

        Args:
            query: Original user query.

        Returns:
            List of expanded query strings.
        """
        raw_output: str = self._chain.invoke({"query": query})
        variants = [
            line.strip()
            for line in raw_output.strip().splitlines()
            if line.strip()
        ]
        # Ensure we keep the original as well
        if query not in variants:
            variants.insert(0, query)
        return variants

    def expand_with_technical_terms(self, query: str) -> list[str]:
        """Expand *query* and augment with NASA-specific technical terms.

        In addition to the LLM-generated variants, this method
        automatically adds terminology-enriched versions of the query
        based on keyword matching against a curated combustion science
        vocabulary.

        Args:
            query: Original user query.

        Returns:
            De-duplicated list of expanded queries.
        """
        base_expansions = self.expand(query)
        query_lower = query.lower()

        # Find matching term groups
        extra_terms: list[str] = []
        for keyword, synonyms in _NASA_COMBUSTION_TERMS.items():
            if keyword in query_lower:
                extra_terms.extend(synonyms)

        if not extra_terms:
            return base_expansions

        # Build enriched variants by appending relevant terms
        enriched_queries: list[str] = list(base_expansions)

        # Create a term-augmented version of the original query
        augmented = f"{query} {' '.join(extra_terms[:5])}"
        enriched_queries.append(augmented)

        # Add investigation-specific query if investigations are relevant
        inv_terms = _NASA_COMBUSTION_TERMS.get("investigation", [])
        matched_investigations = [
            inv for inv in inv_terms if inv.lower() in query_lower
        ]
        if matched_investigations:
            inv_query = (
                f"{' '.join(matched_investigations)} investigation "
                f"combustion experiment results findings"
            )
            enriched_queries.append(inv_query)

        # De-duplicate while preserving order
        seen: set[str] = set()
        unique: list[str] = []
        for q in enriched_queries:
            normalised = q.strip().lower()
            if normalised not in seen:
                seen.add(normalised)
                unique.append(q.strip())
        return unique
