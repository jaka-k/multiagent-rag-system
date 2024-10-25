from datetime import datetime, timezone
import uuid
from server.models.area import Area
from server.models.session import Session
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("email"), UniqueConstraint("username"))
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str
    username: str = Field(index=True)
    hashed_password: bytes = Field(default=False)
    disabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    sessions: list["Session"] = Relationship(back_populates="user")
    areas: list["Area"] = Relationship(back_populates="user")
    tokens: list["Token"] = Relationship(back_populates="user")


class Token(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    token: str = Field(index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    expires_at: datetime
    revoked: bool = False

    user: User = Relationship(back_populates="tokens")
