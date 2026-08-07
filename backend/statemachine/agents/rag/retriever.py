import uuid
from typing import Sequence

from langchain_core.documents import Document
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlmodel import select

from server.core.config import LLM_FAST_MODEL, settings
from server.core.logger import app_logger
from server.db.database import get_single_session
from server.db.vectordb.vectordb import get_vector_store
from server.models.document import Chapter
from statemachine.agents.rag.templates import RERANK_PROMPT


def _rerank_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=LLM_FAST_MODEL,
        temperature=0,
        google_api_key=settings.google_api_key,
    )


async def _rerank_chunks(
    query: str, hits: Sequence[tuple[Document, float]]
) -> list[tuple[Document, float]]:
    """Score each chunk 0-10 with Gemini Flash; fall back to vector score on parse failure."""
    if not hits:
        return []

    excerpts = "\n\n".join(
        f"[{i}] {doc.page_content[:1200]}" for i, (doc, _) in enumerate(hits)
    )
    prompt = ChatPromptTemplate.from_messages([("system", RERANK_PROMPT)])
    chain = prompt | _rerank_llm() | JsonOutputParser()

    try:
        scored: list[dict] = await chain.ainvoke({"query": query, "excerpts": excerpts})
        score_by_id = {int(item["id"]): float(item["score"]) for item in scored}
    except Exception as e:
        app_logger.warning(f"Rerank failed ({e}); falling back to vector similarity.")
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
    """
    vector_store = get_vector_store(collection)
    hits = await vector_store.asimilarity_search_with_score(query, k=k_raw)
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
    async with get_single_session() as session:
        result = await session.execute(
            select(Chapter).where(Chapter.id.in_(chapter_uuids))
        )
        chapters = {c.id: c for c in result.scalars().all()}

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
