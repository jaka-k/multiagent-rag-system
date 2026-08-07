import asyncio

from langchain_postgres import PGEngine, PGVectorStore

from server.db.database import engine
from server.db.vectordb.embeddings import get_embedding_function

BOOK_EMBEDDINGS_TABLE = "book_embeddings"

_lock = asyncio.Lock()
_store: PGVectorStore | None = None


async def get_vector_store() -> PGVectorStore:
    """Process-wide singleton over the `book_embeddings` table.

    Areas are no longer separate collections: `area` is a real column on the
    table (declared via metadata_columns), and callers scope searches with
    filter={"area": {"$eq": ...}}. The table itself is created by alembic
    (20260807_0001), not by ainit_vectorstore_table, so the schema stays in
    version control; PGVectorStore.create only introspects and validates it.
    """
    global _store
    if _store is None:
        async with _lock:
            if _store is None:
                _store = await PGVectorStore.create(
                    engine=PGEngine.from_engine(engine=engine),
                    table_name=BOOK_EMBEDDINGS_TABLE,
                    embedding_service=get_embedding_function(),
                    metadata_columns=["area", "chapter_id"],
                )
    return _store
