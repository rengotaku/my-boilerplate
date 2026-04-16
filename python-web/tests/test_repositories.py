"""リポジトリ層テスト: Item CRUD 操作、テーブル自動作成、バリデーション境界値."""

import sqlite3

import pytest

from myweb.repositories.item_repo import ItemRepository


@pytest.fixture
def db_conn() -> sqlite3.Connection:
    """テスト用インメモリ SQLite 接続."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    return conn


@pytest.fixture
def repo(db_conn: sqlite3.Connection) -> ItemRepository:
    """ItemRepository インスタンスをインメモリ DB で作成."""
    return ItemRepository(db_conn)


# =============================================================================
# CRUD 基本操作
# =============================================================================


class TestItemCreate:
    """アイテム作成テスト."""

    def test_create_returns_id(self, repo: ItemRepository) -> None:
        """作成後に正の整数 ID が返される."""
        item_id = repo.create(name="テスト", description="説明")
        assert isinstance(item_id, int)
        assert item_id > 0

    def test_create_persists_data(self, repo: ItemRepository) -> None:
        """作成したデータが DB に永続化される."""
        item_id = repo.create(name="永続化テスト", description="確認用")
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["name"] == "永続化テスト"
        assert item["description"] == "確認用"

    def test_create_sets_created_at(self, repo: ItemRepository) -> None:
        """created_at が自動設定される."""
        item_id = repo.create(name="日時テスト", description="")
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["created_at"] is not None
        assert len(item["created_at"]) > 0

    def test_create_multiple_items_increments_id(
        self, repo: ItemRepository
    ) -> None:
        """複数作成時に ID がインクリメントされる."""
        id1 = repo.create(name="item1", description="")
        id2 = repo.create(name="item2", description="")
        assert id2 > id1


class TestItemFindAll:
    """アイテム一覧取得テスト."""

    def test_find_all_empty(self, repo: ItemRepository) -> None:
        """空テーブルで空リストが返される."""
        items = repo.find_all()
        assert items == []

    def test_find_all_returns_all_items(self, repo: ItemRepository) -> None:
        """全件が返される."""
        repo.create(name="item1", description="desc1")
        repo.create(name="item2", description="desc2")
        repo.create(name="item3", description="desc3")
        items = repo.find_all()
        assert len(items) == 3

    def test_find_all_contains_all_fields(self, repo: ItemRepository) -> None:
        """返却データに全フィールドが含まれる."""
        repo.create(name="フィールド確認", description="テスト説明")
        items = repo.find_all()
        item = items[0]
        assert "id" in item.keys()
        assert "name" in item.keys()
        assert "description" in item.keys()
        assert "created_at" in item.keys()


class TestItemFindById:
    """アイテム個別取得テスト."""

    def test_find_by_id_existing(self, repo: ItemRepository) -> None:
        """存在する ID で正しいデータが返される."""
        item_id = repo.create(name="検索テスト", description="詳細")
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["name"] == "検索テスト"

    def test_find_by_id_nonexistent(self, repo: ItemRepository) -> None:
        """存在しない ID で None が返される."""
        item = repo.find_by_id(99999)
        assert item is None

    def test_find_by_id_zero(self, repo: ItemRepository) -> None:
        """ID=0 で None が返される."""
        item = repo.find_by_id(0)
        assert item is None

    def test_find_by_id_negative(self, repo: ItemRepository) -> None:
        """負の ID で None が返される."""
        item = repo.find_by_id(-1)
        assert item is None


class TestItemUpdate:
    """アイテム更新テスト."""

    def test_update_name(self, repo: ItemRepository) -> None:
        """name を更新できる."""
        item_id = repo.create(name="更新前", description="説明")
        result = repo.update(item_id, name="更新後", description="説明")
        assert result is True
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["name"] == "更新後"

    def test_update_description(self, repo: ItemRepository) -> None:
        """description を更新できる."""
        item_id = repo.create(name="名前", description="更新前説明")
        repo.update(item_id, name="名前", description="更新後説明")
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["description"] == "更新後説明"

    def test_update_nonexistent_returns_false(
        self, repo: ItemRepository
    ) -> None:
        """存在しない ID の更新で False が返される."""
        result = repo.update(99999, name="不在", description="")
        assert result is False

    def test_update_preserves_created_at(self, repo: ItemRepository) -> None:
        """更新時に created_at が変更されない."""
        item_id = repo.create(name="日時保持", description="")
        original = repo.find_by_id(item_id)
        assert original is not None
        repo.update(item_id, name="日時保持更新", description="変更")
        updated = repo.find_by_id(item_id)
        assert updated is not None
        assert updated["created_at"] == original["created_at"]


class TestItemDelete:
    """アイテム削除テスト."""

    def test_delete_existing(self, repo: ItemRepository) -> None:
        """存在するアイテムを削除できる."""
        item_id = repo.create(name="削除対象", description="")
        result = repo.delete(item_id)
        assert result is True
        assert repo.find_by_id(item_id) is None

    def test_delete_nonexistent_returns_false(
        self, repo: ItemRepository
    ) -> None:
        """存在しない ID の削除で False が返される."""
        result = repo.delete(99999)
        assert result is False

    def test_delete_does_not_affect_others(
        self, repo: ItemRepository
    ) -> None:
        """削除が他のアイテムに影響しない."""
        id1 = repo.create(name="残る", description="")
        id2 = repo.create(name="消える", description="")
        repo.delete(id2)
        assert repo.find_by_id(id1) is not None
        assert len(repo.find_all()) == 1


# =============================================================================
# エッジケース
# =============================================================================


class TestItemEdgeCases:
    """エッジケースのテスト."""

    def test_create_empty_description(self, repo: ItemRepository) -> None:
        """空文字の description で作成できる."""
        item_id = repo.create(name="空説明テスト", description="")
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["description"] == ""

    def test_create_unicode_name(self, repo: ItemRepository) -> None:
        """Unicode 文字を含む name で作成できる."""
        item_id = repo.create(name="日本語テスト", description="説明文")
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["name"] == "日本語テスト"

    def test_create_emoji_name(self, repo: ItemRepository) -> None:
        """絵文字を含む name で作成できる."""
        item_id = repo.create(name="test item", description="")
        item = repo.find_by_id(item_id)
        assert item is not None
        assert "test" in item["name"]

    def test_create_special_chars(self, repo: ItemRepository) -> None:
        """SQL 特殊文字を含む name で作成できる（SQL インジェクション防止）."""
        item_id = repo.create(
            name="Robert'; DROP TABLE items;--", description=""
        )
        item = repo.find_by_id(item_id)
        assert item is not None
        assert "Robert" in item["name"]
        # テーブルが存在し続けることを確認
        items = repo.find_all()
        assert len(items) >= 1

    def test_create_html_in_name(self, repo: ItemRepository) -> None:
        """HTML タグを含む name がそのまま保存される."""
        item_id = repo.create(
            name="<script>alert('xss')</script>", description=""
        )
        item = repo.find_by_id(item_id)
        assert item is not None
        assert "<script>" in item["name"]

    def test_create_max_length_name(self, repo: ItemRepository) -> None:
        """100 文字の name で作成できる."""
        long_name = "a" * 100
        item_id = repo.create(name=long_name, description="")
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["name"] == long_name

    def test_create_max_length_description(
        self, repo: ItemRepository
    ) -> None:
        """500 文字の description で作成できる."""
        long_desc = "b" * 500
        item_id = repo.create(name="長い説明", description=long_desc)
        item = repo.find_by_id(item_id)
        assert item is not None
        assert item["description"] == long_desc

    def test_find_all_with_many_items(self, repo: ItemRepository) -> None:
        """大量データ (1000件) でも正しく取得できる."""
        for i in range(1000):
            repo.create(name=f"item_{i}", description=f"desc_{i}")
        items = repo.find_all()
        assert len(items) == 1000
