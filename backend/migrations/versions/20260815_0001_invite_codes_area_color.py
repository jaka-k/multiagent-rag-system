"""invite codes for beta registration + area label color (docs/rework/08 A+B)

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-08-15 09:00:00.000000
"""
import sqlalchemy as sa

from alembic import op

revision = "c9d0e1f2a3b4"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "invitecode",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("purpose", sa.String(), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("use_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("redeemed_by", sa.Uuid(), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("redeemed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_invitecode_code", "invitecode", ["code"], unique=True)
    op.add_column("area", sa.Column("color", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("area", "color")
    op.drop_table("invitecode")
