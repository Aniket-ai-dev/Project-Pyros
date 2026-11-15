"""Central configuration for the NASA Fire Safety Intelligence Engine.

All tuneable parameters — LLM provider, embedding dimensions, retrieval
hyper-parameters, and API keys — are gathered here so that every module
reads from a single source of truth.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    """Application-wide configuration.

    Attributes are grouped by subsystem.  API keys are read from the
    process environment at access time so that they are never hard-coded.
    """

    # ── LLM settings ────────────────────────────────────────────────
    llm_provider: str = os.getenv(
        "LLM_PROVIDER",
        "google" if os.getenv("GOOGLE_API_KEY") and not os.getenv("OPENAI_API_KEY") else "openai",
    )
    llm_model: str = os.getenv(
        "LLM_MODEL",
        "gemini-3.5-flash" if os.getenv("LLM_PROVIDER") == "google" or (os.getenv("GOOGLE_API_KEY") and not os.getenv("OPENAI_API_KEY")) else "gpt-4o",
    )
    llm_temperature: float = 0.1  # low for scientific accuracy
    llm_max_tokens: int = 4096

    # ── Embedding settings ──────────────────────────────────────────
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # ── Retrieval settings ──────────────────────────────────────────
    faiss_index_path: str = "data/vectorstore"
    retrieval_top_k: int = 10
    hybrid_alpha: float = 0.6  # weight for dense vs. sparse (1 = all dense)

    # ── Chunking settings ───────────────────────────────────────────
    chunk_overlap: int = 50

    # ── API keys (from environment) ─────────────────────────────────
    @property
    def openai_api_key(self) -> str:
        """Return the OpenAI API key from *OPENAI_API_KEY*."""
        return os.getenv("OPENAI_API_KEY", "")

    @property
    def google_api_key(self) -> str:
        """Return the Google API key from *GOOGLE_API_KEY*."""
        return os.getenv("GOOGLE_API_KEY", "")


def get_config() -> Config:
    """Factory that returns a default :class:`Config` instance."""
    load_dotenv()
    provider = os.getenv(
        "LLM_PROVIDER",
        "google" if os.getenv("GOOGLE_API_KEY") and not os.getenv("OPENAI_API_KEY") else "openai",
    )
    model = os.getenv(
        "LLM_MODEL",
        "gemini-3.5-flash" if provider == "google" else "gpt-4o",
    )
    return Config(
        llm_provider=provider,
        llm_model=model,
    )
