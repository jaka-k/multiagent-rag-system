import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship


class Deck(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    anki_id: str = Field(default=None, index=True)
    name: str
    area_id: uuid.UUID = Field(foreign_key="area.id")
    area: "Area" = Relationship(back_populates="deck")  # type: ignore

    flashcards: list["Flashcard"] = Relationship(back_populates="deck")


class Flashcard(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    anki_id: str = Field(default=None, index=True, nullable=True)
    front: str
    back: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tag: str

    deck_id: Optional[uuid.UUID] = Field(foreign_key="deck.id", nullable=True)
    deck: Optional["Deck"] = Relationship(back_populates="flashcards")

    queue_id: Optional[uuid.UUID] = Field(
        foreign_key="flashcardqueue.id", nullable=True
    )
    queue: Optional["FlashcardQueue"] = Relationship(back_populates="flashcards")  # type: ignore
