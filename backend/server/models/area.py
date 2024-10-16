from typing import List, Optional
import uuid
from datetime import datetime, timezone
from server.models.document import Document
from server.models.flashcard import Deck
from server.models.user import User
from sqlmodel import Field, Relationship, SQLModel
from server.models.session import Session


class Area(SQLModel, table=True):

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    name: str
    user_id: uuid.UUID = Field(foreign_key="user.id")

    label: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tokens_used: int

    user: User = Relationship(back_populates="areas")
    instructions: List["Instruction"] = Relationship(back_populates="area")
    decks: Deck = Relationship(back_populates="area")
    sessions: List["Session"] = Relationship(back_populates="area")
    documents: List["Document"] = Relationship(back_populates="area")

    # Connect to embeddings somehow


class Instruction(SQLModel, table=True):

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    area_id: uuid.UUID = Field(foreign_key="areas.id")
    context_text: str
    model: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    area: Area = Relationship(back_populates="instructions")
