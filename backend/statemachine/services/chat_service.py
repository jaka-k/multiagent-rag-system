from langchain.callbacks import get_openai_callback
from statemachine.agents.rag.rag_agent import LangChainChat
from statemachine.dtos.chat_dto import ChatInputDTO, ChatOutputStreamDTO


class ChatService:
    def __init__(self, chat_id: str):
        self.langchain_chat = LangChainChat(chat_id)

    def handle_chat(self, chat_input: ChatInputDTO):
        with get_openai_callback() as cb:
            response_stream = self.langchain_chat.process_chain_input(
                chat_input.user_input, chat_input.thread_id
            )

            chat_output_dto = ChatOutputStreamDTO(
                raw_stream=response_stream, metadata=cb
            )

            yield chat_output_dto

    def get_chat_history(self):
        return self.langchain_chat.chat_history.get_messages()
