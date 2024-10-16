import uuid
from datetime import datetime
from pytz import timezone
from server.models.area import Area
from server.models.session import FlashcardQueue
from sqlmodel import SQLModel, Field, Relationship


class Deck(SQLModel, table=True):
    id: int = Field(primary_key=True)
    # anki_id: int = Field(primary_key=True)
    name: str
    area_id: uuid.UUID = Field(foreign_key="area.id")

    area: "Area" = Relationship(back_populates="decks")
    flashcards: list["Flashcard"] = Relationship(back_populates="deck")


class Flashcard(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    front: str
    back: str
    deck_id: int = Field(foreign_key="deck.id", nullable=True)
    queue_id: uuid.UUID = Field(foreign_key="flashcardqueue.id", nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    deck: "Deck" = Relationship(back_populates="flashcards")
    queue: "FlashcardQueue" = Relationship(back_populates="flashcards")
