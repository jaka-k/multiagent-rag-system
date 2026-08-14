from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from server.core.authz import require_owned_area
from server.core.security import get_current_active_user
from server.db.database import get_session
from server.models.user import User
from server.service.anki.pull_sync import sync_area

router = APIRouter()


@router.post("/anki/sync/{area_id}")
async def trigger_anki_sync(
        area_id: str,
        current_user: User = Depends(get_current_active_user),
        session: AsyncSession = Depends(get_session),
):
    """Manual pull-sync trigger for one area's deck (docs/rework/06 step 3)."""
    await require_owned_area(session, area_id, current_user)
    run = await sync_area(session, area_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Area has no Anki deck")
    return {
        "status": run.status,
        "cards_updated": run.cards_updated,
        "latest_review_id": run.latest_review_id,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "error": run.error,
    }
