from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from server.core.logger import app_logger
from server.db.database import get_session
from server.db.dtos.session_dto import FQueueDTO
from server.models.flashcard import Flashcard, Deck
from server.models.session import FlashcardQueue
from server.service.anki.anki_service import AnkiService

router = APIRouter()


class FlashcardPatchRequest(BaseModel):
    area_id: str

@router.get("/flashcard-queue/{session_id}", response_model=FQueueDTO)
async def get_flashcard_queue(
        session_id: str, session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(FlashcardQueue)
        .options(selectinload(FlashcardQueue.flashcards))  # type: ignore
        .where(FlashcardQueue.session_id == session_id)
    )

    fqueue = result.scalars().first()
    if not fqueue:
        raise HTTPException(status_code=404, detail="Flashcard queue not found")
    return fqueue


@router.get("/flashcard/{flashcard_id}")
async def get_flashcard(
        flashcard_id: str, session: AsyncSession = Depends(get_session)
):
    flashcard = await session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return flashcard


@router.patch("/flashcard/{flashcard_id}")
async def add_flashcard(
        flashcard_id: str,
        request: FlashcardPatchRequest,
        session: AsyncSession = Depends(get_session),
):
    body = request.model_dump()
    statement = select(Deck).where(Deck.area_id == body["area_id"])
    results = await session.execute(statement)

    deck = results.scalars().first()
    if not deck:
        raise HTTPException(status_code=501, detail="Deck not found")

    flashcard = await session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=501, detail="Flashcard not found")

    try:
        anki_service = AnkiService(deck.name)
        anki_id = anki_service.add_flashcard(flashcard.front, flashcard.back)
        anki_service.sync()

        flashcard.anki_id = str(anki_id)
        flashcard.deck_id = deck.id
        flashcard.queue_id = None
        flashcard.queue = None
    except Exception as e :
        app_logger.error(e)
        raise HTTPException(status_code=505, detail=f'Internal server error, {e}')


    flashcard_data = flashcard.model_dump(exclude_unset=True)
    flashcard.sqlmodel_update(flashcard_data)
    session.add(flashcard)
    await session.commit()
    await session.refresh(flashcard)

    return {
        "message": "Flashcard successfully added to Anki deck",
        "id": flashcard_id,
    }


@router.delete("/flashcard/{flashcard_id}")
async def delete_flashcard(
        flashcard_id: str,
        session: AsyncSession = Depends(get_session),
):
    flashcard = await session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    await session.delete(flashcard)
    await session.commit()
    return {"detail": "Flashcard deleted successfully", "id": flashcard_id}
