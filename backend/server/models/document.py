import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    ForeignKey,
    DateTime,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    is_compressed = Column(Boolean, default=True)

    user = relationship("User", back_populates="documents")
    chapters = relationship("Chapters", back_populates="documents")


class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("document.id"))
    parent_label = Column(String, nullable=True)
    label = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    order = Column(Integer, nullable=True)

    document = relationship("Document", back_populates="chapters")
    chunks = relationship("DocumentChunks", back_populates="chapters")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapter.id"))
    content = Column(Text, nullable=False)
    metadata = Column(JSON, nullable=True)

    chapter = relationship("Chapter", back_populates="chunks")
