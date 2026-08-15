import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class InviteCode(SQLModel, table=True):
    """Beta invite code gating registration (8 digits, shared out-of-band)."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(unique=True, index=True)
    purpose: Optional[str] = None
    max_uses: int = Field(default=1)
    use_count: int = Field(default=0)
    redeemed_by: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    redeemed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
