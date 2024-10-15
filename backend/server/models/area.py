import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID  # Adjust if not using PostgreSQL
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Area(Base):
    __tablename__ = "areas"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)

    label = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    tokens_used = Column(Integer, nullable=False)

    user = relationship("User", back_populates="areas")
    sessions = relationship("Sessions", back_populates="areas")
    decks = relationship("Deck", back_populates="areas")
    instructions = relationship("Instructions", back_populates="areas")

    # Connect to embeddings somehow
    # epubs ??


class Instruction(Base):
    __tablename__ = "instructions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    area_id = Column(UUID(as_uuid=True), ForeignKey("area.id"), nullable=False)
    context_text = Column(String, nullable=False)
    model = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationship to Area
    area = relationship("Area", back_populates="instructions")
