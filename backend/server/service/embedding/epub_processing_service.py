from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select

from server.core.logger import app_logger
from server.db.dtos.epub_dto import ChapterDTO
from server.models.chapter_html import ChapterHtml
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
        html_written = 0
        html_bytes = 0

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
                ).on_conflict_do_nothing(
                    index_elements=["chapter_tag"]
                ).returning(Chapter.id)

                result = await self.db_session.execute(stmt)
                chapter_id = result.scalar_one_or_none()
                if chapter_id:
                    chapters_added += 1
                else:
                    # Duplicate (e.g. backfill/retry) — blob still gets refreshed.
                    app_logger.warning(f"Skipping duplicate chapter: {tag}")
                    existing = await self.db_session.execute(
                        select(Chapter.id).where(Chapter.chapter_tag == tag)
                    )
                    chapter_id = existing.scalar_one_or_none()

                if chapter_id and chapter.html:
                    html_stmt = insert(ChapterHtml).values(
                        chapter_id=chapter_id,
                        html=chapter.html,
                    ).on_conflict_do_update(
                        index_elements=["chapter_id"],
                        set_={"html": chapter.html},
                    )
                    await self.db_session.execute(html_stmt)
                    html_written += 1
                    html_bytes += len(chapter.html)

        await self.db_session.commit()

        # Size telemetry so the base64-inlining decision can be revisited (doc 07).
        app_logger.info(
            f"Committed {chapters_added} new chapters, "
            f"{html_written} html blobs ({html_bytes / 1024 / 1024:.1f} MB)"
        )
        return {"db_chapters_added": chapters_added, "html_blobs": html_written}

    def format_chapter_tag(self, chapter: ChapterDTO):
        label = chapter.label
        parent_label = chapter.parent_label
        chunk_id = f"{self.doc.title}//{parent_label.lower()}:{label.lower()}"

        return chunk_id.replace(" ", "-").replace("\t", "-")
