from typing import List

from fastapi import APIRouter, HTTPException
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
from server.models.area import Area
from server.models.document import Document
from server.models.flashcard import Deck
from server.models.user import User
from server.service.anki.anki_service import AnkiService

router = APIRouter()


class AreaCreateRequest(BaseModel):
    name: str
    label: str


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
    body = request.model_dump()
    label = body["label"]
    area = Area(name=body["name"], label=label, user_id=current_user.id)
    try:
        session.add(area)
        await session.commit()
        await session.refresh(area)
    except Exception as e:
        app_logger.error(f"Area creation failed: {e}", exc_info=e)
        raise HTTPException(status_code=500, detail=f"Could not create area: {e}")

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
