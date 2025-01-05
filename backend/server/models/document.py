import uuid
from datetime import datetime, timezone
from server.models.links import DocChunkQueueLink
from sqlmodel import SQLModel, Field, Relationship


class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    area_id: uuid.UUID = Field(foreign_key="area.id")
    area: "Area" = Relationship(back_populates="documents")  # type: ignore
    title: str
    description: str = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc)})
    file_path: str
    file_size: int = Field(default=None, nullable=True)
    is_compressed: bool = Field(default=False)
    is_embedded: bool = Field(default=False)

    chapters: list["Chapter"] = Relationship(back_populates="document")


class Chapter(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    parent_label: str = Field(default=None, nullable=True)
    label: str
    content: str = Field(default=None, nullable=True)
    order: int = Field(default=None, nullable=True)

    document_id: uuid.UUID = Field(foreign_key="document.id")
    document: "Document" = Relationship(back_populates="chapters")

    chunks: list["DocumentChunk"] = Relationship(back_populates="chapter")


class DocumentChunk(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    content: str

    chapter_id: uuid.UUID = Field(foreign_key="chapter.id")
    chapter: "Chapter" = Relationship(back_populates="chunks")

    queues: list["DocChunkQueue"] = Relationship(back_populates="doc_chunks", link_model=DocChunkQueueLink)  # type: ignore
