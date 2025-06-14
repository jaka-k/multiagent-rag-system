import logging

from sqlalchemy.dialects.postgresql import insert

from server.core.logger import app_logger
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

        async with self.db_session.begin():
            for chapter in epub_dto.chapters:
                tag = self.format_chapter_tag(chapter)
                stmt = insert(Chapter).values(
                    label=chapter.label,
                    parent_label=chapter.parent_label,
                    chapter_tag=tag,
                    content=chapter.content,
                    order=chapter.play_order,
                    document_id=self.doc.id
                ).on_conflict_do_nothing(index_elements=["chapter_tag"])

                result = await self.db_session.execute(stmt)
                if result.rowcount:
                    chapters_added += 1
                else:
                    app_logger.warning(f"Skipping duplicate chapter: {tag}")

        await self.db_session.commit()

        app_logger.info(f"Committed {chapters_added} new chapters…")
        return {"db_chapters_added": chapters_added}

    def format_chapter_tag(self, chapter: ChapterDTO):
        label = chapter.label
        parent_label = chapter.parent_label
        chunk_id = f"{self.doc.title}//{parent_label.lower()}:{label.lower()}"

        return chunk_id.replace(" ", "-").replace("\t", "-")
