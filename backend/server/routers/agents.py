from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.core.security import get_current_active_user
from server.db.database import get_session
from server.models.agent import Agent
from server.models.area import Area
from server.models.user import User

router = APIRouter()


async def _require_owned_area(session: AsyncSession, area_id, user: User) -> Area:
    area = await session.get(Area, area_id)
    if not area or area.user_id != user.id:
        raise HTTPException(status_code=404, detail="Area not found")
    return area


async def _require_owned_agent(session: AsyncSession, agent_id: str, user: User) -> Agent:
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await _require_owned_area(session, agent.area_id, user)
    return agent


class AgentCreate(BaseModel):
    area_id: str
    name: str
    description: str = ""
    icon: str = "bot"
    card_type: str = "def"
    system_prompt: str = ""
    variables: List[str] = Field(default_factory=list)
    difficulty: Optional[str] = None
    model: Optional[str] = None


class AgentPatch(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    card_type: Optional[str] = None
    system_prompt: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None
    difficulty: Optional[str] = None
    model: Optional[str] = None


@router.get("/area/{area_id}/agents", response_model=List[Agent])
async def list_agents(
        area_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    await _require_owned_area(session, area_id, current_user)
    result = await session.execute(
        select(Agent).where(Agent.area_id == area_id).order_by(Agent.created_at.asc())
    )
    return result.scalars().all()


@router.post("/agents", response_model=Agent)
async def create_agent(
        request: AgentCreate,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    await _require_owned_area(session, request.area_id, current_user)
    agent = Agent(**request.model_dump())
    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent


@router.patch("/agents/{agent_id}", response_model=Agent)
async def update_agent(
        agent_id: str,
        request: AgentPatch,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    agent = await _require_owned_agent(session, agent_id, current_user)
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(agent, key, value)
    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent


@router.delete("/agents/{agent_id}")
async def delete_agent(
        agent_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    agent = await _require_owned_agent(session, agent_id, current_user)
    await session.delete(agent)
    await session.commit()
    return {"detail": "Agent deleted", "id": agent_id}
