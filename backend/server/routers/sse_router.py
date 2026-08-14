import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.responses import StreamingResponse

from server.core.authz import user_id_from_token
from server.db.database import get_session
from server.db.pubsub import session_manager
from server.models.session import Session

router = APIRouter()


async def sse_event_generator(session_id: str):
    session = session_manager.ensure_session(session_id)
    try:
        while True:
            event = await session.queue.get()
            yield f"event: {event['event_type']}\ndata: {json.dumps(event['data'])}\n\n"

    finally:
        session_manager.remove_session(session_id)


@router.get("/events/{session_id}")
async def sse_endpoint(
        session_id: str,
        request: Request,
        db: AsyncSession = Depends(get_session),
):
    # EventSource can't send Authorization headers; the token cookie rides
    # the credentialed fetch instead.
    auth_header = request.headers.get("authorization", "")
    token = request.cookies.get("token") or auth_header.removeprefix("Bearer ").strip()
    user_id = user_id_from_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    chat = await db.get(Session, session_id)
    if not chat or chat.user_id != user_id:
        raise HTTPException(status_code=404, detail="Not found")
    return StreamingResponse(sse_event_generator(session_id), media_type="text/event-stream", headers={
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
    })
