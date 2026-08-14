"""Local mirror of Anki review state, written only by the pull-sync.
MRAG owns card content, Anki owns scheduling (docs/rework/06)."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class AnkiCardState(SQLModel, table=True):
    """1:1 with Flashcard, created on first pull."""

    flashcard_id: uuid.UUID = Field(foreign_key="flashcard.id", primary_key=True)
    anki_card_id: str = Field(index=True)  # card id; Flashcard.anki_id stays the note id

    reps: int = Field(default=0)
    lapses: int = Field(default=0)
    interval_days: int = Field(default=0)
    ease_factor: int = Field(default=0)  # Anki's `factor`, e.g. 2500
    due_at: Optional[datetime] = Field(default=None, nullable=True)
    last_reviewed_at: Optional[datetime] = Field(default=None, nullable=True)
    queue: str = Field(default="new")  # new|learning|review|suspended|buried

    is_deleted_in_anki: bool = Field(default=False)
    is_modified_in_anki: bool = Field(default=False)
    synced_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnkiSyncRun(SQLModel, table=True):
    """Bookkeeping: one row per sync execution per deck."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    deck_id: uuid.UUID = Field(foreign_key="deck.id", index=True)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = Field(default=None, nullable=True)
    latest_review_id: int = Field(default=0)  # getLatestReviewID watermark
    cards_updated: int = Field(default=0)
    status: str = Field(default="ok")  # ok | skipped | partial | failed
    error: Optional[str] = Field(default=None, nullable=True)
