# Super Intelligence (SI) Usage Disclosure

This project was developed for the NASA Space Apps Challenge 2025.

## SI Tools Used

### Code Generation
- **Tool**: Antigravity AI Assistant (powered by Claude / Gemini LLM)
- **Usage**: SI was used to assist in generating the Python backend code, including:
  - Data models and Pydantic schemas (`src/data/models.py`)
  - PSI knowledge base population (`src/data/psi_knowledge_base.py`)
  - LangChain prompt templates and chain orchestration (`src/chains/`)
  - Hybrid retrieval system (FAISS + BM25) (`src/retrieval/`)
  - Physics constraint engine (`src/extrapolator/physics_constraints.py`)
  - Gravity extrapolation pipeline (`src/extrapolator/gravity_extrapolator.py`)
  - FastAPI server (`src/api.py`)
  - Test suite (`tests/test_pipeline.py`)
- **Human contribution**: Architecture design, scientific accuracy review, challenge requirement verification, all investigation data was cross-referenced against NASA PSI database descriptions and the official challenge brief.

### Data Processing
- **Tool**: LangChain + OpenAI GPT-4o (at runtime)
- **Usage**: When an API key is provided, the system uses LLM chains for:
  - Investigation summarization
  - Cross-investigation comparison synthesis
  - Scenario-based relevance ranking
  - Partial-gravity flammability extrapolation (bounded by deterministic physics constraints)
- **Note**: The physics constraint engine (`CombustionPhysics` class) is entirely deterministic — no SI involved. It encodes textbook combustion scaling laws (Grashof number, Burke-Schumann theory, etc.) as hard mathematical bounds that the LLM must respect.

### No SI was used for:
- Images or videos (none in this project)
- Audio (none in this project)
- NASA branding or logos (none used)

## Data Sources

All investigation metadata was derived from:
1. The official NASA Space Apps Challenge 2025 brief for "Fire in Space"
2. NASA Physical Sciences Informatics (PSI) database (https://psi.nasa.gov)
3. NASA Technical Reports Server publications on ACME, FLEX, BASS, Saffire, and SAME investigations
4. Publicly available NASA investigation descriptions and published findings

No proprietary or restricted data was used.
