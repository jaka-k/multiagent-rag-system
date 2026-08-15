"""chapter html reader blobs (docs/rework/07)

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-08-15 18:00:00.000000
"""
import sqlalchemy as sa

from alembic import op

revision = "d0e1f2a3b4c5"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chapterhtml",
        sa.Column(
            "chapter_id",
            sa.Uuid(),
            sa.ForeignKey("chapter.id"),
            primary_key=True,
        ),
        sa.Column("html", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("chapterhtml")
