"""enable pgvector extension

Revision ID: a1b2c3d4e5f6
Revises: e9c879f376c2
Create Date: 2026-05-15 00:01:00.000000

"""
from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "e9c879f376c2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS vector")
