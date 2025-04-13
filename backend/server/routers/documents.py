import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.params import Depends
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from sqlmodel import select, SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from server.controller.embedding_controller import background_embedding_process
from server.core.security import get_current_active_user
from server.db.database import get_session
from server.models.document import Document, EmbeddingStatus, Chapter
from server.models.session import ChapterQueue
from server.models.user import User

router = APIRouter()


class EpubUploadRequest(BaseModel):
    title: str
    area_id: str
    description: str
    file_path: str
    file_size: int
    cover_image: str


class ChapterRequest(BaseModel):
    chapter_tag: str
    document_id: str


class ChapterRead(SQLModel):
    id: uuid.UUID
    label: str
    parent_label: str
    chapter_tag: str
    order: Optional[int]
    is_embedded: bool
    document_id: uuid.UUID


class ChapterQueueRead(SQLModel):
    id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime
    chapters: List[ChapterRead] = []


@router.post("/epub-upload")
async def parse_uploaded_epub(request: EpubUploadRequest, current_user: User = Depends(get_current_active_user),
                              session: AsyncSession = Depends(get_session)):
    body = request.model_dump()
    print("BODY",body)
    try:
        doc = Document(title=body["title"],
                       area_id=body["area_id"],
                       user_id=current_user.id,
                       description=body["description"],
                       file_path=body["file_path"],
                       file_size=body["file_size"],
                       cover_image=body["cover_image"])
        ## TODO: Handle all endpoints like this
    except Exception as e:
        print(e)
        raise HTTPException(status_code=423, detail={"ok": False, "message": f"Could not create document, {e}"})

    try:
        session.add(doc)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=424, detail={"ok": False, "message": f"Could not add document, {e}"})

    await session.commit()
    await session.refresh(doc)


    return {"ok": True, "message": "Document created successfully", "id": doc.id}


@router.post("/embedding/{document_id}")
async def embedd_epub(document_id: str, background_tasks: BackgroundTasks,
                      session: AsyncSession = Depends(get_session)):
    stmt = select(Document).where(Document.id == document_id)
    result = await session.execute(stmt)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    background_tasks.add_task(background_embedding_process, document_id, session)

    return {"message": "Embedding started", "id": document_id}


@router.get("/embedding-status/{document_id}")
async def embedding_status(document_id: str, session: AsyncSession = Depends(get_session)):
    stmt = select(Document).where(Document.id == document_id)
    result = await session.execute(stmt)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.embedding_status == EmbeddingStatus.IDLE:
        raise HTTPException(status_code=500, detail="Document embedding stopped abruptly")

    return {"status": document.embedding_status}


@router.get("/document/{document_id}")
async def get_document(document_id: str, session: AsyncSession = Depends(get_session)):
    stmt = select(Document).where(Document.id == document_id)
    result = await session.execute(stmt)

    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.embedding_status != EmbeddingStatus.COMPLETED:
        raise HTTPException(status_code=500, detail="Document embedding is not finished")

    return {"document": document}


@router.get("/chapter")
async def get_chapter(request: ChapterRequest, session: AsyncSession = Depends(get_session)):
    body = request.model_dump()
    stmt = select(Chapter).where(Chapter.chapter_tag == body["chapter_tag"])
    result = await session.execute(stmt)

    chapter = result.scalar_one_or_none()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    return chapter


@router.get("/chapter-queue/{chat_id}", response_model=ChapterQueueRead)
async def get_all_documents(chat_id: str, session: AsyncSession = Depends(get_session)):
    stmt = select(ChapterQueue).options(selectinload(ChapterQueue.chapters)).where(ChapterQueue.session_id == chat_id)
    result = await session.execute(stmt)

    chapter_queue = result.scalar_one_or_none()
    if not chapter_queue:
        raise HTTPException(status_code=404, detail="ChapterQueue not found")

    return chapter_queue
