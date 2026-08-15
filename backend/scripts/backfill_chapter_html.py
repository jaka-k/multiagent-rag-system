"""Backfill reader HTML for existing documents by re-parsing stored EPUBs.

Usage:
    poetry run backfill-chapter-html                # every completed document
    poetry run backfill-chapter-html --document <uuid>

Chapters already exist, so the re-parse upserts only the ChapterHtml blobs
(process_and_commit refreshes blobs for duplicate chapter_tags).
"""
import argparse
import asyncio
import os

from sqlmodel import select

import server.models.area  # noqa: F401 — resolve string-name relationships
import server.models.flashcard  # noqa: F401
import server.models.links  # noqa: F401
import server.models.session  # noqa: F401
import server.models.user  # noqa: F401
from server.db.database import async_session
from server.models.document import Document
from server.service.embedding.epub_processing_service import EpubProcessingService
from server.service.embedding.firebase_file_downloader import FirebaseFileDownloader


async def backfill(document_id: str | None) -> None:
    downloader = FirebaseFileDownloader()

    async with async_session() as session:
        statement = select(Document)
        if document_id:
            statement = statement.where(Document.id == document_id)
        documents = (await session.exec(statement)).all()
        # process_and_commit opens its own transaction — close the read one.
        await session.commit()

        for doc in documents:
            print(f"{doc.title} ({doc.id}) …", flush=True)
            try:
                path = downloader.download_epub(doc.file_path)
            except Exception as exc:
                print(f"  skipped — download failed: {exc}")
                continue

            try:
                stats = await EpubProcessingService(doc, session).process_and_commit(path)
                print(f"  {stats['html_blobs']} html blobs written")
            finally:
                os.unlink(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--document", default=None)
    args = parser.parse_args()
    asyncio.run(backfill(args.document))


if __name__ == "__main__":
    main()
