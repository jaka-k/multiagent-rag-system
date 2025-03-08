import uuid

from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory

from server.core.logger import app_logger
from server.service.chat_history_service import load_session_history


async def get_chat_history(session_id: uuid.UUID) -> BaseChatMessageHistory:
    chat_history = ChatMessageHistory()
    try:
        messages = await load_session_history(session_id)
        if messages:
            for message in messages:
                if message.role == "agent":
                    chat_history.add_ai_message(message.content)
                elif message.role == "user":
                    chat_history.add_user_message(message.content)

                else:
                    raise Exception(
                        "Populating chat history resulted in invalid message role"
                    )

    except Exception as e:
        app_logger.error("Chat history error", {"error": e})

    return chat_history
