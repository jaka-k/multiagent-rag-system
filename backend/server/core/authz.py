"""Resource-ownership checks (see CLAUDE.md: identity comes from the token,
everything else derives from it; foreign resources 404, never 403).
Token handling lives in security.py; this module only answers "is it yours"."""
import uuid
from typing import Union

from server.core.exceptions import ResourceNotFoundError
from server.models.area import Area
from server.models.document import Chapter, Document
from server.models.flashcard import Deck, Flashcard
from server.models.session import FlashcardQueue, Session
from server.models.user import User


def _not_found() -> ResourceNotFoundError:
    return ResourceNotFoundError("Not found")


async def require_owned_area(db, area_id: Union[str, uuid.UUID], user: User) -> Area:
    area = await db.get(Area, area_id)
    if not area or area.user_id != user.id:
        raise _not_found()
    return area


async def require_owned_session(db, session_id: Union[str, uuid.UUID], user: User) -> Session:
    chat = await db.get(Session, session_id)
    if not chat or chat.user_id != user.id:
        raise _not_found()
    return chat


async def require_owned_document(db, document_id: Union[str, uuid.UUID], user: User) -> Document:
    document = await db.get(Document, document_id)
    if not document or document.user_id != user.id:
        raise _not_found()
    return document


async def require_owned_chapter(db, chapter: Chapter, user: User) -> Chapter:
    await require_owned_document(db, chapter.document_id, user)
    return chapter


async def require_owned_flashcard(db, flashcard: Flashcard, user: User) -> Flashcard:
    """Ownership via either chain: deck -> area -> user, or queue -> session -> user."""
    if flashcard.deck_id:
        deck = await db.get(Deck, flashcard.deck_id)
        if deck:
            area = await db.get(Area, deck.area_id)
            if area and area.user_id == user.id:
                return flashcard
    if flashcard.queue_id:
        queue = await db.get(FlashcardQueue, flashcard.queue_id)
        if queue:
            chat = await db.get(Session, queue.session_id)
            if chat and chat.user_id == user.id:
                return flashcard
    raise _not_found()
