"""ankisyncrun.latest_review_id -> BIGINT

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-14 16:00:00.000000

Anki review ids are epoch-milliseconds; the live column ended up 32-bit
because SQLModel create_all (plain int) raced the alembic migration.
"""
import sqlalchemy as sa

from alembic import op

revision = "a7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("ankisyncrun", "latest_review_id", type_=sa.BigInteger())


def downgrade() -> None:
    op.alter_column("ankisyncrun", "latest_review_id", type_=sa.Integer())
