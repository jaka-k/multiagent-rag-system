"""book_embeddings table for the PGVectorStore (v2) API

Revision ID: c3d4e5f6a7b8
Revises: b7e1d2c3a4f5
Create Date: 2026-08-07 12:00:00.000000

The vector store moves from langchain-postgres's legacy PGVector class
(hardcoded langchain_pg_collection / langchain_pg_embedding tables, one
collection row per area) to the v2 PGVectorStore API: one explicit
`book_embeddings` table, with `area` and `chapter_id` promoted from JSONB
metadata to real columns so similarity searches can filter on them.

Unlike the legacy class, PGVectorStore never creates tables on insert —
it introspects and validates an existing table — so the schema is owned
here. Column names (langchain_id / content / embedding /
langchain_metadata) follow the library defaults. langchain_id is TEXT,
not UUID: chunk ids are deterministic "{chapter_tag}-{chunk_index}"
strings so re-embedding a chapter upserts instead of duplicating.

Pre-launch: no production vector data to preserve.
"""
from alembic import op


revision = "c3d4e5f6a7b8"
down_revision = "b7e1d2c3a4f5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop legacy PGVector tables (idempotent — 20260529_0001 already dropped
    # them, but any embedding run since then will have recreated them).
    op.execute("DROP TABLE IF EXISTS langchain_pg_embedding CASCADE")
    op.execute("DROP TABLE IF EXISTS langchain_pg_collection CASCADE")

    op.execute(
        """
        CREATE TABLE book_embeddings (
            langchain_id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            embedding vector(1536) NOT NULL,
            area TEXT NOT NULL,
            chapter_id TEXT NOT NULL,
            langchain_metadata JSONB
        )
        """
    )
    # PGVectorStore defaults to cosine distance; pgvector/pgvector:pg16 has HNSW.
    op.execute(
        "CREATE INDEX ix_book_embeddings_embedding "
        "ON book_embeddings USING hnsw (embedding vector_cosine_ops)"
    )
    op.execute("CREATE INDEX ix_book_embeddings_area ON book_embeddings (area)")

    # Anything embedded into the legacy tables since the last reset is gone
    # with them, so flip the flags back for the pipeline to re-process.
    op.execute("UPDATE document SET embedding_status = 'IDLE' WHERE embedding_status = 'COMPLETED'")
    op.execute("UPDATE chapter SET is_embedded = false WHERE is_embedded = true")


def downgrade() -> None:
    # Vectors are not reconstructable without re-running the pipeline; the
    # legacy tables get recreated by PGVector on the next embedding call.
    op.execute("DROP TABLE IF EXISTS book_embeddings")
