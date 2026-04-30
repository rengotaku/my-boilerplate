"""Item サービス層: ビジネスロジックとバリデーション."""

from myweb.models import Item
from myweb.repositories.item_repo import ItemRepository


class ItemNotFoundError(Exception):
    """指定された ID の Item が存在しない場合に発生する例外."""


class ItemService:
    """Item エンティティのビジネスロジック."""

    def __init__(self, repo: ItemRepository) -> None:
        self._repo = repo

    def _validate(self, name: str, description: str) -> tuple[str, str]:
        name = name.strip()
        description = description.strip()
        if not name:
            raise ValueError("name は必須です")
        if len(name) > 100:
            raise ValueError("name は 100 文字以内で入力してください")
        if len(description) > 500:
            raise ValueError("description は 500 文字以内で入力してください")
        return name, description

    def get_all_items(self) -> list[Item]:
        """全アイテムを取得する."""
        return self._repo.find_all()

    def get_item(self, item_id: int) -> Item:
        """ID でアイテムを取得する。存在しない場合は ItemNotFoundError."""
        item = self._repo.find_by_id(item_id)
        if item is None:
            raise ItemNotFoundError(f"Item with id={item_id} not found")
        return item

    def create_item(self, name: str, description: str) -> int:
        """アイテムを作成し、新しい ID を返す."""
        name, description = self._validate(name, description)
        item = self._repo.create(name=name, description=description)
        assert item.id is not None
        return item.id

    def update_item(self, item_id: int, name: str, description: str) -> None:
        """アイテムを更新する。存在しない場合は ItemNotFoundError."""
        self.get_item(item_id)
        name, description = self._validate(name, description)
        self._repo.update(item_id, name=name, description=description)

    def delete_item(self, item_id: int) -> None:
        """アイテムを削除する。存在しない場合は ItemNotFoundError."""
        self.get_item(item_id)
        self._repo.delete(item_id)
