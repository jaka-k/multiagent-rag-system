import uuid

from pydantic import BaseModel, Field


class FlashcardDTO(BaseModel):
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), description="Unique identifier"
    )
    front: str = Field(description="The front text of the flashcard")
    back: str = Field(description="The back text of the flashcard")
