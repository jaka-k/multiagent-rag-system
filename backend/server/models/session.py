import uuid
from datetime import datetime, timezone
from typing import List

from sqlmodel import SQLModel, Field, Relationship

from server.models.document import Chapter
from server.models.flashcard import Flashcard
from server.models.links import ChapterQueueLink


class Session(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    user_id: uuid.UUID = Field(foreign_key="user.id")
    user: "User" = Relationship(back_populates="sessions")  # type: ignore
    area_id: uuid.UUID = Field(foreign_key="area.id")
    area: "Area" = Relationship(back_populates="sessions")  # type: ignore
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc)})

    session_status: str = Field(default=None, nullable=True)

    total_tokens: int = Field(default=0)
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    total_cost: float = Field(default=0.0)

    messages: List["Message"] = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"lazy": "selectin", "order_by": "Message.created_at.asc()"},
    )

    flashcard_queue: "FlashcardQueue" = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )
    chapter_queue: "ChapterQueue" = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )
    custom_instruction_queue: "CustomInstructionQueue" = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )


class Message(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="session.id")
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: "Session" = Relationship(
        back_populates="messages",
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class FlashcardQueue(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="session.id", nullable=False)
    flashcard_data: str = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: "Session" = Relationship(
        back_populates="flashcard_queue",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )
    flashcards: List["Flashcard"] = Relationship(back_populates="queue")


class ChapterQueue(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="session.id", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: "Session" = Relationship(back_populates="chapter_queue")

    # Many-to-many
    chapters: List["Chapter"] = Relationship(
        back_populates="queues",
        link_model=ChapterQueueLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class CustomInstructionQueue(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="session.id", nullable=False)
    instruction: str = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: "Session" = Relationship(
        back_populates="custom_instruction_queue",
        sa_relationship_kwargs={"uselist": False, "lazy": "selectin"},
    )
