# @scaffold:remove-if no-sample
# @scaffold:remove-if no-auth
"""initial: items + users

Revision ID: 20260501_0001
Revises:
Create Date: 2026-05-01

"""
# @scaffold:end
# @scaffold:end
from collections.abc import Sequence

# @scaffold:remove-if both
import sqlalchemy as sa
from alembic import op
from sqlmodel.sql.sqltypes import AutoString

# @scaffold:end
revision: str = "20260501_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
# @scaffold:remove-if no-sample
    op.create_table(
        "items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", AutoString(length=100), nullable=False),
        sa.Column(
            "description",
            AutoString(length=500),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_items_name", "items", ["name"])
# @scaffold:end
# @scaffold:remove-if no-auth

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "email",
            AutoString(length=255),
            nullable=False,
        ),
        sa.Column(
            "password_hash",
            AutoString(length=512),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
# @scaffold:end
# @scaffold:keep-if both
    pass
# @scaffold:end


def downgrade() -> None:
# @scaffold:remove-if no-auth
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
# @scaffold:end
# @scaffold:remove-if no-sample
    op.drop_index("ix_items_name", table_name="items")
    op.drop_table("items")
# @scaffold:end
# @scaffold:keep-if both
    pass
# @scaffold:end
