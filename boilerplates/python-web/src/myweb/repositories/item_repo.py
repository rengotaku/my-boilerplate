"""Item リポジトリ: SQLModel を使った CRUD 操作."""

from sqlmodel import Session, select

from myweb.models import Item


class ItemRepository:
    """Item エンティティの SQLModel リポジトリ."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def find_all(self) -> list[Item]:
        """全アイテムを ID 昇順で取得する."""
        statement = select(Item).order_by(Item.id)  # type: ignore[arg-type]
        return list(self._session.exec(statement).all())

    def find_by_id(self, item_id: int) -> Item | None:
        """ID でアイテムを取得する。存在しない場合は None."""
        return self._session.get(Item, item_id)

    def create(self, name: str, description: str) -> Item:
        """アイテムを作成して永続化する."""
        item = Item(name=name, description=description)
        self._session.add(item)
        self._session.commit()
        self._session.refresh(item)
        return item

    def update(self, item_id: int, name: str, description: str) -> bool:
        """アイテムを更新する。存在しなければ False."""
        item = self._session.get(Item, item_id)
        if item is None:
            return False
        item.name = name
        item.description = description
        self._session.add(item)
        self._session.commit()
        return True

    def delete(self, item_id: int) -> bool:
        """アイテムを削除する。存在しなければ False."""
        item = self._session.get(Item, item_id)
        if item is None:
            return False
        self._session.delete(item)
        self._session.commit()
        return True
