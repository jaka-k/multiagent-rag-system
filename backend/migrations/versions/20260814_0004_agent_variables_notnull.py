"""agent.variables NOT NULL with [] default

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-08-14 18:00:00.000000
"""
import sqlalchemy as sa

from alembic import op

revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE agent SET variables = '[]'::json WHERE variables IS NULL")
    op.alter_column("agent", "variables", nullable=False, server_default=sa.text("'[]'::json"))


def downgrade() -> None:
    op.alter_column("agent", "variables", nullable=True, server_default=None)
