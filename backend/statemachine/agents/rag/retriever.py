import uuid
from functools import lru_cache
from typing import Sequence

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
from sqlmodel import select

from server.core.config import LLM_FAST_MODEL, settings
from server.core.exceptions import RetrievalError
from server.core.logger import app_logger
from server.db.database import get_single_session
from server.db.vectordb.vectordb import get_vector_store
from server.models.document import Chapter
from statemachine.agents.rag.templates import RERANK_PROMPT


class RerankItem(BaseModel):
    id: int = Field(description="Index of the excerpt as given in brackets.")
    score: float = Field(ge=0, le=10, description="Relevance 0 (unrelated) to 10 (contains the answer).")


class RerankResponse(BaseModel):
    items: list[RerankItem] = Field(description="One entry per excerpt.")


@lru_cache(maxsize=1)
def _rerank_chain() -> Runnable:
    llm = ChatGoogleGenerativeAI(
        model=LLM_FAST_MODEL,
        temperature=0,
        google_api_key=settings.google_api_key,
    ).with_structured_output(RerankResponse)
    return ChatPromptTemplate.from_messages([("system", RERANK_PROMPT)]) | llm


async def _rerank_chunks(
    query: str, hits: Sequence[tuple[Document, float]]
) -> list[tuple[Document, float]]:
    """Score each chunk 0-10 with Gemini Flash; fall back to vector score on rerank failure."""
    if not hits:
        return []

    excerpts = "\n\n".join(
        f"[{i}] {doc.page_content[:1200]}" for i, (doc, _) in enumerate(hits)
    )

    try:
        result: RerankResponse = await _rerank_chain().ainvoke(
            {"query": query, "excerpts": excerpts}
        )
        score_by_id = {item.id: item.score for item in result.items}
    except Exception as exc:
        # Degrade gracefully (vector-similarity order) — but log loudly so the
        # observability stack can alert on rising rerank failure rates.
        app_logger.error(
            "Rerank call failed; falling back to vector similarity",
            exc_info=exc,
            extra={
                "step": "rag.rerank",
                "error_type": type(exc).__name__,
                "model": LLM_FAST_MODEL,
                "hits_count": len(hits),
                "fallback_taken": True,
            },
        )
        # invert similarity distance into a relevance proxy
        return sorted(hits, key=lambda h: -h[1])

    reranked = [
        (doc, score_by_id.get(i, 0.0)) for i, (doc, _) in enumerate(hits)
    ]
    reranked.sort(key=lambda x: x[1], reverse=True)
    return reranked


async def retrieve_chapters(
    query: str,
    collection: str,
    k_chapters: int,
    k_raw: int = 20,
) -> list[Document]:
    """
    Embed-at-chunk, retrieve-at-chapter.

    1. similarity search → k_raw chunks
    2. LLM rerank → relevance score per chunk
    3. group by chapter, keep max score per chapter
    4. fetch full chapter text for the top k_chapters

    Raises RetrievalError on pgvector or chapter-lookup failures so the
    WebSocket / HTTP layer can surface a 500 with step="rag.retrieval".
    Rerank degrades gracefully and is not classified as RetrievalError.
    """
    vector_store = get_vector_store(collection)
    try:
        hits = await vector_store.asimilarity_search_with_score(query, k=k_raw)
    except Exception as exc:
        raise RetrievalError(
            f"Vector similarity search failed on collection {collection!r}: {exc}"
        ) from exc

    if not hits:
        return []

    reranked = await _rerank_chunks(query, hits)

    best_by_chapter: dict[str, tuple[float, Document]] = {}
    for doc, score in reranked:
        chapter_id = doc.metadata.get("chapter_id")
        if not chapter_id:
            continue
        if chapter_id not in best_by_chapter or score > best_by_chapter[chapter_id][0]:
            best_by_chapter[chapter_id] = (score, doc)

    top = sorted(best_by_chapter.items(), key=lambda x: x[1][0], reverse=True)[:k_chapters]
    if not top:
        return []

    chapter_uuids = [uuid.UUID(cid) for cid, _ in top]
    try:
        async with get_single_session() as session:
            result = await session.execute(
                select(Chapter).where(Chapter.id.in_(chapter_uuids))
            )
            chapters = {c.id: c for c in result.scalars().all()}
    except Exception as exc:
        raise RetrievalError(
            f"Chapter lookup failed for {len(chapter_uuids)} ids: {exc}"
        ) from exc

    docs: list[Document] = []
    for cid, (score, hit_doc) in top:
        chapter = chapters.get(uuid.UUID(cid))
        if chapter is None:
            app_logger.warning(f"Chapter {cid} hit by retrieval but missing in DB.")
            continue
        docs.append(
            Document(
                page_content=chapter.content,
                metadata={
                    "chapter_id": cid,
                    "chapter_tag": chapter.chapter_tag,
                    "chapter": chapter.parent_label,
                    "subchapter": chapter.label,
                    "title": hit_doc.metadata.get("title"),
                    "rerank_score": score,
                },
            )
        )
    return docs
