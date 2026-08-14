from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from server.core.logger import app_logger
from server.core.authz import require_owned_area, require_owned_flashcard, require_owned_session
from server.core.exceptions import ConflictError, ResourceNotFoundError
from server.core.security import get_current_active_user
from server.models.user import User
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
        session_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    await require_owned_session(session, session_id, current_user)
    result = await session.execute(
        select(FlashcardQueue)
        .options(selectinload(FlashcardQueue.flashcards))  # type: ignore
        .where(FlashcardQueue.session_id == session_id)
    )

    fqueue = result.scalars().first()
    if not fqueue:
        raise ResourceNotFoundError("Flashcard queue not found")
    return fqueue


@router.get("/flashcard/{flashcard_id}")
async def get_flashcard(
        flashcard_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    flashcard = await session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise ResourceNotFoundError("Flashcard not found")
    return await require_owned_flashcard(session, flashcard, current_user)


@router.patch("/flashcard/{flashcard_id}")
async def add_flashcard(
        flashcard_id: str,
        request: FlashcardPatchRequest,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    body = request.model_dump()
    await require_owned_area(session, body["area_id"], current_user)
    statement = select(Deck).where(Deck.area_id == body["area_id"])
    results = await session.execute(statement)

    deck = results.scalars().first()
    if not deck:
        raise ResourceNotFoundError("Deck not found")

    flashcard = await session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise ResourceNotFoundError("Flashcard not found")
    await require_owned_flashcard(session, flashcard, current_user)

    try:
        note_ids = await AnkiService(deck.name).add_flashcards(
            [(flashcard.front, flashcard.back)]
        )
        if not note_ids or note_ids[0] is None:
            raise ConflictError("Anki rejected the note (duplicate)")

        flashcard.anki_id = note_ids[0]
        flashcard.deck_id = deck.id
    except (ConflictError, ResourceNotFoundError):
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
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    flashcard = await session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise ResourceNotFoundError("Flashcard not found")
    await require_owned_flashcard(session, flashcard, current_user)
    await session.delete(flashcard)
    await session.commit()
    return {"detail": "Flashcard deleted successfully", "id": flashcard_id}


@router.get("/area/{area_id}/flashcards")
async def get_area_flashcards(
        area_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    """Area-wide card overview: one group per chat session plus loose cards.

    Queues stay 1:1 with sessions (2026-08 decision); area scope comes from
    flashcard.queue -> session.area_id. Review state comes from the
    AnkiCardState mirror (docs/rework/06 step 5).
    """
    await require_owned_area(session, area_id, current_user)
    from sqlalchemy.orm import selectinload as sload

    from server.models.anki_sync import AnkiCardState
    from server.models.session import Session

    sessions = (await session.execute(
        select(Session)
        .options(sload(Session.flashcard_queue).selectinload(FlashcardQueue.flashcards))
        .where(Session.area_id == area_id)
        .order_by(Session.updated_at.desc())
    )).scalars().all()

    card_ids = [
        fc.id
        for s in sessions if s.flashcard_queue
        for fc in s.flashcard_queue.flashcards
    ]
    states = {}
    if card_ids:
        states = {
            st.flashcard_id: st
            for st in (await session.execute(
                select(AnkiCardState).where(AnkiCardState.flashcard_id.in_(card_ids))
            )).scalars().all()
        }

    MASTERED_INTERVAL_DAYS = 21

    def card_dto(fc: Flashcard) -> dict:
        st = states.get(fc.id)
        return {
            "id": str(fc.id),
            "front": fc.front,
            "back": fc.back,
            "tag": fc.tag,
            "anki_id": fc.anki_id,
            "created_at": fc.created_at,
            "reps": st.reps if st else 0,
            "interval_days": st.interval_days if st else 0,
            "is_mastered": bool(st and st.interval_days >= MASTERED_INTERVAL_DAYS),
        }

    def queue_dto(s: Session) -> dict:
        cards = [card_dto(fc) for fc in s.flashcard_queue.flashcards]
        return {
            "session_id": str(s.id),
            "session_title": s.title,
            "updated_at": s.updated_at,
            "cards": cards,
            "studied": sum(1 for c in cards if c["reps"] > 0),
            "mastered": sum(1 for c in cards if c["is_mastered"]),
        }

    queues = [
        queue_dto(s)
        for s in sessions
        if s.flashcard_queue and s.flashcard_queue.flashcards
    ]

    # Loose cards have no user/area link in the current schema (doc 05 adds
    # origin/ownership for the clipper). Until then, only surface them to
    # single-tenant sessions via the area-ownership gate above.
    loose = (await session.execute(
        select(Flashcard)
        .where(Flashcard.queue_id.is_(None), Flashcard.deck_id.is_(None))
        .order_by(Flashcard.created_at.desc())
    )).scalars().all()

    return {"queues": queues, "loose": [card_dto(fc) for fc in loose]}
