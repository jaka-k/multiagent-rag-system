import logging

from psycopg import IntegrityError
from psycopg.errors import UniqueViolation

from server.db.dtos.epub_dto import ChapterDTO
from server.models.document import Document, Chapter
from tools.epub_parser.parser import EpubParser


class EpubProcessingService:
    def __init__(self, document: Document, db_session, epub_parser: EpubParser = None):
        self.doc = document
        self.db_session = db_session
        self.epub_parser = epub_parser or EpubParser()

    async def process_and_commit(self, epub_file_path: str):
        epub_dto = self.epub_parser.parse(epub_file_path)

        chapters_added = 0

        for idx, chapter in enumerate(epub_dto.chapters):
            new_chapter = Chapter(
                label=chapter.label,
                parent_label=chapter.parent_label,
                chapter_tag=self.format_chapter_tag(chapter),
                content=chapter.content,
                order=chapter.play_order,
                document_id=self.doc.id
            )

            try:
                self.db_session.add(new_chapter)
                await self.db_session.commit()  # Commit after each chapter
                chapters_added += 1
            except IntegrityError as e:
                await self.db_session.rollback()

                if isinstance(e.orig, UniqueViolation):
                    logging.warning(f"Skipping duplicate chapter: {new_chapter.chapter_tag}")
                else:
                    logging.error(f"Unexpected DB error: {e}")
                    raise

        logging.info(f"Committed {chapters_added} new chapters for Document ID: {self.doc.id}")

        return {
            "db_chapters_added": chapters_added
        }


    def format_chapter_tag(self, chapter: ChapterDTO):
        label = chapter.label
        parent_label = chapter.parent_label
        chunk_id = f"{self.doc.title}//{parent_label.lower()}:{label.lower()}"

        return chunk_id.replace(" ", "-")