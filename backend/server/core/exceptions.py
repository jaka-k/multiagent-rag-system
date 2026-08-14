"""Typed exceptions for the RAG and embedding pipelines.

Each exception carries a `step` attribute that surfaces in structured logs
and error responses, so observability tools can filter by pipeline stage
without parsing free-form messages.

Error codes are five digits: the first three are the HTTP status class the
error maps to (400 bad input, 404 missing resource, 500 server-side), the
trailing two are a plain increment within that class. The HTTP handler
derives the response status from the code (`code // 100`), so a new 400xx/
404xx exception automatically surfaces with the right status. Codes are
part of the API surface — never renumber existing ones, only append.

    400xx  bad input          40001 EmbeddingParseError
    401xx  authentication     40101 UnauthorizedError
    404xx  missing resource   40401 EmbeddingDownloadError, 40402 ResourceNotFoundError
    409xx  conflict           40901 ConflictError
    500xx  server-side        50000-50007 (below)
"""


class AppError(Exception):
    """Base for application errors that surface with an observable step and code."""

    step: str = "unknown"
    code: int = 50000

    @property
    def http_status(self) -> int:
        return self.code // 100


# ── RAG pipeline ────────────────────────────────────────────────────────────


class RagError(AppError):
    step = "rag"
    code = 50001


class QueryRewriteError(RagError):
    step = "rag.query_rewrite"
    code = 50002


class RetrievalError(RagError):
    step = "rag.retrieval"
    code = 50003


class RerankError(RagError):
    """Raised only when the rerank cannot be recovered from. The retriever
    normally degrades to vector-similarity order instead of raising."""

    step = "rag.rerank"
    code = 50004


# ── Embedding pipeline ──────────────────────────────────────────────────────


class EmbeddingPipelineError(AppError):
    step = "embedding"
    code = 50005


class EmbeddingModelError(EmbeddingPipelineError):
    """Wraps failures from the embedding-model API call (e.g. Gemini 404)."""

    step = "embedding.model_call"
    code = 50006


class EmbeddingStoreError(EmbeddingPipelineError):
    """Wraps failures writing vectors to pgvector."""

    step = "embedding.store"
    code = 50007


class EmbeddingParseError(EmbeddingPipelineError):
    """The uploaded EPUB could not be parsed — bad input, not our failure."""

    step = "embedding.parse"
    code = 40001


class EmbeddingDownloadError(EmbeddingPipelineError):
    """The source file could not be fetched from Firebase Storage."""

    step = "embedding.download"
    code = 40401


# ── authn / authz / request errors ──────────────────────────────────────────


class UnauthorizedError(AppError):
    """Missing or invalid credentials on a transport without the oauth2 dep."""

    step = "auth.credentials"
    code = 40101


class ResourceNotFoundError(AppError):
    """Resource missing or not owned by the caller (ownership leaks as 404)."""

    step = "authz.ownership"
    code = 40402


class ConflictError(AppError):
    """The request is valid but conflicts with existing state (e.g. duplicate)."""

    step = "request.conflict"
    code = 40901
