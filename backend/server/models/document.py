import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from sqlmodel import SQLModel, Field, Relationship

from server.models.links import ChapterQueueLink


class EmbeddingStatus(str, Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    EMBEDDING = "embedding"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    user_id: uuid.UUID = Field(foreign_key="user.id")
    area_id: uuid.UUID = Field(foreign_key="area.id")
    description: str = Field(default=None, nullable=True)
    file_path: str
    file_size: int = Field(default=None, nullable=True)
    cover_image: str = Field(default=None, nullable=True)
    embedding_status: Optional[EmbeddingStatus] = Field(default=EmbeddingStatus.IDLE)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc)})

    area: "Area" = Relationship(
        back_populates="documents",
        sa_relationship_kwargs={"lazy": "selectin"},
    )  # type: ignore
    chapters: List["Chapter"] = Relationship(back_populates="document",
                                             sa_relationship_kwargs={"lazy": "selectin"}, )


class Chapter(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    parent_label: str = Field(default=None, nullable=True)
    label: str
    chapter_tag: str = Field(unique=True)
    content: str = Field(default=None, nullable=True)
    order: int = Field(default=None, nullable=True)
    is_embedded: bool = Field(default=False)

    document_id: uuid.UUID = Field(foreign_key="document.id")
    document: "Document" = Relationship(back_populates="chapters", sa_relationship_kwargs={"lazy": "selectin"})

    queues: List["ChapterQueue"] = Relationship(
        back_populates="chapters",
        link_model=ChapterQueueLink
    )
