"""Test configuration and fixtures."""

import sqlite3
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from myweb.app import app
from myweb.database import CREATE_ITEMS_TABLE
from myweb.routes.items import get_db


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI application with an in-memory DB."""
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute(CREATE_ITEMS_TABLE)
    conn.commit()

    def override_get_db() -> Generator[sqlite3.Connection, None, None]:
        try:
            yield conn
        finally:
            pass  # テスト終了後に接続を閉じる

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    conn.close()
