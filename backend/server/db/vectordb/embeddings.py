"""Embedding function for the RAG vector store.

Asymmetric task_type:
    Gemini's embedding API ranks document-side and query-side embeddings
    against each other in trained pairs. Passing task_type="RETRIEVAL_DOCUMENT"
    when indexing and "RETRIEVAL_QUERY" when searching produces measurably
    better recall than using a single task_type for both. langchain-postgres
    calls embed_documents() during ingestion and embed_query() during
    similarity search, so we wrap two GoogleGenerativeAIEmbeddings instances
    behind the Embeddings protocol and route each call to the appropriate one.

Dimensionality (EMBEDDING_DIM):
    gemini-embedding-001 supports 128, 256, 512, 768, 1536, 3072. We default
    to 1536 as a balanced choice between storage cost (4× smaller than 3072)
    and retrieval quality (matches OpenAI ada-002 / text-embedding-3-small
    reference benchmarks). To change it, update EMBEDDING_DIM here and add
    an alembic migration recreating book_embeddings with the new vector(N)
    column, then re-embed.
"""
from functools import lru_cache

from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from server.core.config import settings

EMBEDDING_MODEL = "models/gemini-embedding-001"
EMBEDDING_DIM = 1536


class _TaskTypedGeminiEmbeddings(Embeddings):
    def __init__(self, *, model: str, output_dimensionality: int, api_key: str):
        common = {
            "model": model,
            "output_dimensionality": output_dimensionality,
            "google_api_key": api_key,
        }
        self._docs = GoogleGenerativeAIEmbeddings(**common, task_type="RETRIEVAL_DOCUMENT")
        self._query = GoogleGenerativeAIEmbeddings(**common, task_type="RETRIEVAL_QUERY")

    def embed_documents(self, texts):
        return self._docs.embed_documents(texts)

    def embed_query(self, text):
        return self._query.embed_query(text)

    async def aembed_documents(self, texts):
        return await self._docs.aembed_documents(texts)

    async def aembed_query(self, text):
        return await self._query.aembed_query(text)


@lru_cache(maxsize=1)
def get_embedding_function() -> Embeddings:
    return _TaskTypedGeminiEmbeddings(
        model=EMBEDDING_MODEL,
        output_dimensionality=EMBEDDING_DIM,
        api_key=settings.google_api_key,
    )
