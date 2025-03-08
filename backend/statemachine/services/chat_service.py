import uuid

from fastapi import HTTPException
from langchain_community.callbacks.manager import get_openai_callback
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.models.session import FlashcardQueue
from statemachine.agents.rag.rag_agent import LangChainChat
from statemachine.dtos.chat_dto import ChatInputDTO, ChatOutputStreamDTO


class ChatService:
    def __init__(self, chat_id: uuid.UUID, area: str, db_session: AsyncSession):
        self.chat_id = chat_id
        self.db_session = db_session
        self.langchain_chat = LangChainChat(chat_id, area)

    async def handle_chat(self, chat_input: ChatInputDTO):
        with get_openai_callback() as cb:
            response_stream = await self.langchain_chat.process_chain_input(
                chat_input.user_input, chat_input.thread_id
            )

            yield ChatOutputStreamDTO(
                raw_stream=response_stream, metadata=cb
            )

    async def get_flashcard_queue(self) -> FlashcardQueue:
        result = await self.db_session.execute(
            select(FlashcardQueue)
            .where(FlashcardQueue.session_id == self.chat_id))

        fqueue = result.scalar_one_or_none()
        if not fqueue:
            raise HTTPException(status_code=404, detail="Flashcard queue not found")

        return fqueue
