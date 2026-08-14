"""SSE event protocol (pg_notify -> pubsub -> /api/events/{session_id}).

Each SSE frame is `event: <SseEvent>` with a JSON list of entity ids as
data. Mirrored in frontend/src/lib/sockets/sse-protocol.ts — keep in sync.
"""
from enum import Enum


class SseEvent(str, Enum):
    FLASHCARD = "flashcard"    # data: list[str] — flashcard ids to (re)fetch
    DOCUMENTS = "documents"    # data: list[str] — document ids to (re)fetch
