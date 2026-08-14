"""per-area agent table (docs/rework/05)

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-14 12:00:00.000000
"""
import sqlalchemy as sa

from alembic import op

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "agent",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("area_id", sa.Uuid(), sa.ForeignKey("area.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False, server_default=""),
        sa.Column("icon", sa.String(), nullable=False, server_default="bot"),
        sa.Column("card_type", sa.String(), nullable=False, server_default="def"),
        sa.Column("system_prompt", sa.String(), nullable=False, server_default=""),
        sa.Column("variables", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column("difficulty", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_agent_area_id", "agent", ["area_id"])


def downgrade() -> None:
    op.drop_table("agent")
