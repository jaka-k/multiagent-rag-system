from langchain_chroma import Chroma
from langchain_core.documents import Document as ChromaDoc
from sqlalchemy.orm import selectinload
from sqlmodel import select

from server.core.logger import app_logger
from server.db.vectordb.embdeddings import get_embedding_function
from server.db.vectordb.vectordb import get_vector_db_client
from server.models.document import Document, Chapter


class EmbeddingService:
    def __init__(self, document_id: str, db_session):
        self.doc_id = document_id
        self.db_session = db_session

    async def parse_chapters(self):
        stmt = (
            select(Document)
            .options(selectinload(Document.chapters))
            .options(selectinload(Document.area))
            .where(Document.id == self.doc_id)
        )
        result = await self.db_session.execute(stmt)
        document = result.scalar_one_or_none()

        if not document:
            app_logger.error(f"Document {self.doc_id} not found in background task.")
            return

        db = Chroma(
            client=get_vector_db_client(),
            embedding_function=get_embedding_function(),
            collection_name=document.area.label
        )


        parsed_chapters = []
        for chapter in document.chapters:
            if not chapter.is_embedded:

                parsed_chapters.append(
                    ChromaDoc(
                        page_content=chapter.content,
                        metadata={
                            "title": document.title,
                            "chapter": chapter.parent_label,
                            "subchapter": chapter.label,
                        },
                        id=chapter.chapter_tag,
                    )
                )

                chapter.is_embedded = True
            else:
                app_logger.info(f"Skipping {chapter.label} (already embedded)")

        if not parsed_chapters:
            app_logger.warning("No new chapters to embed.")
            return

        try:
            db.add_documents(documents=parsed_chapters)

            await self.db_session.commit()
            app_logger.info(f"Embedded {len(parsed_chapters)} chapters successfully.")
        except Exception as e:
            app_logger.error(f"Failed to embed documents: {e}")