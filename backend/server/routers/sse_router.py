import json

from fastapi import APIRouter
from starlette.responses import StreamingResponse

from server.db.pubsub import session_manager

router = APIRouter()


async def sse_event_generator(session_id: str):
    session = session_manager.ensure_session(session_id)
    while True:
        event = await session.queue.get()
        yield f"event: {event['event_type']}\ndata: {json.dumps(event['data'])}\n\n"


@router.get("/events/{session_id}")
async def sse_endpoint(session_id: str):
    return StreamingResponse(sse_event_generator(session_id), media_type="text/event-stream", headers={
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
    })


@router.delete("/events/{session_id}")
async def close_session(session_id: str):
    session_manager.remove_session(session_id)
    return {"detail": "Session closed"}
