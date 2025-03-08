import asyncio
from fastapi import HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.models.document import Document, EmbeddingStatus
from server.service.embedding.embedding_service import EmbeddingService
from server.service.embedding.epub_processing_service import EpubProcessingService
from server.service.embedding.firebase_file_downloader import FirebaseFileDownloader


async def update_document_status(session: AsyncSession, document_id: str, status: EmbeddingStatus):
    stmt = select(Document).where(Document.id == document_id)
    result = await session.execute(stmt)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.embedding_status = status
    await session.commit()


async def background_embedding_process(document_id: str, session: AsyncSession):
    stmt = select(Document).where(Document.id == document_id)
    result = await session.execute(stmt)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    await update_document_status(session, document_id, EmbeddingStatus.PROCESSING)
    downloader = FirebaseFileDownloader()

    try:
        file_path = downloader.download_epub(document.file_path)
    except Exception as e:
        await update_document_status(session, document_id, EmbeddingStatus.IDLE)
        raise HTTPException(status_code=501, detail=f"Failed to download EPUB: {str(e)}")

    epub_service = EpubProcessingService(document, session)

    try:
        await epub_service.process_and_commit(file_path)
    except Exception as e:
        await update_document_status(session, document_id, EmbeddingStatus.IDLE)
        raise HTTPException(status_code=502, detail=f"Failed to process EPUB: {str(e)}")

    await update_document_status(session, document_id, EmbeddingStatus.EMBEDDING)
    embedding_service = EmbeddingService(document, session)

    try:
        await embedding_service.parse_chapters()
    except Exception as e:
        await update_document_status(session, document_id, EmbeddingStatus.IDLE)
        raise HTTPException(status_code=503, detail=f"Failed to embed chapters: {str(e)}")

    await update_document_status(session, document_id, EmbeddingStatus.COMPLETED)

    downloader.cleanup()
