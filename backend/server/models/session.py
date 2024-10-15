import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    DateTime,
    Integer,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Session(Base):
    __tablename__ = "sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    area_id = Column(UUID(as_uuid=True), ForeignKey("area.id"))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    tokens_used = Column(Integer)
    session_status = Column(String, nullable=True)

    user = relationship("User", back_populates="sessions")
    area = relationship("Area", back_populates="sessions")
    messages = relationship("Message", back_populates="sessions")
    flashcard_queue = relationship(
        "FlashcardQueue", back_populates="sessions", uselist=False
    )
    doc_chunk_queue = relationship(
        "DocChunkQueue", back_populates="sessions", uselist=False
    )
    custom_instruction_queue = relationship(
        "CustomInstructionQueue", back_populates="sessions", uselist=False
    )


class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("session.id"))
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    session = relationship("Session", back_populates="messages")


class FlashcardQueue(Base):
    __tablename__ = "flashcard_queues"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("session.id"), unique=True)
    flashcard_data = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    session = relationship("Session", back_populates="flashcard_queues")
    flashcards = relationship("Flashcards", back_populates="flashcard_queues")


class DocChunkQueue(Base):
    __tablename__ = "doc_chunk_queues"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("session.id"), unique=True)
    created_at = Column(DateTime, default=datetime.now)

    session = relationship("Session", back_populates="doc_chunk_queues")
    doc_chunks = relationship("DocumentChunks", back_populates="doc_chunk_queues")


class CustomInstructionQueue(Base):
    __tablename__ = "custom_instruction_queues"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("session.id"), unique=True)
    instruction = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    session = relationship("Session", back_populates="custom_instruction_queues")
