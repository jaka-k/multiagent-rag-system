"""Per-message retrieval results (docs/rework/05) — what the RAG pipeline
retrieved for each answer. Backs the Chapters sidebar tab and, later,
inline citations."""
import uuid

from sqlmodel import Field, SQLModel


class MessageRetrieval(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    message_id: uuid.UUID = Field(foreign_key="message.id", index=True)
    chapter_id: uuid.UUID = Field(foreign_key="chapter.id")
    relevance_score: float = Field(default=0.0)
    rank: int = Field(default=0)
