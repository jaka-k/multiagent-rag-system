from fastapi import APIRouter, HTTPException
from fastapi.params import Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from server.db.database import get_session
from server.models.area import Area

router = APIRouter()


class AreaCreateRequest(BaseModel):
    name: str
    label: str
    user_id: str


@router.get("/area/{area_id}")
async def get_area(area_id: str, session: AsyncSession = Depends(get_session)):
    area = await session.get(Area, area_id)
    if not area:
        raise HTTPException(status_code=400, detail="Area not found")
    return area


@router.post("/area")
async def create_area(
        request: AreaCreateRequest,
        session: AsyncSession = Depends(get_session),
):
    body = request.model_dump()
    area = Area(name=body["name"], label=body["label"], user_id=body["user_id"])
    try:
        session.add(area)
        await session.commit()
        await session.refresh(area)
        return area

    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Could not create area {e}')
