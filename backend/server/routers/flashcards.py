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
        note_ids = await AnkiService(deck.name).add_flashcards(
            [(flashcard.front, flashcard.back)]
        )
        if not note_ids or note_ids[0] is None:
            raise HTTPException(status_code=409, detail="Anki rejected the note (duplicate)")

        flashcard.anki_id = note_ids[0]
        flashcard.deck_id = deck.id
        flashcard.queue_id = None
        flashcard.queue = None
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(e)
        raise HTTPException(status_code=500, detail=f'Internal server error, {e}')


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


@router.get("/area/{area_id}/flashcards")
async def get_area_flashcards(
        area_id: str,
        session: AsyncSession = Depends(get_session),
):
    """Area-wide card overview: one group per chat session plus loose cards.

    Queues stay 1:1 with sessions (2026-08 decision); area scope comes from
    flashcard.queue -> session.area_id.
    """
    from sqlalchemy.orm import selectinload as sload

    from server.models.session import Session

    sessions = (await session.execute(
        select(Session)
        .options(sload(Session.flashcard_queue).selectinload(FlashcardQueue.flashcards))
        .where(Session.area_id == area_id)
        .order_by(Session.updated_at.desc())
    )).scalars().all()

    def card_dto(fc: Flashcard) -> dict:
        return {
            "id": str(fc.id),
            "front": fc.front,
            "back": fc.back,
            "tag": fc.tag,
            "anki_id": fc.anki_id,
            "created_at": fc.created_at,
        }

    queues = [
        {
            "session_id": str(s.id),
            "session_title": s.title,
            "updated_at": s.updated_at,
            "cards": [card_dto(fc) for fc in s.flashcard_queue.flashcards],
        }
        for s in sessions
        if s.flashcard_queue and s.flashcard_queue.flashcards
    ]

    loose = (await session.execute(
        select(Flashcard)
        .where(Flashcard.queue_id.is_(None), Flashcard.deck_id.is_(None))
        .order_by(Flashcard.created_at.desc())
    )).scalars().all()

    return {"queues": queues, "loose": [card_dto(fc) for fc in loose]}
