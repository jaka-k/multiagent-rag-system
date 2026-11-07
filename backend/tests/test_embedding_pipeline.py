"""Regression tests for the embedding pipeline against a scratch Postgres DB.

Set TEST_DATABASE_URL (e.g. postgresql+psycopg://user:pw@localhost:5432/mrag_test);
the tables in that database are dropped and recreated per test.
"""
import os
import uuid

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.controller.embedding_controller import update_document_status
from server.core.exceptions import EmbeddingParseError
from server.db.dtos.epub_dto import ChapterDTO, EpubDTO
from server.models import agent, anki_sync, area, document, flashcard, invite, retrieval, session, user  # noqa: F401
from server.models.area import Area
from server.models.document import Chapter, Document, EmbeddingStatus
from server.models.user import User
from server.service.embedding import embedding_service
from server.service.embedding.embedding_service import EmbeddingService
from server.service.embedding.epub_processing_service import EpubProcessingService

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
pytestmark = [
    pytest.mark.anyio,
    pytest.mark.skipif(not TEST_DATABASE_URL, reason="TEST_DATABASE_URL not set"),
]


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeStore:
    def __init__(self):
        self.docs = []

    async def aadd_documents(self, documents):
        self.docs.extend(documents)


class StubParser:
    def __init__(self, chapters):
        self._chapters = chapters

    def parse(self, _path):
        return EpubDTO("Book", self._chapters)


@pytest.fixture
async def db():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as s:
        yield s
    await engine.dispose()


@pytest.fixture
async def doc_id(db):
    u = User(email="a@b.c", username="u", hashed_password=b"x")
    a = Area(name="go", label="go", color="#0085FF", user_id=u.id)
    d = Document(title="Book", user_id=u.id, area_id=a.id, file_path="epubs/book.epub")
    db.add_all([u, a])
    await db.flush()
    db.add(d)
    await db.commit()
    return d.id


@pytest.fixture
def store(monkeypatch):
    fake = FakeStore()

    async def _get():
        return fake

    monkeypatch.setattr(embedding_service, "get_vector_store", _get)
    return fake


async def _load_like_controller(db, doc_id):
    """Mirror background_embedding_process: load the doc, set statuses, ingest chapters."""
    loaded = (await db.execute(select(Document).where(Document.id == doc_id))).scalar_one()
    await update_document_status(db, doc_id, EmbeddingStatus.PROCESSING)
    return loaded


async def test_chapters_ingested_in_same_session_get_embedded(db, doc_id, store):
    document_row = await _load_like_controller(db, doc_id)
    parser = StubParser([ChapterDTO("1.1 A", "1 Intro", "some text " * 50, 1)])
    await EpubProcessingService(document_row, db, epub_parser=parser).process_and_commit("x")

    await EmbeddingService(doc_id, db).parse_chapters()

    assert store.docs, "no chunks were sent to the vector store"
    chapters = (await db.execute(select(Chapter))).scalars().all()
    assert all(c.is_embedded for c in chapters)


async def test_document_without_chapters_fails_instead_of_completing(db, doc_id, store):
    await _load_like_controller(db, doc_id)

    with pytest.raises(EmbeddingParseError):
        await EmbeddingService(doc_id, db).parse_chapters()
