import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel

from server.models.document import Document
from server.models.flashcard import Deck
from server.models.session import Session

# Label palette — mirrored in frontend ui/areas/new-area-dialog.tsx.
AREA_COLORS = ["#0085FF", "#9360FF", "#16B27A", "#F2576B", "#F2A33C", "#2FA7C7"]


def color_for(area_id: uuid.UUID) -> str:
    """Deterministic palette pick so an area renders the same color everywhere."""
    digest = hashlib.md5(str(area_id).encode()).hexdigest()
    return AREA_COLORS[int(digest[:8], 16) % len(AREA_COLORS)]


class Area(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    name: str
    user_id: uuid.UUID = Field(foreign_key="user.id")
    user: "User" = Relationship(back_populates="areas")  # type: ignore

    label: str
    color: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc)})

    instructions: List["Instruction"] = Relationship(back_populates="area")
    deck: Deck = Relationship(back_populates="area")

    sessions: List["Session"] = Relationship(back_populates="area")
    documents: List["Document"] = Relationship(back_populates="area",
                                               sa_relationship_kwargs={"order_by": "Document.created_at.asc()"}, )



class Instruction(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    area_id: uuid.UUID = Field(foreign_key="area.id")
    context_text: str
    model: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    area: Area = Relationship(back_populates="instructions")
