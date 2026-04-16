"""Item サービス層: ビジネスロジックとバリデーション."""

from typing import Any

from myweb.repositories.item_repo import ItemRepository


class ItemNotFoundError(Exception):
    """指定された ID の Item が存在しない場合に発生する例外."""


class ItemService:
    """Item エンティティのビジネスロジック."""

    def __init__(self, repo: ItemRepository) -> None:
        """コンストラクタ。ItemRepository を受け取る。"""
        self._repo = repo

    def _validate(self, name: str, description: str) -> tuple[str, str]:
        """name と description をバリデーション・トリムして返す。"""
        name = name.strip()
        description = description.strip()
        if not name:
            raise ValueError("name は必須です")
        if len(name) > 100:
            raise ValueError("name は 100 文字以内で入力してください")
        if len(description) > 500:
            raise ValueError("description は 500 文字以内で入力してください")
        return name, description

    def get_all_items(self) -> list[dict[str, Any]]:
        """全アイテムを取得する。"""
        return self._repo.find_all()

    def get_item(self, item_id: int) -> dict[str, Any]:
        """ID でアイテムを取得する。存在しない場合は ItemNotFoundError を発生させる。"""
        item = self._repo.find_by_id(item_id)
        if item is None:
            raise ItemNotFoundError(f"Item with id={item_id} not found")
        return item

    def create_item(self, name: str, description: str) -> int:
        """アイテムを作成し、新しい ID を返す。"""
        name, description = self._validate(name, description)
        return self._repo.create(name=name, description=description)

    def update_item(self, item_id: int, name: str, description: str) -> None:
        """アイテムを更新する。存在しない場合は ItemNotFoundError を発生させる。"""
        # 存在確認（ItemNotFoundError を発生させる）
        self.get_item(item_id)
        name, description = self._validate(name, description)
        self._repo.update(item_id, name=name, description=description)

    def delete_item(self, item_id: int) -> None:
        """アイテムを削除する。存在しない場合は ItemNotFoundError を発生させる。"""
        # 存在確認（ItemNotFoundError を発生させる）
        self.get_item(item_id)
        self._repo.delete(item_id)
