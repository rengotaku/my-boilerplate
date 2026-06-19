"""SQLModel エンティティ定義 (Item, User)."""

from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(UTC)


class Item(SQLModel, table=True):
    """アイテム (CRUD 例)."""

    __tablename__ = "items"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True)
    description: str = Field(default="", max_length=500)
    created_at: datetime = Field(default_factory=_utcnow)


class User(SQLModel, table=True):
    """認証ユーザー."""

    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, index=True, unique=True)
    password_hash: str = Field(max_length=512)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=_utcnow)
