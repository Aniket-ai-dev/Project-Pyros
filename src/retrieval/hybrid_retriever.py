"""Hybrid FAISS + BM25 retriever with Reciprocal Rank Fusion.

Combines dense vector search (FAISS) with sparse keyword search (BM25)
and merges the results using Reciprocal Rank Fusion (RRF) for robust
retrieval across both semantic and lexical dimensions.
"""

from __future__ import annotations

import os
from typing import Optional

import numpy as np
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from rank_bm25 import BM25Okapi


class HybridRetriever:
    """Hybrid retriever combining FAISS dense search with BM25 sparse search.

    Uses Reciprocal Rank Fusion (RRF) to merge ranked lists from both
    retrieval backends into a single, high-quality ranking.

    Args:
        embedding_model: LangChain embedding model for dense retrieval.
            Defaults to ``OpenAIEmbeddings`` when *None*.
        faiss_index_path: Directory for persisting the FAISS index.
        alpha: Weight for dense vs sparse scores (0–1). Higher values
            favour the dense (FAISS) signal.
    """

    RRF_K: int = 60  # RRF constant to dampen high-rank influence

    def __init__(
        self,
        embedding_model=None,
        faiss_index_path: str = "data/vectorstore",
        alpha: float = 0.6,
    ) -> None:
        self.embedding_model = embedding_model or OpenAIEmbeddings()
        self.faiss_index_path = faiss_index_path
        self.alpha = alpha

        # Populated by build_index / load_index
        self._faiss_store: Optional[FAISS] = None
        self._bm25_index: Optional[BM25Okapi] = None
        self._documents: list[Document] = []

    # ------------------------------------------------------------------
    # Index building & persistence
    # ------------------------------------------------------------------

    def build_index(self, documents: list[Document]) -> None:
        """Build both FAISS and BM25 indexes from *documents*.

        The FAISS index is also saved to disk at ``self.faiss_index_path``
        so it can be reloaded later without re-embedding.

        Args:
            documents: LangChain ``Document`` objects to index.
        """
        self._documents = list(documents)

        # --- Dense (FAISS) ---
        self._faiss_store = FAISS.from_documents(
            self._documents,
            self.embedding_model,
        )
        os.makedirs(self.faiss_index_path, exist_ok=True)
        self._faiss_store.save_local(self.faiss_index_path)

        # --- Sparse (BM25) ---
        tokenized_corpus = [
            doc.page_content.lower().split() for doc in self._documents
        ]
        self._bm25_index = BM25Okapi(tokenized_corpus)

    def load_index(self) -> None:
        """Load a previously saved FAISS index from disk.

        BM25 is rebuilt from the FAISS document store because
        ``rank_bm25`` does not support serialisation.
        """
        self._faiss_store = FAISS.load_local(
            self.faiss_index_path,
            self.embedding_model,
            allow_dangerous_deserialization=True,
        )
        # Reconstruct document list and BM25 from the FAISS store
        self._documents = list(self._faiss_store.docstore._dict.values())
        tokenized_corpus = [
            doc.page_content.lower().split() for doc in self._documents
        ]
        self._bm25_index = BM25Okapi(tokenized_corpus)

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def retrieve(
        self,
        query: str,
        top_k: int = 10,
        filters: dict | None = None,
    ) -> list[Document]:
        """Retrieve documents using hybrid FAISS + BM25 with RRF.

        Args:
            query: Natural-language query string.
            top_k: Number of results to return.
            filters: Optional metadata filters. Each key is a metadata
                field and the value is the required value (or a list of
                acceptable values).

        Returns:
            Ranked list of ``Document`` objects.
        """
        results = self.retrieve_with_scores(query, top_k=top_k, filters=filters)
        return [doc for doc, _score in results]

    def retrieve_with_scores(
        self,
        query: str,
        top_k: int = 10,
        filters: dict | None = None,
    ) -> list[tuple[Document, float]]:
        """Retrieve documents with their RRF fusion scores.

        Args:
            query: Natural-language query string.
            top_k: Number of results to return.
            filters: Optional metadata filters (same semantics as
                :meth:`retrieve`).

        Returns:
            List of ``(Document, score)`` tuples sorted by descending
            combined RRF score.
        """
        if self._faiss_store is None or self._bm25_index is None:
            raise RuntimeError(
                "Index not initialised. Call build_index() or load_index() first."
            )

        # Fetch a generous candidate pool from each backend
        fetch_k = max(top_k * 4, 50)

        # --- Dense results ---
        dense_results: list[tuple[Document, float]] = (
            self._faiss_store.similarity_search_with_score(query, k=fetch_k)
        )

        # --- Sparse results ---
        tokenized_query = query.lower().split()
        bm25_scores = self._bm25_index.get_scores(tokenized_query)
        sparse_ranked_indices = np.argsort(bm25_scores)[::-1][:fetch_k]

        # Build per-document RRF scores --------------------------------
        # Map document page_content → rank for deduplication
        dense_rank: dict[int, int] = {}
        for rank, (doc, _dist) in enumerate(dense_results):
            doc_id = id(doc)
            # Try to find the matching doc in our canonical list
            for idx, stored in enumerate(self._documents):
                if stored.page_content == doc.page_content:
                    dense_rank[idx] = rank
                    break

        sparse_rank: dict[int, int] = {}
        for rank, idx in enumerate(sparse_ranked_indices):
            sparse_rank[int(idx)] = rank

        # Union of all candidate indices
        all_indices = set(dense_rank.keys()) | set(sparse_rank.keys())

        scored: list[tuple[int, float]] = []
        for idx in all_indices:
            d_score = (
                1.0 / (self.RRF_K + dense_rank[idx])
                if idx in dense_rank
                else 0.0
            )
            s_score = (
                1.0 / (self.RRF_K + sparse_rank[idx])
                if idx in sparse_rank
                else 0.0
            )
            combined = self.alpha * d_score + (1 - self.alpha) * s_score
            scored.append((idx, combined))

        scored.sort(key=lambda x: x[1], reverse=True)

        # Apply metadata filters --------------------------------------
        results: list[tuple[Document, float]] = []
        for idx, score in scored:
            doc = self._documents[idx]
            if filters and not self._matches_filters(doc, filters):
                continue
            results.append((doc, score))
            if len(results) >= top_k:
                break

        return results

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _matches_filters(doc: Document, filters: dict) -> bool:
        """Check whether *doc* metadata satisfies all *filters*.

        A filter value may be a single value (equality check) or a list
        (membership check).
        """
        for key, required in filters.items():
            actual = doc.metadata.get(key)
            if actual is None:
                return False
            if isinstance(required, list):
                if actual not in required:
                    return False
            elif actual != required:
                return False
        return True
