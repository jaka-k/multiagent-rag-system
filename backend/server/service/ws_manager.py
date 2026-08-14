"""Per-session WebSocket connection registry.

Multiple clients may listen on the same chat session; frames produced by
any turn are broadcast to every registered socket. Dead sockets are
dropped on send failure instead of failing the turn.
"""
import asyncio
import uuid
from typing import Dict, Set

from fastapi import WebSocket

from server.core.logger import app_logger


class SessionConnectionManager:
    def __init__(self) -> None:
        self._connections: Dict[uuid.UUID, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def register(self, chat_id: uuid.UUID, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.setdefault(chat_id, set()).add(websocket)

    async def unregister(self, chat_id: uuid.UUID, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(chat_id)
            if sockets:
                sockets.discard(websocket)
                if not sockets:
                    del self._connections[chat_id]

    async def broadcast(self, chat_id: uuid.UUID, frame: str) -> None:
        sockets = list(self._connections.get(chat_id, ()))
        for socket in sockets:
            try:
                await socket.send_text(frame)
            except Exception:
                app_logger.info(f"Dropping dead WS listener on chat {chat_id}")
                await self.unregister(chat_id, socket)


ws_manager = SessionConnectionManager()
