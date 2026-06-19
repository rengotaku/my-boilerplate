"""SQLModel エンジンとセッション管理."""

from collections.abc import Generator

from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

import myweb.models  # noqa: F401  side-effect import: SQLModel.metadata 登録
from myweb.config import get_settings

_engine: Engine | None = None


def _make_engine(database_url: str) -> Engine:
    connect_args: dict[str, object] = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(database_url, connect_args=connect_args, echo=False)


def get_engine() -> Engine:
    """SQLModel エンジンをシングルトンで返す."""
    global _engine  # noqa: PLW0603
    if _engine is None:
        _engine = _make_engine(get_settings().database_url)
    return _engine


def set_engine(engine: Engine) -> None:
    """テスト用: エンジンを差し替える."""
    global _engine  # noqa: PLW0603
    _engine = engine


def reset_engine() -> None:
    """テスト用: エンジンキャッシュをリセットする."""
    global _engine  # noqa: PLW0603
    _engine = None


def init_db(engine: Engine | None = None) -> None:
    """テーブルが存在しない場合のみ作成する (開発用)."""
    SQLModel.metadata.create_all(engine or get_engine())


def get_session() -> Generator[Session, None, None]:
    """依存性注入用: SQLModel セッションを返す."""
    with Session(get_engine()) as session:
        yield session
