import uuid
from server.models.session import Message, Session
from sqlalchemy.ext.asyncio import AsyncSession
from statemachine.dtos.chat_dto import ChatInputDTO, MetaDataDTO


class ChatController:
    def __init__(self, chat_id: uuid.UUID, db_session: AsyncSession):
        self.chat_id = chat_id
        self.db_session = db_session

    async def save_user_message(self, chat_input: ChatInputDTO):
        try:
            user_message = Message(
                session_id=chat_input.thread_id,
                role="user",
                content=chat_input.user_input,
            )
            self.db_session.add(user_message)
            await self.db_session.commit()
            await self.db_session.refresh(user_message)
        except Exception as e:
            await self.db_session.rollback()
            # TODO: Log
            print(f"Error saving user message: {e}")
            raise e

    async def save_agent_message(self, content: str):
        try:
            agent_message = Message(
                session_id=self.chat_id,
                role="agent",
                content=content,
            )
            self.db_session.add(agent_message)
            await self.db_session.commit()
            await self.db_session.refresh(agent_message)
        except Exception as e:
            await self.db_session.rollback()
            # TODO: Log
            print(f"Error saving agent message: {e}")
            raise e

    async def update_session_metadata(self, metadata: MetaDataDTO):
        try:
            chat_session = await self.db_session.get(Session, self.chat_id)
            if chat_session:
                chat_session.total_tokens += metadata.total_tokens
                chat_session.prompt_tokens += metadata.prompt_tokens
                chat_session.completion_tokens += metadata.completion_tokens
                chat_session.total_cost += metadata.total_cost
                await self.db_session.commit()
        except Exception as e:
            await self.db_session.rollback()
            # TODO: Log
            print(f"Error updating metadata: {e}")
            raise e
