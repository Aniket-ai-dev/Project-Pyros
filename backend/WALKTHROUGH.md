# NASA Fire Safety Intelligence Engine — Complete Walkthrough

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Setup & Installation](#3-setup--installation)
4. [Running the System](#4-running-the-system)
5. [Data-Only Mode (No API Key)](#5-data-only-mode-no-api-key)
6. [Full LLM Mode (With API Key)](#6-full-llm-mode-with-api-key)
7. [API Reference](#7-api-reference)
8. [Python SDK Usage](#8-python-sdk-usage)
9. [The Hardest Challenge: Gravity Extrapolator](#9-the-hardest-challenge-gravity-extrapolator)
10. [Project File Map](#10-project-file-map)

---

## 1. Project Overview

This engine processes NASA's Physical Science Informatics (PSI) database of microgravity combustion experiments. It:

- **Summarizes** 22 investigations (all 6 ACME experiments, BASS, Saffire, FLEX, SAME, DAFT, LUCI, FM2, etc.)
- **Ranks** investigations by relevance to specific fire safety scenarios
- **Compares** investigations to identify what's shared, what differs, and what gaps exist
- **Extrapolates** partial-gravity flammability from 0g and 1g data using physics-bounded AI reasoning

> [!IMPORTANT]
> The system operates in **two modes**:
> - **Data-Only Mode**: All investigation data, knowledge graph, physics computations — no API key needed
> - **Full LLM Mode**: Adds AI summarization, comparison, scenario analysis, and extrapolation — requires an OpenAI or Google API key

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FastAPI Server                           │
│                     (src/api.py, port 8000)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────────────┐ │
│  │  Knowledge    │  │  Knowledge  │  │  Physics Constraints   │ │
│  │  Base (22     │  │  Graph      │  │  (No LLM — Pure Math)  │ │
│  │  investigations│ │  (NetworkX) │  │  • Buoyancy scaling    │ │
│  │  from PSI)    │  │  352 edges  │  │  • Flame height        │ │
│  └──────┬───────┘  └──────┬──────┘  │  • Spread rate bounds  │ │
│         │                 │         │  • O₂ enhancement      │ │
│         ▼                 │         └────────────┬───────────┘ │
│  ┌──────────────┐         │                      │             │
│  │  Scientific   │         │                      │             │
│  │  Chunker      │         │                      │             │
│  │  (5 facets    │         │                      │             │
│  │   per inv.)   │         │                      │             │
│  └──────┬───────┘         │                      │             │
│         │                 │                      │             │
│         ▼                 │                      │             │
│  ┌──────────────┐         │                      │             │
│  │ Hybrid        │         │                      │             │
│  │ Retriever     │         │     ┌────────────────▼──────────┐ │
│  │ (FAISS+BM25)  │─────────┼────▶│  Gravity Extrapolator    │ │
│  └──────┬───────┘         │     │  (LangGraph pipeline)     │ │
│         │                 │     │  1. Parse scenario        │ │
│         ▼                 │     │  2. Gather 0g/1g data     │ │
│  ┌──────────────────────┐ │     │  3. Compute physics       │ │
│  │  LLM Chains (LCEL)   │ │     │  4. Bounded hypothesis    │ │
│  │  • Summarizer        │◀┘     │  5. Confidence rating     │ │
│  │  • Comparator        │       │  6. Report generation     │ │
│  │  • Scenario Ranker   │       └───────────────────────────┘ │
│  └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Setup & Installation

### Prerequisites
- Python 3.10+ installed
- `pip` package manager

### Install

```bash
cd c:\Projects\nasaspaceapp

# Install all dependencies
pip install -r requirements.txt
```

### Configure API Key (Optional — for LLM features)

```bash
# Copy the example env file
copy .env.example .env

# Edit .env and add your key:
# OPENAI_API_KEY=sk-your-key-here
# -- OR --
# GOOGLE_API_KEY=your-google-key-here
```

### Verify Installation

```bash
# Run all 25 tests
python -m pytest tests/test_pipeline.py -v
```

Expected: `25 passed`

---

## 4. Running the System

### Option A: Interactive Demo (Quick Start)

```bash
python scripts/demo.py
```

This runs through ALL data-layer features:
- Lists all 22 investigations
- Filters by pillar, relevance, fuel type
- Shows knowledge graph relationships
- Computes physics bounds for Moon, Mars, ISS, Earth
- Deep-dives into CFI-G (highest O₂ investigation)

### Option B: Interactive Web Dashboard & API Server

```bash
python -m uvicorn src.api:app --host 0.0.0.0 --port 8000
```

Then open your browser:
- **Web Mission Dashboard**: **http://localhost:8000/** or **http://localhost:8000/dashboard**
  - Interactive cards for all 22 NASA PSI investigations
  - Real-time partial-gravity flammability physics calculator with sliders
  - Pillar filters (Prevention, Detection, Suppression) & Hardware search
  - Deep-dive modals for fuels, atmosphere conditions, and sensor suites
- **Swagger API Documentation**: **http://localhost:8000/docs**
  - Interactive REST API testing for all endpoints

### Option C: Python Script

```python
from src.data.psi_knowledge_base import PSIKnowledgeBase
from src.knowledge.graph import InvestigationGraph
from src.extrapolator.physics_constraints import CombustionPhysics

kb = PSIKnowledgeBase()
graph = InvestigationGraph()
graph.build(kb.get_all())
physics = CombustionPhysics()
```

---

## 5. Data-Only Mode (No API Key)

Everything below works immediately, no API key needed.

### 5.1 Browse Investigations

```
GET http://localhost:8000/investigations
GET http://localhost:8000/investigations?pillar=PREVENTION
GET http://localhost:8000/investigations?fuel_type=solid
GET http://localhost:8000/investigations?min_relevance=0.8
GET http://localhost:8000/investigations?hardware=CIR
```

### 5.2 Get Investigation Details

```
GET http://localhost:8000/investigations/bass
GET http://localhost:8000/investigations/cfig
GET http://localhost:8000/investigations/saffire1
```

Returns full details: objectives, approach, fuels, atmosphere conditions, sensors, key findings, Earth applications.

### 5.3 Explore Relationships

```
GET http://localhost:8000/investigations/bre/related
GET http://localhost:8000/investigations/bre/related?max_hops=2
GET http://localhost:8000/investigations/same/compare/daft
```

Shows how investigations connect: shared hardware, same project, shared instruments, continuation series.

### 5.4 Compute Physics Bounds

```
POST http://localhost:8000/physics/bounds
Body: {"gravity_g": 0.16, "o2_pct": 34.0, "pressure_psi": 10.2}
```

Returns deterministic physics computations:
- Buoyancy strength (Grashof number scaling)
- Natural convection velocity
- Oxygen enhancement factor (how much more flammable at elevated O₂)
- Flame height scaling
- Flame spread rate bounds

### 5.5 Knowledge Graph Overview

```
GET http://localhost:8000/graph/summary
```

---

## 6. Full LLM Mode (With API Key)

Set `OPENAI_API_KEY` in `.env`, restart the server. These endpoints become available:

### 6.1 Natural Language Query

```
POST http://localhost:8000/query
Body: {"question": "What investigations are most relevant to fire safety in a lunar habitat?"}
```

The system detects intent and routes to the right chain:
- "Summarize BASS" → Summarization chain
- "Compare BASS and SPICE" → Comparison chain
- "What if there's a fire on Mars?" → Scenario analysis
- "Predict fire behavior at lunar gravity" → Extrapolation

### 6.2 Scenario Analysis

```
POST http://localhost:8000/scenario
Body: {"scenario": "Fire in a lunar habitat at 34% O2, 10.2 psi, with solid polymer materials burning near electrical equipment"}
```

Full pipeline: retrieve → rank → compare → extrapolate (if partial gravity).

### 6.3 Cross-Investigation Comparison

```
POST http://localhost:8000/compare
Body: {"investigation_ids": ["bass", "bass2", "spice"]}
```

Returns: shared variables, differing variables, hardware relationships, combined insight, gap analysis.

### 6.4 Partial-Gravity Extrapolation

```
POST http://localhost:8000/extrapolate
Body: {"scenario": "Predict flammability of solid polymers at lunar gravity (0.16g) in 34% oxygen at 10.2 psi"}
```

Returns the full extrapolation report with physics bounds, data endpoints, hypothesis, confidence assessment, and caveats.

---

## 7. API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Health check & system status |
| GET | `/investigations` | No | List all investigations (filterable) |
| GET | `/investigations/{id}` | No | Single investigation full details |
| GET | `/investigations/{id}/related` | No | Knowledge graph relationships |
| GET | `/investigations/{a}/compare/{b}` | No | Explain relationship between two |
| GET | `/graph/summary` | No | Graph overview |
| POST | `/physics/bounds` | No | Compute physics bounds |
| POST | `/query` | Yes | Natural language query (auto-routed) |
| POST | `/scenario` | Yes | Full scenario analysis |
| POST | `/compare` | Yes | Cross-investigation comparison |
| POST | `/extrapolate` | Yes | Partial-gravity extrapolation |

---

## 8. Python SDK Usage

### Direct Python usage (no server needed)

```python
import os
os.environ["OPENAI_API_KEY"] = "sk-..."

from src.pipeline import NASAFireSafetyPipeline

# Initialize (builds index, graph)
pipeline = NASAFireSafetyPipeline()
pipeline.initialize()

# Query
result = pipeline.query("What do we know about fire in spacecraft?")
print(result["answer"])

# Scenario analysis
result = pipeline.get_scenario_analysis(
    "Fire in a pressurized lunar rover at 34% O2 and 8 psi"
)
print(result["answer"])

# Compare investigations
result = pipeline.compare_investigations(["bass", "bass2", "saffire1"])
print(result["answer"])

# Extrapolate to partial gravity
result = pipeline.extrapolate_partial_gravity(
    "Flammability of PMMA at lunar gravity with 30% oxygen"
)
print(result["answer"])

# Get a single investigation summary
result = pipeline.get_investigation_summary("cfig")
print(result["answer"])
```

### Data-only usage (no API key, no LLM)

```python
from src.data.psi_knowledge_base import PSIKnowledgeBase
from src.data.chunking import ScientificChunker
from src.knowledge.graph import InvestigationGraph
from src.extrapolator.physics_constraints import CombustionPhysics

# Load all investigations
kb = PSIKnowledgeBase()
all_inv = kb.get_all()  # 19 Investigation objects

# Filter
prevention = kb.get_by_pillar("PREVENTION")       # 12 investigations
high_rel = kb.get_fire_safety_relevant(0.8)        # 14 investigations
solid_fuel = kb.get_by_fuel_type("solid")          # BASS, BASS-II, Saffire, etc.
cir_hw = kb.get_by_hardware("CIR")                 # BRE, E-FIELD, CFI-G

# Single investigation
bass = kb.get_by_id("bass")
print(bass.objectives)
print(bass.fuels)           # SIBAL cloth, PMMA, Nomex
print(bass.atmosphere)      # 21% O2, 18% O2, 15% O2...

# Chunk for retrieval
chunker = ScientificChunker()
docs = chunker.chunk_all(all_inv)  # 95 documents (5 facets × 19 inv.)

# Knowledge graph
graph = InvestigationGraph()
graph.build(all_inv)
hw_group = graph.get_shared_hardware_group("flex")  # [cfi, cfig, efield, bre, flex2]
explanation = graph.explain_relationship("same", "daft")

# Physics computations
physics = CombustionPhysics()
print(physics.buoyancy_strength(0.16))                  # 0.16 (Moon)
print(physics.oxygen_enhancement_factor(34.0))           # 2.38x
print(physics.natural_convection_velocity(0.16))         # 0.221 m/s
print(physics.spread_rate_bounds(0.16, 0.5, 2.0))       # (0.59, 1.32)
print(physics.flammability_limit_bounds(34, 10.2, 0.16, 12, 15))
```

---

## 9. The Hardest Challenge: Gravity Extrapolator

### The Problem

The PSI database has **zero** partial-gravity (Moon/Mars) combustion data. We only have:
- **0g data** (ISS microgravity experiments)
- **1g data** (Earth-gravity baselines)

Moon = 0.16g, Mars = 0.38g — we need to predict what happens in between.

### The Solution: Physics-Bounded LLM Reasoning

The extrapolator NEVER lets the LLM freely invent numbers. Instead:

```
Step 1: Parse scenario → extract target gravity, O₂%, pressure, fuel
Step 2: Gather endpoints → find matching 0g and 1g experimental data
Step 3: Compute physics bounds → DETERMINISTIC math, no LLM
         • Buoyancy: Gr ~ g (linear)
         • Flame height: h ~ g⁻¹
         • Convection: V ~ √(g·β·ΔT·L)
         • Spread rate: power-law + linear envelope
         • O₂ enhancement: (O₂%)^1.8
Step 4: Generate hypothesis → LLM reasons WITHIN the computed bounds
         "You MUST NOT predict values outside [A, B]"
Step 5: Assess confidence → based on data availability & bound width
Step 6: Compile report → Markdown with all sections
```

### Running the Extrapolator

```python
from src.extrapolator.gravity_extrapolator import GravityExtrapolator
from src.data.psi_knowledge_base import PSIKnowledgeBase

kb = PSIKnowledgeBase()
investigations = kb.get_fire_safety_relevant(0.7)

extrapolator = GravityExtrapolator()  # needs API key
report = extrapolator.extrapolate(
    "Predict fire behavior of solid polymer materials (PMMA) at lunar gravity "
    "(0.16g) in an atmosphere of 34% oxygen at 10.2 psi",
    investigations=investigations,
)

print(report.final_report)        # Full Markdown report
print(report.physics_bounds)      # Hard physics constraints used
print(report.confidence_assessment)
print(report.caveats)
```

### Physics Constraints (work without API key)

```python
from src.extrapolator.physics_constraints import CombustionPhysics

physics = CombustionPhysics()

# Moon scenario: 0.16g, 34% O₂
print("=== Lunar Base Fire Physics ===")
print(f"Buoyancy: {physics.buoyancy_strength(0.16):.0%} of Earth")
print(f"Convection: {physics.natural_convection_velocity(0.16):.3f} m/s")
print(f"O₂ factor: {physics.oxygen_enhancement_factor(34.0):.1f}x")

height, conf = physics.flame_height_scaling(0.16, 30.0)
print(f"Flame height: ~{height:.0f}mm (conf: {conf})")

lo, hi = physics.spread_rate_bounds(0.16, 0.5, 2.0, "upward")
print(f"Spread rate: [{lo:.2f}, {hi:.2f}] mm/s")
```

---

## 10. Project File Map

```
nasaspaceapp/
├── .env.example                    # API key template
├── requirements.txt                # Python dependencies
├── README.md                       # Project README
│
├── scripts/
│   ├── demo.py                     # Interactive demo (no API key needed)
│   └── test_api.py                 # API endpoint verification
│
├── src/
│   ├── api.py                      # FastAPI server (port 8000)
│   ├── config.py                   # Central configuration
│   ├── pipeline.py                 # Main orchestrator (wires everything)
│   │
│   ├── data/
│   │   ├── models.py               # Pydantic models (Investigation, FuelSpec, etc.)
│   │   ├── psi_knowledge_base.py   # 19 investigations with real NASA PSI data
│   │   └── chunking.py             # 5-facet scientific document chunker
│   │
│   ├── chains/
│   │   ├── prompts.py              # All LangChain prompt templates
│   │   ├── summarizer.py           # Investigation summarization (LCEL)
│   │   ├── comparator.py           # Cross-investigation comparison (LCEL)
│   │   └── ranker.py               # Scenario-based ranking (LCEL)
│   │
│   ├── retrieval/
│   │   ├── hybrid_retriever.py     # FAISS + BM25 with RRF fusion
│   │   ├── scenario_retriever.py   # Scenario-aware retrieval
│   │   └── query_expansion.py      # Query expansion for better recall
│   │
│   ├── knowledge/
│   │   └── graph.py                # NetworkX investigation relationship graph
│   │
│   └── extrapolator/
│       ├── physics_constraints.py  # Deterministic combustion scaling laws
│       ├── numerical_extractor.py  # Zero-shot parameter extraction
│       ├── gravity_extrapolator.py # LangGraph partial-gravity pipeline
│       └── report_generator.py     # Markdown report formatter
│
├── tests/
│   └── test_pipeline.py            # 25 integration tests
│
└── data/
    ├── investigations/             # (reserved for raw PSI data)
    └── vectorstore/                # (auto-generated FAISS index)
```

---

## Quick Reference

| What you want to do | Command |
|---------------------|---------|
| Run demo | `python scripts/demo.py` |
| Start API server | `python -m uvicorn src.api:app --port 8000` |
| Run tests | `python -m pytest tests/ -v` |
| Open Swagger docs | `http://localhost:8000/docs` |
| Check system health | `GET http://localhost:8000/` |
| List investigations | `GET http://localhost:8000/investigations` |
| Moon physics bounds | `POST http://localhost:8000/physics/bounds` with `{"gravity_g": 0.16, "o2_pct": 34}` |

