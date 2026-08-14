"""Chat WebSocket wire protocol.

Every frame is {"type": WsEvent, "payload": ...}. The event enum is
mirrored in frontend/src/lib/sockets/ws-protocol.ts — keep the two in sync.
"""
import json
from enum import Enum
from typing import Any


class WsEvent(str, Enum):
    CONTENT = "content"      # payload: str — one streamed answer token/chunk
    METADATA = "metadata"    # payload: dict — token usage / cost for the turn
    CONTEXT = "context"      # payload: list[dict] — retrieved chapters for the answer
    ERROR = "error"          # payload: dict — detail, error_id, step, code


def ws_frame(event: WsEvent, payload: Any) -> str:
    return json.dumps({"type": event.value, "payload": payload})
