import uuid

from pydantic import BaseModel


class ChatInputDTO(BaseModel):
    user_input: str
    thread_id: uuid.UUID


class MetaDataDTO(BaseModel):
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    total_cost: float


class ChatOutputStreamDTO:
    def __init__(self, raw_stream, metadata):
        self.raw_stream = raw_stream

        self.metadata = MetaDataDTO(
            total_tokens=metadata.total_tokens,
            prompt_tokens=metadata.prompt_tokens,
            completion_tokens=metadata.completion_tokens,
            total_cost=metadata.total_cost,
        )

    async def stream_messages(self):
        try:
            async for message in self.raw_stream:
                yield message
            yield self.get_metadata()
        except Exception as e:
            # TODO: Handle exceptions (e.g., logging)
            print(f"Error processing stream: {e}")
            # raise the exception or yield an error message
            raise e

    def get_metadata(self) -> MetaDataDTO:
        return self.metadata
