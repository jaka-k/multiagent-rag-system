from langchain_chroma import Chroma
from langchain_core.documents import Document as ChromaDoc

from server.core.logger import app_logger
from server.db.vectordb.embdeddings import get_embedding_function
from server.db.vectordb.vectordb import get_vector_db_client
from server.models.document import Document


class EmbeddingService:
    def __init__(self, document: Document, db_session):
        self.doc = document
        self.db_session = db_session

    async def parse_chapters(self):
        db = Chroma(
            client=get_vector_db_client(),
            embedding_function=get_embedding_function(),
            collection_name=self.doc.area.label
        )

        for idx, chapter in enumerate(self.doc.chapters):

            if chapter.is_embedded:
                app_logger(f"Skipping {chapter.label} (already embedded)")
                continue

        doc = ChromaDoc(
            page_content=chapter.content,
            metadata={"title": self.doc.title, "chapter": chapter.parent_label, "subchapter": chapter.label}
        )

        try:
            db.add_document(doc, idx=chapter.chapter_tag)

            chapter.is_embedded = True
            await self.db_session.commit()
            app_logger.info(f"Embedded: {chapter.label}")

        except Exception as e:
            app_logger.error(f"Failed to embed {chapter.label}: {e}")
