from pydantic import BaseModel, Field


class FlashcardDTO(BaseModel):
    front: str = Field(description="The front text of the flashcard")
    back: str = Field(description="The back text of the flashcard")
