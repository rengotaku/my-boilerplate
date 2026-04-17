"""SQLite データベース接続管理とスキーマ初期化."""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "myweb.db"

CREATE_ITEMS_TABLE = """
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def get_connection(db_path: str = str(DB_PATH)) -> sqlite3.Connection:
    """SQLite 接続を返す。row_factory を sqlite3.Row に設定する。"""
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = str(DB_PATH)) -> None:
    """データベーススキーマを初期化する(テーブルが存在しない場合のみ作成)。"""
    conn = get_connection(db_path)
    try:
        conn.execute(CREATE_ITEMS_TABLE)
        conn.commit()
    finally:
        conn.close()


def create_tables(conn: sqlite3.Connection) -> None:
    """既存の接続でテーブルを作成する。"""
    conn.execute(CREATE_ITEMS_TABLE)
    conn.commit()
