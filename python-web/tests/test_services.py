"""サービス層テスト: ビジネスロジック、エラーハンドリング."""

from unittest.mock import MagicMock

import pytest

from myweb.repositories.item_repo import ItemRepository
from myweb.services.item_service import ItemNotFoundError, ItemService


@pytest.fixture
def mock_repo() -> MagicMock:
    """モック ItemRepository."""
    return MagicMock(spec=ItemRepository)


@pytest.fixture
def service(mock_repo: MagicMock) -> ItemService:
    """ItemService インスタンス (モックリポジトリ使用)."""
    return ItemService(mock_repo)


# =============================================================================
# アイテム作成
# =============================================================================


class TestItemServiceCreate:
    """アイテム作成のサービス層テスト."""

    def test_create_item_calls_repo(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """リポジトリの create が呼ばれる."""
        mock_repo.create.return_value = 1
        item_id = service.create_item(name="テスト", description="説明")
        assert item_id == 1
        mock_repo.create.assert_called_once_with(
            name="テスト", description="説明"
        )

    def test_create_item_trims_whitespace(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """name の前後空白がトリムされる."""
        mock_repo.create.return_value = 1
        service.create_item(name="  trimmed  ", description="  desc  ")
        mock_repo.create.assert_called_once_with(
            name="trimmed", description="desc"
        )

    def test_create_item_empty_name_raises_error(
        self, service: ItemService
    ) -> None:
        """空の name で ValueError が発生する."""
        with pytest.raises(ValueError, match="name"):
            service.create_item(name="", description="")

    def test_create_item_whitespace_only_name_raises_error(
        self, service: ItemService
    ) -> None:
        """空白のみの name で ValueError が発生する."""
        with pytest.raises(ValueError, match="name"):
            service.create_item(name="   ", description="")

    def test_create_item_name_too_long_raises_error(
        self, service: ItemService
    ) -> None:
        """100 文字超の name で ValueError が発生する."""
        with pytest.raises(ValueError, match="100"):
            service.create_item(name="a" * 101, description="")

    def test_create_item_description_too_long_raises_error(
        self, service: ItemService
    ) -> None:
        """500 文字超の description で ValueError が発生する."""
        with pytest.raises(ValueError, match="500"):
            service.create_item(name="valid", description="d" * 501)

    def test_create_item_empty_description_allowed(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """空の description は許容される."""
        mock_repo.create.return_value = 1
        item_id = service.create_item(name="valid", description="")
        assert item_id == 1


# =============================================================================
# アイテム取得
# =============================================================================


class TestItemServiceGetAll:
    """アイテム一覧取得のサービス層テスト."""

    def test_get_all_items_returns_list(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """全件取得でリストが返される."""
        mock_repo.find_all.return_value = [
            {"id": 1, "name": "item1", "description": "", "created_at": "2026-01-01"},
        ]
        items = service.get_all_items()
        assert len(items) == 1
        mock_repo.find_all.assert_called_once()

    def test_get_all_items_empty(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """空テーブルで空リストが返される."""
        mock_repo.find_all.return_value = []
        items = service.get_all_items()
        assert items == []


class TestItemServiceGetById:
    """アイテム個別取得のサービス層テスト."""

    def test_get_item_existing(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """存在する ID でアイテムが返される."""
        mock_repo.find_by_id.return_value = {
            "id": 1,
            "name": "found",
            "description": "desc",
            "created_at": "2026-01-01",
        }
        item = service.get_item(1)
        assert item["name"] == "found"
        mock_repo.find_by_id.assert_called_once_with(1)

    def test_get_item_nonexistent_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """存在しない ID で ItemNotFoundError が発生する."""
        mock_repo.find_by_id.return_value = None
        with pytest.raises(ItemNotFoundError):
            service.get_item(99999)


# =============================================================================
# アイテム更新
# =============================================================================


class TestItemServiceUpdate:
    """アイテム更新のサービス層テスト."""

    def test_update_item_success(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """正常な更新でリポジトリが呼ばれる."""
        mock_repo.find_by_id.return_value = {
            "id": 1,
            "name": "old",
            "description": "",
            "created_at": "2026-01-01",
        }
        mock_repo.update.return_value = True
        service.update_item(1, name="new", description="updated")
        mock_repo.update.assert_called_once_with(
            1, name="new", description="updated"
        )

    def test_update_item_trims_whitespace(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """更新時に name の空白がトリムされる."""
        mock_repo.find_by_id.return_value = {
            "id": 1,
            "name": "old",
            "description": "",
            "created_at": "2026-01-01",
        }
        mock_repo.update.return_value = True
        service.update_item(1, name="  trimmed  ", description="  desc  ")
        mock_repo.update.assert_called_once_with(
            1, name="trimmed", description="desc"
        )

    def test_update_item_nonexistent_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """存在しない ID の更新で ItemNotFoundError が発生する."""
        mock_repo.find_by_id.return_value = None
        with pytest.raises(ItemNotFoundError):
            service.update_item(99999, name="new", description="")

    def test_update_item_empty_name_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """空の name での更新で ValueError が発生する."""
        mock_repo.find_by_id.return_value = {
            "id": 1,
            "name": "old",
            "description": "",
            "created_at": "2026-01-01",
        }
        with pytest.raises(ValueError, match="name"):
            service.update_item(1, name="", description="")

    def test_update_item_name_too_long_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """100 文字超の name での更新で ValueError が発生する."""
        mock_repo.find_by_id.return_value = {
            "id": 1,
            "name": "old",
            "description": "",
            "created_at": "2026-01-01",
        }
        with pytest.raises(ValueError, match="100"):
            service.update_item(1, name="a" * 101, description="")


# =============================================================================
# アイテム削除
# =============================================================================


class TestItemServiceDelete:
    """アイテム削除のサービス層テスト."""

    def test_delete_item_success(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """存在するアイテムの削除が成功する."""
        mock_repo.find_by_id.return_value = {
            "id": 1,
            "name": "target",
            "description": "",
            "created_at": "2026-01-01",
        }
        mock_repo.delete.return_value = True
        service.delete_item(1)
        mock_repo.delete.assert_called_once_with(1)

    def test_delete_item_nonexistent_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        """存在しない ID の削除で ItemNotFoundError が発生する."""
        mock_repo.find_by_id.return_value = None
        with pytest.raises(ItemNotFoundError):
            service.delete_item(99999)
