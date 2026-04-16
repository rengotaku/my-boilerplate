"""Item リポジトリ: SQLite を使った CRUD 操作."""

import sqlite3
from typing import Any


class ItemRepository:
    """Item エンティティの SQLite リポジトリ."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """コンストラクタ。SQLite 接続を受け取る。"""
        self._conn = conn

    def find_all(self) -> list[dict[str, Any]]:
        """全アイテムを取得する。"""
        cursor = self._conn.execute(
            "SELECT id, name, description, created_at FROM items ORDER BY id"
        )
        return [dict(row) for row in cursor.fetchall()]

    def find_by_id(self, item_id: int) -> dict[str, Any] | None:
        """ID でアイテムを取得する。存在しない場合は None を返す。"""
        cursor = self._conn.execute(
            "SELECT id, name, description, created_at FROM items WHERE id = ?",
            (item_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def create(self, name: str, description: str) -> int:
        """アイテムを作成し、新しい ID を返す。"""
        cursor = self._conn.execute(
            "INSERT INTO items (name, description) VALUES (?, ?)",
            (name, description),
        )
        self._conn.commit()
        return cursor.lastrowid  # type: ignore[return-value]

    def update(self, item_id: int, name: str, description: str) -> bool:
        """アイテムを更新する。更新成功なら True、存在しない場合は False を返す。"""
        cursor = self._conn.execute(
            "UPDATE items SET name = ?, description = ? WHERE id = ?",
            (name, description, item_id),
        )
        self._conn.commit()
        return cursor.rowcount > 0

    def delete(self, item_id: int) -> bool:
        """アイテムを削除する。削除成功なら True、存在しない場合は False を返す。"""
        cursor = self._conn.execute(
            "DELETE FROM items WHERE id = ?",
            (item_id,),
        )
        self._conn.commit()
        return cursor.rowcount > 0
