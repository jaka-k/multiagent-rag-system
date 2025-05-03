from datetime import datetime
from typing import List
import uuid

from pydantic import BaseModel

from server.models.flashcard import Flashcard


# For the endpoints that don't use SQLModel schemas as response models,
# we map the Pydantic BaseModel class manually


class MessageDTO(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionDTO(BaseModel):
    id: uuid.UUID
    total_tokens: int
    title: str
    prompt_tokens: int
    completion_tokens: int
    total_cost: float
    messages: List[MessageDTO]
    area_id: uuid.UUID

    class Config:
        from_attributes = True

class FQueueDTO(BaseModel):
    id: uuid.UUID
    flashcards: List[Flashcard]

    class Config:
        from_attributes = True
