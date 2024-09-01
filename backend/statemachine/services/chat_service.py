from statemachine.agents.rag.rag_agent import LangChainChat
from statemachine.dtos.chat_dto import ChatInputDTO, ChatOutputDTO


class ChatService:
    def __init__(self):
        self.langchain_chat = LangChainChat()

    def handle_chat(self, chat_input: ChatInputDTO):
        response_stream = self.langchain_chat.process_input(
            chat_input.user_input, chat_input.thread_id
        )
        responses = []
        for response in response_stream:
            responses.append(ChatOutputDTO(response=response))
        return responses
