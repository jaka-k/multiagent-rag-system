"""clear book_embeddings for the Gemini -> Qwen3-Embedding swap

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-10-04 20:00:00.000000

Embeddings move from gemini-embedding-001 to qwen3-embedding-8b (both
1536-dim, but different vector spaces), so every stored vector is stale.
Truncate book_embeddings and reset embedding flags; the next embedding
run refills it. Pre-launch: nothing to preserve.
"""
from alembic import op


revision = "d0e1f2a3b4c5"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("TRUNCATE TABLE book_embeddings")
    op.execute("UPDATE document SET embedding_status = 'IDLE' WHERE embedding_status = 'COMPLETED'")
    op.execute("UPDATE chapter SET is_embedded = false WHERE is_embedded = true")


def downgrade() -> None:
    pass
