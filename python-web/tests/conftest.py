"""Test configuration and fixtures."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from myweb import database
from myweb.app import app
from myweb.database import get_session


@pytest.fixture
def engine() -> Generator[Engine, None, None]:
    """テスト用のインメモリ SQLite エンジン (スレッド共有)."""
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(eng)
    database.set_engine(eng)
    try:
        yield eng
    finally:
        database.reset_engine()
        eng.dispose()


@pytest.fixture
def session(engine: Engine) -> Generator[Session, None, None]:
    """各テスト用の SQLModel セッション."""
    with Session(engine) as session:
        yield session


@pytest.fixture
def client(engine: Engine) -> Generator[TestClient, None, None]:
    """FastAPI テストクライアント (in-memory DB を共有)."""

    def override_get_session() -> Generator[Session, None, None]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
