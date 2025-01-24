import asyncio
import json
from typing import LiteralString

import psycopg

from .config import DATABASE_URL
from ..service.sessionmanager.session_manager import SessionManager

SSE_NOTIFY_CHANNEL = "sse_notify_channel"
notifications_queue = asyncio.Queue()
session_manager = SessionManager()


async def notification_listener():
    dsn = f"postgresql://{DATABASE_URL}"  # if needed

    async with await psycopg.AsyncConnection.connect(dsn, autocommit=True) as conn:

        await conn.execute(LiteralString(f"LISTEN {SSE_NOTIFY_CHANNEL};"))
        async for notify in conn.notifies():
            await notifications_queue.put(notify.payload)


async def notification_dispatcher():
    while True:
        payload_str = await notifications_queue.get()
        payload = json.loads(payload_str)
        session_id = payload["session_id"]
        session_manager.dispatch_event(session_id, payload)


async def start_all_listeners():
    asyncio.create_task(notification_listener())
    asyncio.create_task(notification_dispatcher())
