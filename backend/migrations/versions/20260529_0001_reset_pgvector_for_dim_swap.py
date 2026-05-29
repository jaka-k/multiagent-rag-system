"""reset pgvector tables for embedding-model swap

Revision ID: b7e1d2c3a4f5
Revises: a1b2c3d4e5f6
Create Date: 2026-05-29 22:00:00.000000

The embedding model is moving from text-embedding-004 (768-dim, retired
from Gemini's v1beta endpoint) to gemini-embedding-001 (1536-dim).
langchain-postgres creates its tables on first insert with the dim of
that first vector, so any existing langchain_pg_embedding table is
locked at 768 and will reject 1536-dim writes with a type error.

Strategy: drop the legacy pgvector tables and reset document /
chapter embedding flags. The next embedding run recreates the tables
at the new dim. Pre-launch: no production vector data to preserve.
"""
from alembic import op


revision = "b7e1d2c3a4f5"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop legacy langchain-postgres tables (idempotent — they may not exist
    # in dev environments that never reached the embedding step).
    op.execute("DROP TABLE IF EXISTS langchain_pg_embedding CASCADE")
    op.execute("DROP TABLE IF EXISTS langchain_pg_collection CASCADE")

    # Force re-embedding of any document that was previously completed.
    # The EmbeddingService skips chapters where is_embedded=true, so both
    # flags need resetting for the pipeline to re-process from scratch.
    op.execute("UPDATE document SET embedding_status = 'IDLE' WHERE embedding_status = 'COMPLETED'")
    op.execute("UPDATE chapter SET is_embedded = false WHERE is_embedded = true")


def downgrade() -> None:
    # Vectors and embedding state are not reconstructable without re-running
    # the pipeline; no meaningful downgrade beyond letting the tables get
    # recreated on the next embedding call.
    pass
