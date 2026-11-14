# 🔥 NASA Fire Safety Intelligence Engine

![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue)
![LangChain](https://img.shields.io/badge/LangChain-0.3-green)
![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen)
![Status](https://img.shields.io/badge/status-active-success)

> A Retrieval-Augmented Generation (RAG) system built on NASA's Physical Sciences Informatics (PSI) combustion-science investigations to power intelligent fire-safety reasoning for current and future space missions.

---

## Overview

The **NASA Fire Safety Intelligence Engine** ingests, structures, and reasons over two decades of microgravity combustion-science experiments from the [NASA PSI database](https://psi.nasa.gov). It enables researchers, mission planners, and safety engineers to:

- **Query** the complete corpus of ISS fire-safety investigations in natural language.
- **Compare** experiments across hardware, fuels, atmospheres, and gravity conditions.
- **Rank** investigations by relevance to a specific fire scenario.
- **Extrapolate** microgravity findings to partial-gravity environments (Lunar, Martian) using physics-bounded reasoning.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Query / Scenario                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   NASAFireSafetyPipeline                         │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────────────┐ │
│  │  Config   │  │  Intent Router │  │  LLM  (OpenAI / Google) │ │
│  └──────────┘  └───────┬────────┘  └──────────────────────────┘ │
│                        │                                         │
│        ┌───────────────┼───────────────────┐                     │
│        ▼               ▼                   ▼                     │
│  ┌───────────┐  ┌──────────────┐  ┌────────────────────┐        │
│  │ Summarizer│  │  Comparator  │  │ Scenario Ranker    │        │
│  └───────────┘  └──────────────┘  └────────────────────┘        │
│        │               │                   │                     │
│        └───────────────┼───────────────────┘                     │
│                        ▼                                         │
│              ┌──────────────────┐                                │
│              │ Gravity          │                                │
│              │ Extrapolator     │                                │
│              │ (LangGraph FSM)  │                                │
│              └──────────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  Hybrid      │  │  Knowledge   │  │  PSI         │
  │  Retriever   │  │  Graph       │  │  Knowledge   │
  │  (FAISS+BM25)│  │  (NetworkX)  │  │  Base        │
  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Project Structure

```
nasaspaceapp/
├── src/
│   ├── config.py                 # Central configuration
│   ├── pipeline.py               # Main pipeline orchestrator
│   ├── data/
│   │   ├── models.py             # Pydantic data models
│   │   ├── psi_knowledge_base.py # Structured investigation data
│   │   └── chunking.py           # Scientific document chunker
│   ├── knowledge/
│   │   └── graph.py              # Investigation relationship graph
│   ├── retrieval/
│   │   └── hybrid_retriever.py   # FAISS dense + BM25 sparse retrieval
│   ├── chains/
│   │   ├── summarizer.py         # Investigation summarization chain
│   │   ├── comparator.py         # Cross-investigation comparison
│   │   └── ranker.py             # Scenario relevance ranking
│   └── extrapolation/
│       ├── gravity_extrapolator.py   # LangGraph partial-g extrapolator
│       ├── physics_constraints.py    # Physics bounding rules
│       └── report_generator.py       # Markdown report formatter
├── tests/
│   └── test_pipeline.py          # Integration tests
├── requirements.txt
├── .env.example
└── README.md
```

---

## Setup

### Prerequisites

- Python 3.11 or later
- An OpenAI API key **or** a Google Generative AI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nasaspaceapp.git
cd nasaspaceapp

# Create and activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Edit .env and add your key(s)
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes (if using OpenAI) | OpenAI API key for GPT-4o & embeddings |
| `GOOGLE_API_KEY` | Yes (if using Google) | Google API key for Gemini models |

---

## Usage

### Quick Start

```python
from src.config import Config
from src.pipeline import NASAFireSafetyPipeline

# Create the pipeline (defaults to OpenAI GPT-4o)
pipeline = NASAFireSafetyPipeline()

# Initialize: chunk investigations, build vector index, build graph
pipeline.initialize()

# Ask a natural-language question
result = pipeline.query(
    "What experiments studied flame spread over solid materials in microgravity?"
)
print(result["answer"])
```

### Scenario Analysis

```python
result = pipeline.get_scenario_analysis(
    "A smoldering fire starts in crew sleeping quarters of a lunar habitat "
    "with 30% O2 at 8 psi total pressure."
)
print(result["answer"])
print("Top investigations:", result["ranked_investigations"])
if result["extrapolation"]:
    print("Gravity extrapolation:", result["extrapolation"])
```

### Compare Investigations

```python
result = pipeline.compare_investigations(["bass", "bass-ii", "saffire-i"])
print(result["answer"])
```

### Partial-Gravity Extrapolation

```python
result = pipeline.extrapolate_partial_gravity(
    "How would a candle flame behave in Martian gravity (0.38 g)?"
)
print(result["answer"])
```

### Using Google Gemini Instead of OpenAI

```python
config = Config(llm_provider="google", llm_model="gemini-1.5-pro")
pipeline = NASAFireSafetyPipeline(config=config)
pipeline.initialize()
```

---

## Module Descriptions

| Module | Purpose |
|---|---|
| **`config.py`** | Central dataclass holding all tuneable parameters — LLM, embedding, retrieval, and chunking settings. |
| **`pipeline.py`** | Orchestrates every subsystem behind a clean public API. Routes queries by intent. |
| **`data/models.py`** | Pydantic models: `FuelSpec`, `AtmosphereCondition`, `SensorConfig`, `GravityCondition`, `Investigation`. |
| **`data/psi_knowledge_base.py`** | Hand-curated, structured records for every PSI combustion investigation. |
| **`data/chunking.py`** | `ScientificChunker` splits each investigation into facet-specific LangChain `Document` chunks (overview, fuel, hardware, findings, safety context). |
| **`knowledge/graph.py`** | Builds a NetworkX directed graph encoding relationships like `SHARES_HARDWARE`, `SAME_PROJECT`, `CONTINUATION_OF`. |
| **`retrieval/hybrid_retriever.py`** | Hybrid retrieval combining FAISS dense vectors with BM25 sparse scoring, weighted by `hybrid_alpha`. |
| **`chains/summarizer.py`** | LLM chain that produces structured summaries of individual investigations. |
| **`chains/comparator.py`** | LLM chain that compares multiple investigations across dimensions (fuel, atmosphere, findings). |
| **`chains/ranker.py`** | LLM chain that ranks investigations by relevance to a user-described fire scenario. |
| **`extrapolation/gravity_extrapolator.py`** | LangGraph finite-state machine that extrapolates microgravity findings to partial-g environments. |
| **`extrapolation/physics_constraints.py`** | Hard physics bounds (buoyancy scaling, Grashof number, flame-ball radius) that gate LLM speculation. |
| **`extrapolation/report_generator.py`** | Formats extrapolation results into a structured Markdown report. |

---

## Key Design Decisions

### Why Hybrid Retrieval (FAISS + BM25)?

Scientific literature contains highly specialised terminology ("SIBAL cloth", "cool flames", "soot volume fraction") that dense embeddings alone can miss. BM25's exact-match scoring catches these domain-specific terms, while dense retrieval captures semantic similarity. The configurable `hybrid_alpha` parameter lets us tune the balance.

### Why Physics-Bounded Extrapolation?

Extrapolating microgravity combustion data to partial-gravity environments (Moon at 0.16 g, Mars at 0.38 g) is inherently uncertain. Rather than letting the LLM speculate freely, we enforce physics constraints:

- **Buoyancy-driven flow** scales with *g*, so flame shape transitions from spherical (0 g) to elongated (partial g) are bounded.
- **Grashof number** determines the transition from diffusion-dominated to buoyancy-dominated regimes.
- **Flame-ball radius** has a known inverse relationship with gravity.

The LangGraph state machine ensures every extrapolation passes through a physics validation node before reaching the report generator, and confidence scores are assigned based on how far the target gravity is from available data points.

### Why Faceted Chunking?

A single investigation spans objectives, fuels, hardware, findings, and safety relevance. Chunking by facet ensures that retrieval returns the most relevant *aspect* of an investigation, not a monolithic block. Metadata on each chunk (fuel types, O₂ range, gravity condition) enables filtered retrieval.

---

## Data Sources

All investigation data is sourced from NASA's **Physical Sciences Informatics (PSI)** system:

- 🔗 [PSI Database](https://psi.nasa.gov)
- Investigations span the ACME project (CIR hardware), droplet combustion (FLEX, CFI), solid-material flammability (BASS, Saffire), smoke detection (SAME, DAFT), and future partial-gravity experiments (SoFIE, LUCI).

---

## Running Tests

```bash
# Run the full test suite
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=src --cov-report=term-missing
```

---

## Contributing

1. **Fork** the repository.
2. **Create a feature branch**: `git checkout -b feature/my-feature`.
3. **Write tests** for new functionality.
4. **Ensure all tests pass**: `python -m pytest tests/ -v`.
5. **Submit a pull request** with a clear description.

Please follow [PEP 8](https://peps.python.org/pep-0008/) and include type hints and docstrings for all public APIs.

---

## License

This project is released under the [MIT License](LICENSE).

---

<p align="center">
  Built for the <a href="https://www.spaceappschallenge.org/">NASA Space Apps Challenge</a> 🚀
</p>
