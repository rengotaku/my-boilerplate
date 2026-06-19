"""サービス層テスト: ビジネスロジック、エラーハンドリング."""

from unittest.mock import MagicMock

import pytest

from myweb.models import Item
from myweb.repositories.item_repo import ItemRepository
from myweb.services.item_service import ItemNotFoundError, ItemService


@pytest.fixture
def mock_repo() -> MagicMock:
    return MagicMock(spec=ItemRepository)


@pytest.fixture
def service(mock_repo: MagicMock) -> ItemService:
    return ItemService(mock_repo)


class TestItemServiceCreate:
    def test_create_item_calls_repo(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.create.return_value = Item(id=1, name="テスト", description="説明")
        item_id = service.create_item(name="テスト", description="説明")
        assert item_id == 1
        mock_repo.create.assert_called_once_with(name="テスト", description="説明")

    def test_create_item_trims_whitespace(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.create.return_value = Item(id=1, name="trimmed", description="desc")
        service.create_item(name="  trimmed  ", description="  desc  ")
        mock_repo.create.assert_called_once_with(name="trimmed", description="desc")

    def test_create_item_empty_name_raises_error(
        self, service: ItemService
    ) -> None:
        with pytest.raises(ValueError, match="name"):
            service.create_item(name="", description="")

    def test_create_item_name_too_long_raises_error(
        self, service: ItemService
    ) -> None:
        with pytest.raises(ValueError, match="100"):
            service.create_item(name="a" * 101, description="")

    def test_create_item_description_too_long_raises_error(
        self, service: ItemService
    ) -> None:
        with pytest.raises(ValueError, match="500"):
            service.create_item(name="valid", description="d" * 501)


class TestItemServiceGetAll:
    def test_get_all_items_returns_list(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.find_all.return_value = [Item(id=1, name="x", description="")]
        items = service.get_all_items()
        assert len(items) == 1
        mock_repo.find_all.assert_called_once()


class TestItemServiceGetById:
    def test_get_item_existing(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.find_by_id.return_value = Item(id=1, name="found", description="d")
        item = service.get_item(1)
        assert item.name == "found"
        mock_repo.find_by_id.assert_called_once_with(1)

    def test_get_item_nonexistent_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.find_by_id.return_value = None
        with pytest.raises(ItemNotFoundError):
            service.get_item(99999)


class TestItemServiceUpdate:
    def test_update_item_success(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.find_by_id.return_value = Item(id=1, name="old", description="")
        mock_repo.update.return_value = True
        service.update_item(1, name="new", description="updated")
        mock_repo.update.assert_called_once_with(1, name="new", description="updated")

    def test_update_item_nonexistent_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.find_by_id.return_value = None
        with pytest.raises(ItemNotFoundError):
            service.update_item(99999, name="new", description="")

    def test_update_item_empty_name_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.find_by_id.return_value = Item(id=1, name="old", description="")
        with pytest.raises(ValueError, match="name"):
            service.update_item(1, name="", description="")


class TestItemServiceDelete:
    def test_delete_item_success(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.find_by_id.return_value = Item(id=1, name="t", description="")
        mock_repo.delete.return_value = True
        service.delete_item(1)
        mock_repo.delete.assert_called_once_with(1)

    def test_delete_item_nonexistent_raises_error(
        self, service: ItemService, mock_repo: MagicMock
    ) -> None:
        mock_repo.find_by_id.return_value = None
        with pytest.raises(ItemNotFoundError):
            service.delete_item(99999)
