"""anki pull-sync tables: ankicardstate + ankisyncrun

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-09 12:00:00.000000

Local mirror of Anki review/scheduling state (docs/rework/06). Written
only by the pull-sync worker; MRAG owns content, Anki owns scheduling.
"""
import sqlalchemy as sa

from alembic import op

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ankicardstate",
        sa.Column("flashcard_id", sa.Uuid(), sa.ForeignKey("flashcard.id"), primary_key=True),
        sa.Column("anki_card_id", sa.String(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lapses", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("interval_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ease_factor", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("due_at", sa.DateTime(), nullable=True),
        sa.Column("last_reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("queue", sa.String(), nullable=False, server_default="new"),
        sa.Column("is_deleted_in_anki", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_modified_in_anki", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_ankicardstate_anki_card_id", "ankicardstate", ["anki_card_id"])

    op.create_table(
        "ankisyncrun",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("deck_id", sa.Uuid(), sa.ForeignKey("deck.id"), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("latest_review_id", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("cards_updated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(), nullable=False, server_default="ok"),
        sa.Column("error", sa.String(), nullable=True),
    )
    op.create_index("ix_ankisyncrun_deck_id", "ankisyncrun", ["deck_id"])


def downgrade() -> None:
    op.drop_table("ankisyncrun")
    op.drop_table("ankicardstate")
