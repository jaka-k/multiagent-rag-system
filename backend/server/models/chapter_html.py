import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class ChapterHtml(SQLModel, table=True):
    """1:1 reader blob for a chapter — sanitized HTML with base64-inlined
    images (docs/rework/07). Deliberately relationship-free: chapter rows are
    eagerly loaded all over the app and this blob must never ride along."""

    chapter_id: uuid.UUID = Field(primary_key=True, foreign_key="chapter.id")
    html: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
