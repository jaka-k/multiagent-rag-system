from langchain_core.documents import Document as PGVectorDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import selectinload
from sqlmodel import select

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

        vector_store = get_vector_store(document.area.label)

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
            app_logger.warning("No new chunks to embed.")
            return

        try:
            for batch in batchify(pending_chunks):
                await vector_store.aadd_documents(documents=batch)

            for chapter, chunk_count in chapters_to_mark:
                chapter.is_embedded = True
                app_logger.info(f"Embedded {chunk_count} chunks for chapter {chapter.label}.")

            await self.db_session.commit()
            app_logger.info(
                f"Embedded {len(pending_chunks)} chunks across "
                f"{len(chapters_to_mark)} chapters successfully."
            )
        except Exception as e:
            app_logger.error(f"Failed to embed chunks: {e}")
            raise


def batchify(items, batch_size=20):
    for i in range(0, len(items), batch_size):
        yield items[i: i + batch_size]
