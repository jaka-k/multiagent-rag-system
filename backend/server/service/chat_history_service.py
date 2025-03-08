import uuid
from typing import List

from sqlalchemy.orm import selectinload
from sqlmodel import select

from server.core.logger import app_logger
from server.db.database import get_single_session
from server.models.session import Message, Session


async def load_session_history(session_id: uuid.UUID) -> List[Message]:
    async with get_single_session() as session:
        try:
            result = await session.execute(
                select(Session)
                .options(selectinload(Session.messages))  # type: ignore
                .where(Session.id == session_id)
            )
            chat_session = result.scalar_one_or_none()
            if not chat_session:
                raise Exception("chat_session is of value None")

            return chat_session.messages
        except Exception as e:
            await session.rollback()
            app_logger.error(f"Could not load chat message history; %s", {e, session_id})
            raise e
