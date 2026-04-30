"""リポジトリ層テスト: Item CRUD 操作 (SQLModel)."""

import pytest
from sqlmodel import Session

from myweb.repositories.item_repo import ItemRepository


@pytest.fixture
def repo(session: Session) -> ItemRepository:
    return ItemRepository(session)


class TestItemCreate:
    def test_create_returns_item_with_id(self, repo: ItemRepository) -> None:
        item = repo.create(name="テスト", description="説明")
        assert item.id is not None
        assert item.id > 0

    def test_create_persists_data(self, repo: ItemRepository) -> None:
        created = repo.create(name="永続化テスト", description="確認用")
        fetched = repo.find_by_id(created.id)  # type: ignore[arg-type]
        assert fetched is not None
        assert fetched.name == "永続化テスト"
        assert fetched.description == "確認用"

    def test_create_sets_created_at(self, repo: ItemRepository) -> None:
        item = repo.create(name="日時テスト", description="")
        assert item.created_at is not None

    def test_create_multiple_items_increments_id(
        self, repo: ItemRepository
    ) -> None:
        a = repo.create(name="item1", description="")
        b = repo.create(name="item2", description="")
        assert b.id is not None and a.id is not None
        assert b.id > a.id


class TestItemFindAll:
    def test_find_all_empty(self, repo: ItemRepository) -> None:
        assert repo.find_all() == []

    def test_find_all_returns_all_items(self, repo: ItemRepository) -> None:
        repo.create(name="item1", description="desc1")
        repo.create(name="item2", description="desc2")
        repo.create(name="item3", description="desc3")
        assert len(repo.find_all()) == 3


class TestItemFindById:
    def test_find_by_id_existing(self, repo: ItemRepository) -> None:
        created = repo.create(name="検索テスト", description="詳細")
        found = repo.find_by_id(created.id)  # type: ignore[arg-type]
        assert found is not None
        assert found.name == "検索テスト"

    def test_find_by_id_nonexistent(self, repo: ItemRepository) -> None:
        assert repo.find_by_id(99999) is None


class TestItemUpdate:
    def test_update_name(self, repo: ItemRepository) -> None:
        created = repo.create(name="更新前", description="説明")
        result = repo.update(created.id, name="更新後", description="説明")  # type: ignore[arg-type]
        assert result is True
        item = repo.find_by_id(created.id)  # type: ignore[arg-type]
        assert item is not None
        assert item.name == "更新後"

    def test_update_nonexistent_returns_false(
        self, repo: ItemRepository
    ) -> None:
        assert repo.update(99999, name="x", description="") is False


class TestItemDelete:
    def test_delete_existing(self, repo: ItemRepository) -> None:
        created = repo.create(name="削除対象", description="")
        assert repo.delete(created.id) is True  # type: ignore[arg-type]
        assert repo.find_by_id(created.id) is None  # type: ignore[arg-type]

    def test_delete_nonexistent_returns_false(
        self, repo: ItemRepository
    ) -> None:
        assert repo.delete(99999) is False


class TestItemEdgeCases:
    def test_create_special_chars(self, repo: ItemRepository) -> None:
        item = repo.create(
            name="Robert'; DROP TABLE items;--", description=""
        )
        assert "Robert" in item.name
        assert len(repo.find_all()) >= 1

    def test_create_unicode_name(self, repo: ItemRepository) -> None:
        item = repo.create(name="日本語テスト", description="説明文")
        assert item.name == "日本語テスト"
