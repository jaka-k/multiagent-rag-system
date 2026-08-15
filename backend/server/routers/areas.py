import re
import uuid
from typing import List, Optional

from fastapi import APIRouter
from fastapi.params import Depends
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.core.authz import require_owned_area
from server.core.exceptions import ResourceNotFoundError
from server.core.logger import app_logger
from server.core.security import get_current_active_user
from server.db.database import get_session
from server.models.area import Area, color_for
from server.models.document import Document
from server.models.flashcard import Deck
from server.models.user import User
from server.service.anki.anki_service import AnkiService

router = APIRouter()


class AreaCreateRequest(BaseModel):
    name: str
    label: Optional[str] = None
    color: Optional[str] = None


def _label_from_name(name: str) -> str:
    """Slug used as the Anki deck name and pill tag."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "area"


async def _unique_label(session: AsyncSession, user_id, base: str) -> str:
    """Suffix the derived slug until it's free — colliding labels would also
    collide as Anki deck names."""
    result = await session.exec(select(Area.label).where(Area.user_id == user_id))
    taken = set(result.all())
    label, n = base, 2
    while label in taken:
        label = f"{base}-{n}"
        n += 1
    return label


@router.get("/area/{area_id}")
async def get_area(
        area_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    return await require_owned_area(session, area_id, current_user)


@router.post("/area")
async def create_area(
        request: AreaCreateRequest,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    label = request.label or await _unique_label(
        session, current_user.id, _label_from_name(request.name)
    )
    area_id = uuid.uuid4()
    area = Area(
        id=area_id,
        name=request.name,
        label=label,
        color=request.color or color_for(area_id),
        user_id=current_user.id,
    )
    session.add(area)
    await session.commit()
    await session.refresh(area)

    # Non-fatal: the area is already committed; a down AnkiConnect must not 500.
    try:
        deck_id = await AnkiService(label).ensure_deck()
        deck = Deck(name=area.label, area_id=area.id, anki_id=deck_id)
        session.add(deck)
        await session.commit()
    except Exception as e:
        app_logger.error(
            "Anki deck creation failed; area created without a deck",
            exc_info=e,
            extra={"step": "area.deck_create", "area_id": str(area.id), "label": label},
        )

    return area


@router.get("/area/{area_id}/documents", response_model=List[Document])
async def get_areas_documents(
        area_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    stmt = select(Area).options(selectinload(Area.documents)).where(Area.id == area_id)
    result = await session.execute(stmt)
    area = result.scalars().first()

    if not area or area.user_id != current_user.id:
        raise ResourceNotFoundError("Area not found")

    return area.documents
