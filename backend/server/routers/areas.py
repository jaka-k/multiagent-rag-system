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
from server.models.user import User

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
    area = Area(name=body["name"], label=body["label"], user_id=current_user.id)
    try:
        session.add(area)
        await session.commit()
        await session.refresh(area)
        return area

    except Exception as e:
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
