from langchain_core.documents import Document as PGVectorDocument
from sqlalchemy.orm import selectinload
from sqlmodel import select

from server.core.logger import app_logger
from server.db.vectordb.vectordb import get_vector_store
from server.models.document import Document


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

        await self.db_session.refresh(document, attribute_names=["chapters"])

        if not document:
            app_logger.error(f"Document {self.doc_id} not found in background task.")
            return

        vector_store = get_vector_store(document.area.label)

        parsed_chapters = []
        chapters_to_mark = []
        for chapter in document.chapters:
            if not chapter.is_embedded:
                parsed_chapters.append(
                    PGVectorDocument(
                        page_content=chapter.content,
                        metadata={
                            "title": document.title,
                            "chapter": chapter.parent_label,
                            "subchapter": chapter.label,
                        },
                        id=chapter.chapter_tag,
                    )
                )
                chapters_to_mark.append(chapter)
            else:
                app_logger.info(f"Skipping {chapter.label} (already embedded)")

        if not parsed_chapters:
            app_logger.warning("No new chapters to embed.")
            return

        try:
            for batch, chapter_batch in zip(
                batchify(parsed_chapters), batchify(chapters_to_mark)
            ):
                await vector_store.aadd_documents(documents=batch)
                for chapter in chapter_batch:
                    chapter.is_embedded = True

            await self.db_session.commit()
            app_logger.info(f"Embedded {len(parsed_chapters)} chapters successfully.")
        except Exception as e:
            app_logger.error(f"Failed to embed documents: {e}")
            raise


def batchify(items, batch_size=20):
    for i in range(0, len(items), batch_size):
        yield items[i: i + batch_size]
