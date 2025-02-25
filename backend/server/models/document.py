import uuid
from datetime import datetime, timezone
from typing import List

from sqlmodel import SQLModel, Field, Relationship

from server.models.links import ChapterQueueLink


class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    area_id: uuid.UUID = Field(foreign_key="area.id")
    area: "Area" = Relationship(back_populates="documents")  # type: ignore

    title: str
    description: str = Field(default=None, nullable=True)
    file_path: str
    file_size: int = Field(default=None, nullable=True)
    cover_image: str = Field(default=None, nullable=True)
    is_embedded: bool = Field(default=False)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc)})

    chapters: List["Chapter"] = Relationship(back_populates="document")


class Chapter(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    parent_label: str = Field(default=None, nullable=True)
    label: str
    content: str = Field(default=None, nullable=True)
    order: int = Field(default=None, nullable=True)

    document_id: uuid.UUID = Field(foreign_key="document.id")
    document: "Document" = Relationship(back_populates="chapters")

    queues: List["ChapterQueue"] = Relationship(
        back_populates="chapters",
        link_model=ChapterQueueLink
    )



