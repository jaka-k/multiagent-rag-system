import json

from fastapi import APIRouter
from starlette.responses import StreamingResponse

from server.db.pubsub import session_manager

router = APIRouter()


async def sse_event_generator(session_id: str):
    print("sse_event_generator", session_id)
    session = session_manager.ensure_session(session_id)
    while True:
        event = await session.queue.get()
        print("event", event)
        # event should have an event_type and possibly other fields
        # For SSE, we might just send everything as JSON
        yield f"event: {event['event_type']}\ndata: {json.dumps(event['data'])}\n\n"


@router.get("/events/{session_id}")
async def sse_endpoint(session_id: str):
    print("sse_endpoint", session_id)
    # On connect, we have ensured a session is created by ensure_session above
    return StreamingResponse(sse_event_generator(session_id), media_type="text/event-stream", headers={
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
    })


@router.delete("/events/{session_id}")
async def close_session(session_id: str):
    # When a session ends, remove the queue
    session_manager.remove_session(session_id)
    return {"detail": "Session closed"}
