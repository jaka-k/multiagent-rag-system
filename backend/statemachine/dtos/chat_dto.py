from typing import Dict, Any, Optional
from pydantic import BaseModel

from langchain_core.messages.ai import AIMessage


class ChatInputDTO(BaseModel):
    user_input: str
    thread_id: str


class ChatOutputStreamDTO:
    def __init__(self, raw_stream, metadata):
        self.raw_stream = raw_stream
        self.metadata = metadata

    def stream_messages(self):
        try:
            for message in self.raw_stream:
                yield message
            yield self.get_metadata()
        except Exception as e:
            # Handle exceptions (e.g., logging)
            print(f"Error processing stream: {e}")
            # Optionally, you can re-raise the exception or yield an error message
            raise e

    def get_metadata(self):

        return {
            "total_tokens": self.metadata.total_tokens,
            "prompt_tokens": self.metadata.prompt_tokens,
            "completion_tokens": self.metadata.completion_tokens,
            "total_cost": self.metadata.total_cost,
        }
