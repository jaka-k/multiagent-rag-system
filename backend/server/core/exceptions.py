"""Typed exceptions for the RAG and embedding pipelines.

Each exception carries a `step` attribute that surfaces in structured logs
and error responses, so observability tools can filter by pipeline stage
without parsing free-form messages.
"""


class AppError(Exception):
    """Base for application errors that should surface as 500s with observable context."""

    step: str = "unknown"


# ── RAG pipeline ────────────────────────────────────────────────────────────


class RagError(AppError):
    step = "rag"


class QueryRewriteError(RagError):
    step = "rag.query_rewrite"


class RetrievalError(RagError):
    step = "rag.retrieval"


class RerankError(RagError):
    """Raised only when the rerank cannot be recovered from. The retriever
    normally degrades to vector-similarity order instead of raising."""

    step = "rag.rerank"


# ── Embedding pipeline ──────────────────────────────────────────────────────


class EmbeddingPipelineError(AppError):
    step = "embedding"


class EmbeddingDownloadError(EmbeddingPipelineError):
    step = "embedding.download"


class EmbeddingParseError(EmbeddingPipelineError):
    step = "embedding.parse"


class EmbeddingModelError(EmbeddingPipelineError):
    """Wraps failures from the embedding-model API call (e.g. Gemini 404)."""

    step = "embedding.model_call"


class EmbeddingStoreError(EmbeddingPipelineError):
    """Wraps failures writing vectors to pgvector."""

    step = "embedding.store"
