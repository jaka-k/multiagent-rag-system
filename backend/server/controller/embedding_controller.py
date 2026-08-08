from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from server.core.exceptions import (
    EmbeddingDownloadError,
    EmbeddingParseError,
    EmbeddingPipelineError,
)
from server.core.logger import app_logger
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
        await session.close()
        raise HTTPException(status_code=404, detail="Document not found")

    log_ctx = {"doc_id": str(document_id), "file_path": document.file_path}
    downloader = FirebaseFileDownloader()

    try:
        await update_document_status(session, document_id, EmbeddingStatus.PROCESSING)

        try:
            file_path = downloader.download_epub(document.file_path)
        except EmbeddingDownloadError:
            raise
        except Exception as exc:
            raise EmbeddingDownloadError(f"Firebase download failed: {exc}") from exc

        try:
            epub_service = EpubProcessingService(document, session)
            await epub_service.process_and_commit(file_path)
        except Exception as exc:
            raise EmbeddingParseError(f"EPUB parsing failed: {exc}") from exc

        await update_document_status(session, document_id, EmbeddingStatus.EMBEDDING)
        embedding_service = EmbeddingService(document_id, session)
        await embedding_service.parse_chapters()

        await update_document_status(session, document_id, EmbeddingStatus.COMPLETED)
        app_logger.info(
            "Embedding pipeline succeeded",
            extra={"step": "embedding.complete", **log_ctx},
        )

    except EmbeddingPipelineError as exc:
        await update_document_status(session, document_id, EmbeddingStatus.FAILED)
        app_logger.error(
            f"{exc.step} failed",
            exc_info=exc,
            extra={
                "step": exc.step,
                "error_type": type(exc).__name__,
                "cause_type": type(exc.__cause__).__name__ if exc.__cause__ else None,
                **log_ctx,
            },
        )
        raise
    except Exception as exc:
        await update_document_status(session, document_id, EmbeddingStatus.FAILED)
        app_logger.error(
            "Unhandled exception in embedding pipeline",
            exc_info=exc,
            extra={
                "step": "embedding.unhandled",
                "error_type": type(exc).__name__,
                **log_ctx,
            },
        )
        raise
    finally:
        downloader.cleanup()
        await session.close()
