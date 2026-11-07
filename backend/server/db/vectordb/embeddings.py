"""Embedding function for the RAG vector store, served through OpenRouter.

Asymmetric retrieval:
    Qwen3-Embedding is instruction-aware: queries are prefixed with a task
    instruction, documents are embedded as-is. langchain-postgres calls
    embed_documents() at ingestion and embed_query() at search time, so the
    wrapper below adds the prefix on the query side only.

Dimensionality (EMBEDDING_DIM): 1536 via the `dimensions` parameter
(Matryoshka). To change it, update EMBEDDING_DIM here and add an alembic
migration recreating book_embeddings with the new vector(N) column, then
re-embed.
"""
from functools import lru_cache

from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings

from server.core.config import EMBEDDING_PROVIDER_PREFS, OPENROUTER_BASE_URL, settings
from server.core.exceptions import LlmConfigError

EMBEDDING_MODEL = settings.embedding_model
EMBEDDING_DIM = 1536
QUERY_INSTRUCTION = (
    "Instruct: Given a question about a technical book, retrieve the passages that answer it\n"
    "Query: "
)


class _InstructedQueryEmbeddings(Embeddings):
    def __init__(self, inner: Embeddings, query_instruction: str):
        self._inner = inner
        self._instruction = query_instruction

    def embed_documents(self, texts):
        return self._inner.embed_documents(texts)

    def embed_query(self, text):
        return self._inner.embed_query(self._instruction + text)

    async def aembed_documents(self, texts):
        return await self._inner.aembed_documents(texts)

    async def aembed_query(self, text):
        return await self._inner.aembed_query(self._instruction + text)


@lru_cache(maxsize=1)
def get_embedding_function() -> Embeddings:
    if not settings.openrouter_api_key:
        raise LlmConfigError("OPENROUTER_API_KEY is not set")
    inner = OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        dimensions=EMBEDDING_DIM,
        api_key=settings.openrouter_api_key,
        base_url=OPENROUTER_BASE_URL,
        check_embedding_ctx_length=False,  # else texts are sent as OpenAI token ids
        model_kwargs={"extra_body": {"provider": EMBEDDING_PROVIDER_PREFS}},
    )
    return _InstructedQueryEmbeddings(inner, QUERY_INSTRUCTION)
