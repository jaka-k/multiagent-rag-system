from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.params import Depends
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

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
async def get_area(area_id: str, session: AsyncSession = Depends(get_session)):
    area = await session.get(Area, area_id)
    if not area:
        raise HTTPException(status_code=400, detail="Area not found")
    return area


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

        anki_service = AnkiService(label)
        deck_id = anki_service.get_deck_id()
        print("DECK_ID:", deck_id)

        deck = Deck(name=area.label, area_id=area.id, anki_id=deck_id)
        print("deck:", deck)
        session.add(deck)
        await session.commit()

        return area

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f'Could not create area {e}')


@router.get("/area/{area_id}/documents", response_model=List[Document])
async def get_areas_documents(
        area_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    stmt = select(Area).options(selectinload(Area.documents)).where(Area.id == area_id)
    result = await session.execute(stmt)
    area = result.scalars().one()

    if not area.user_id == current_user.id:
        HTTPException(403, f"Insufficient permissions")

    return area.documents
