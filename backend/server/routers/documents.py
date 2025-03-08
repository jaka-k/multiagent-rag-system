from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.params import Depends
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.controller.embedding_controller import background_embedding_process
from server.db.database import get_session
from server.models.document import Document
from statemachine.embeddings.model import populate

router = APIRouter()


class EpubUploadRequest(BaseModel):
    title: str
    area_id: str
    user_id: str
    description: str
    file_path: str
    file_size: int
    cover_image: str


@router.get("/epub/1")
async def populate1():
    placeholder_path = "/app/tools/epub_parser/data/mastering-go.epub"
    populate(placeholder_path)
    return {"message": "This will create a flashcard in your deck", "id": 1}


@router.post("/epub-upload")
async def parse_uploaded_epub(request: EpubUploadRequest, session: AsyncSession = Depends(get_session)):
    print(request)
    body = request.model_dump()

    doc = Document(title=body["title"],
                   area_id=body["area_id"],
                   user_id=body["user_id"],
                   description=body["description"],
                   file_path=body["file_path"],
                   file_size=body["file_size"],
                   cover_image=body["cover_image"])
    session.add(doc)
    await session.commit()
    await session.refresh(doc)

    return {"message": "ok", "id": doc.id}


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

    return {"status": document.embedding_status}
