"""Named, per-area card-generation agents (docs/rework/05, 2026-08 decision)."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Agent(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    area_id: uuid.UUID = Field(foreign_key="area.id", index=True)

    name: str
    description: str = Field(default="")
    icon: str = Field(default="bot")
    card_type: str = Field(default="def")  # def | code | concept | cloze
    system_prompt: str = Field(default="")
    variables: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    model: Optional[str] = Field(default=None, nullable=True)
    difficulty: Optional[str] = Field(default=None, nullable=True)  # Standard | Hard

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )
