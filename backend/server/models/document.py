import uuid
from datetime import datetime, timezone
from server.models.area import Area
from server.models.user import User
from sqlmodel import SQLModel, Field, Relationship


class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    area_id: uuid.UUID = Field(foreign_key="area.id")
    title: str
    description: str = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    file_path: str
    file_size: int = Field(default=None, nullable=True)
    is_compressed: bool = Field(default=True)

    user: "User" = Relationship(back_populates="documents")
    area: "Area" = Relationship(back_populates="documents")
    chapters: list["Chapter"] = Relationship(back_populates="document")


class Chapter(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="document.id")
    parent_label: str = Field(default=None, nullable=True)
    label: str
    content: str = Field(default=None, nullable=True)
    order: int = Field(default=None, nullable=True)

    document: "Document" = Relationship(back_populates="chapters")
    chunks: list["DocumentChunk"] = Relationship(back_populates="chapter")


class DocumentChunk(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    chapter_id: uuid.UUID = Field(foreign_key="chapter.id")
    content: str
    metadata: dict = Field(default=None, nullable=True)

    chapter: "Chapter" = Relationship(back_populates="chunks")
