import uuid
from langchain_community.callbacks.manager import get_openai_callback
from statemachine.agents.rag.rag_agent import LangChainChat
from statemachine.dtos.chat_dto import ChatInputDTO, ChatOutputStreamDTO
from sqlalchemy.ext.asyncio import AsyncSession


class ChatService:
    def __init__(self, chat_id: uuid.UUID, db_session: AsyncSession):
        self.langchain_chat = LangChainChat(chat_id)
        self.db_session = db_session

    async def handle_chat(self, chat_input: ChatInputDTO):
        with get_openai_callback() as cb:

            response_stream = await self.langchain_chat.process_chain_input(
                chat_input.user_input, chat_input.thread_id
            )

            yield ChatOutputStreamDTO(
                raw_stream=response_stream, metadata=cb
            )


## def get_chat_history(self):
##  return self.langchain_chat.chat_history.get_messages()
