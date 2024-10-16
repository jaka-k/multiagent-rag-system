import uuid
from datetime import datetime, timezone

from server.models.area import Area
from server.models.document import DocumentChunk
from server.models.flashcard import Flashcard
from server.models.user import User
from sqlmodel import SQLModel, Field, Relationship


class Session(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    user_id: uuid.UUID = Field(foreign_key="user.id")
    area_id: uuid.UUID = Field(foreign_key="area.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tokens_used: int = Field(default=None, nullable=True)
    session_status: str = Field(default=None, nullable=True)

    user: "User" = Relationship(back_populates="sessions")
    area: "Area" = Relationship(back_populates="sessions")
    messages: list["Message"] = Relationship(back_populates="session")
    flashcard_queue: "FlashcardQueue" = Relationship(
        back_populates="session", sa_relationship_kwargs={"uselist": False}
    )
    doc_chunk_queue: "DocChunkQueue" = Relationship(
        back_populates="session", sa_relationship_kwargs={"uselist": False}
    )
    custom_instruction_queue: "CustomInstructionQueue" = Relationship(
        back_populates="session", sa_relationship_kwargs={"uselist": False}
    )


class Message(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="session.id")
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: "Session" = Relationship(back_populates="messages")


class FlashcardQueue(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="session.id", nullable=False)
    flashcard_data: str = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: "Session" = Relationship(back_populates="flashcard_queue")
    flashcards: list["Flashcard"] = Relationship(back_populates="flashcard_queue")


class DocChunkQueue(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="session.id", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: "Session" = Relationship(back_populates="doc_chunk_queue")
    doc_chunks: list["DocumentChunk"] = Relationship(back_populates="doc_chunk_queue")


class CustomInstructionQueue(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="session.id", nullable=False)
    instruction: str = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    session: "Session" = Relationship(back_populates="custom_instruction_queue")
