from langchain_core.documents import Document as PGVectorDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import selectinload
from sqlmodel import select

from server.core.exceptions import EmbeddingModelError, EmbeddingStoreError
from server.core.logger import app_logger
from server.db.vectordb.vectordb import get_vector_store
from server.models.document import Document

CHUNK_SIZE_TOKENS = 1000
CHUNK_OVERLAP_TOKENS = 150
# Tried in order: prefer breaking at Markdown structural boundaries
# (headings, code-fence transitions) before falling back to paragraphs,
# sentences, words. The chapter text is Markdown produced by the EPUB
# parser, so these separators correspond to real document structure.
CHUNK_SEPARATORS = [
    "\n## ", "\n### ", "\n#### ",
    "\n\n```", "```\n",
    "\n\n", "\n", ". ", " ", "",
]

_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    encoding_name="cl100k_base",
    chunk_size=CHUNK_SIZE_TOKENS,
    chunk_overlap=CHUNK_OVERLAP_TOKENS,
    separators=CHUNK_SEPARATORS,
)


class EmbeddingService:
    def __init__(self, document_id: str, db_session):
        self.doc_id = document_id
        self.db_session = db_session

    async def parse_chapters(self):
        stmt = (
            select(Document)
            .options(selectinload(Document.chapters),
                     selectinload(Document.area))
            .where(Document.id == self.doc_id)
        )
        result = await self.db_session.execute(stmt)
        document = result.scalar_one_or_none()

        if not document:
            app_logger.error(f"Document {self.doc_id} not found in background task.")
            return

        vector_store = await get_vector_store()
        area_label = document.area.label

        pending_chunks: list[PGVectorDocument] = []
        chapters_to_mark = []
        for chapter in document.chapters:
            if chapter.is_embedded:
                app_logger.info(f"Skipping {chapter.label} (already embedded)")
                continue

            chunks = _splitter.split_text(chapter.content or "")
            if not chunks:
                app_logger.warning(f"Chapter {chapter.label} produced no chunks; skipping.")
                continue

            for chunk_index, chunk_text in enumerate(chunks):
                pending_chunks.append(
                    PGVectorDocument(
                        page_content=chunk_text,
                        metadata={
                            "area": area_label,
                            "title": document.title,
                            "chapter": chapter.parent_label,
                            "subchapter": chapter.label,
                            "chapter_id": str(chapter.id),
                            "chapter_tag": chapter.chapter_tag,
                            "chunk_index": chunk_index,
                        },
                        id=f"{chapter.chapter_tag}-{chunk_index}",
                    )
                )
            chapters_to_mark.append((chapter, len(chunks)))

        if not pending_chunks:
            app_logger.warning(
                "No new chunks to embed",
                extra={"step": "embedding.chunk", "doc_id": str(self.doc_id)},
            )
            return

        try:
            for batch in batchify(pending_chunks):
                await vector_store.aadd_documents(documents=batch)
        except Exception as exc:
            raise _classify_vector_store_error(exc, self.doc_id, len(pending_chunks)) from exc

        for chapter, chunk_count in chapters_to_mark:
            chapter.is_embedded = True
            app_logger.info(
                "Embedded chapter",
                extra={
                    "step": "embedding.chunk",
                    "doc_id": str(self.doc_id),
                    "chapter_id": str(chapter.id),
                    "chunk_count": chunk_count,
                },
            )

        await self.db_session.commit()
        app_logger.info(
            "Embedding pipeline completed",
            extra={
                "step": "embedding.complete",
                "doc_id": str(self.doc_id),
                "chunks": len(pending_chunks),
                "chapters": len(chapters_to_mark),
            },
        )


def _classify_vector_store_error(exc: Exception, doc_id, chunks: int):
    """Best-effort split between Gemini-side and pgvector-side failures.

    google.api_core.exceptions.* indicate the embedding API rejected the call
    (404 for retired models, 429 rate limit, 401 auth, etc); everything else
    is treated as a pgvector write failure. The original exception chains via
    `from exc` either way, so the original type lands in the error log.
    """
    module = type(exc).__module__ or ""
    if module.startswith("google.api_core") or module.startswith("google.auth"):
        return EmbeddingModelError(
            f"Embedding model call failed for doc {doc_id} ({chunks} chunks): {exc}"
        )
    return EmbeddingStoreError(
        f"Vector store write failed for doc {doc_id} ({chunks} chunks): {exc}"
    )


def batchify(items, batch_size=20):
    for i in range(0, len(items), batch_size):
        yield items[i: i + batch_size]
