import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Deck(Base):
    __tablename__ = "decks"
    id = Column(Integer, primary_key=True)
    # anki_id = Column(Integer, primary_key=True)  # Uncomment if needed
    name = Column(String, nullable=False)
    area_id = Column(UUID(as_uuid=True), ForeignKey("area.id"))

    area = relationship("Area", back_populates="decks")
    flashcards = relationship("Flashcards", back_populates="decks")


class Flashcard(Base):
    __tablename__ = "flashcards"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    front = Column(String, nullable=False)
    back = Column(String, nullable=False)
    deck_id = Column(Integer, ForeignKey("deck.id"), nullable=True)
    queue_id = Column(
        UUID(as_uuid=True), ForeignKey("flashcardqueue.id"), nullable=True
    )
    created_at = Column(DateTime, default=datetime.now)

    deck = relationship("Deck", back_populates="flashcards")
    queue = relationship("FlashcardQueue", back_populates="flashcards")
