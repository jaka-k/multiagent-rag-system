"""messageretrieval table (docs/rework/05)

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-14 15:00:00.000000
"""
import sqlalchemy as sa

from alembic import op

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "messageretrieval",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("message_id", sa.Uuid(), sa.ForeignKey("message.id"), nullable=False),
        sa.Column("chapter_id", sa.Uuid(), sa.ForeignKey("chapter.id"), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("rank", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_messageretrieval_message_id", "messageretrieval", ["message_id"])


def downgrade() -> None:
    op.drop_table("messageretrieval")
