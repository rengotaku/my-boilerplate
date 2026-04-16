"""ルート層テスト: HTTP レスポンス、リダイレクト、バリデーション、404."""

import pytest
from fastapi.testclient import TestClient


# =============================================================================
# トップページ (GET /)
# =============================================================================


class TestIndexPage:
    """トップページ（アイテム一覧）のテスト."""

    def test_index_returns_200(self, client: TestClient) -> None:
        """GET / が 200 を返す."""
        response = client.get("/")
        assert response.status_code == 200

    def test_index_returns_html(self, client: TestClient) -> None:
        """GET / が HTML コンテンツを返す."""
        response = client.get("/")
        assert "text/html" in response.headers["content-type"]

    def test_index_contains_items_heading(self, client: TestClient) -> None:
        """トップページにアイテム関連の見出しが含まれる."""
        response = client.get("/")
        assert response.status_code == 200
        # HTML にアイテム一覧のコンテンツが含まれることを確認
        assert "item" in response.text.lower() or "Item" in response.text


# =============================================================================
# 新規作成フォーム (GET /items/new)
# =============================================================================


class TestNewItemPage:
    """新規作成フォームのテスト."""

    def test_new_returns_200(self, client: TestClient) -> None:
        """GET /items/new が 200 を返す."""
        response = client.get("/items/new")
        assert response.status_code == 200

    def test_new_returns_html(self, client: TestClient) -> None:
        """GET /items/new が HTML を返す."""
        response = client.get("/items/new")
        assert "text/html" in response.headers["content-type"]

    def test_new_contains_form(self, client: TestClient) -> None:
        """新規作成ページにフォームが含まれる."""
        response = client.get("/items/new")
        assert "<form" in response.text.lower()


# =============================================================================
# アイテム作成 (POST /items)
# =============================================================================


class TestCreateItem:
    """アイテム作成のテスト."""

    def test_create_redirects_to_index(self, client: TestClient) -> None:
        """正常な作成で / にリダイレクトされる."""
        response = client.post(
            "/items",
            data={"name": "新しいアイテム", "description": "説明文"},
            follow_redirects=False,
        )
        assert response.status_code == 302
        assert response.headers["location"] == "/"

    def test_create_with_empty_name_shows_error(
        self, client: TestClient
    ) -> None:
        """空の name でバリデーションエラーが表示される."""
        response = client.post(
            "/items",
            data={"name": "", "description": ""},
        )
        # バリデーションエラー: 200 でフォーム再表示
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_create_with_long_name_shows_error(
        self, client: TestClient
    ) -> None:
        """100 文字超の name でバリデーションエラーが表示される."""
        response = client.post(
            "/items",
            data={"name": "a" * 101, "description": ""},
        )
        assert response.status_code == 200

    def test_create_with_empty_description_succeeds(
        self, client: TestClient
    ) -> None:
        """空の description で作成が成功する."""
        response = client.post(
            "/items",
            data={"name": "desc なし", "description": ""},
            follow_redirects=False,
        )
        assert response.status_code == 302

    def test_create_persists_item(self, client: TestClient) -> None:
        """作成したアイテムが一覧に表示される."""
        client.post(
            "/items",
            data={"name": "永続化確認", "description": "テスト"},
            follow_redirects=True,
        )
        response = client.get("/")
        assert "永続化確認" in response.text


# =============================================================================
# アイテム詳細 (GET /items/{id})
# =============================================================================


class TestShowItem:
    """アイテム詳細表示のテスト."""

    def test_show_existing_item_returns_200(
        self, client: TestClient
    ) -> None:
        """存在するアイテムの詳細が 200 を返す."""
        # まずアイテムを作成
        client.post(
            "/items",
            data={"name": "詳細表示テスト", "description": "詳細"},
            follow_redirects=True,
        )
        response = client.get("/items/1")
        assert response.status_code == 200

    def test_show_existing_item_contains_name(
        self, client: TestClient
    ) -> None:
        """詳細ページにアイテム名が含まれる."""
        client.post(
            "/items",
            data={"name": "名前確認テスト", "description": ""},
            follow_redirects=True,
        )
        response = client.get("/items/1")
        assert "名前確認テスト" in response.text

    def test_show_nonexistent_item_returns_404(
        self, client: TestClient
    ) -> None:
        """存在しないアイテムの詳細が 404 を返す."""
        response = client.get("/items/99999")
        assert response.status_code == 404

    def test_show_invalid_id_returns_error(
        self, client: TestClient
    ) -> None:
        """不正な ID (文字列) でエラーが返される."""
        response = client.get("/items/abc")
        assert response.status_code in (404, 422)


# =============================================================================
# 編集フォーム (GET /items/{id}/edit)
# =============================================================================


class TestEditItemPage:
    """編集フォームのテスト."""

    def test_edit_existing_item_returns_200(
        self, client: TestClient
    ) -> None:
        """存在するアイテムの編集フォームが 200 を返す."""
        client.post(
            "/items",
            data={"name": "編集テスト", "description": ""},
            follow_redirects=True,
        )
        response = client.get("/items/1/edit")
        assert response.status_code == 200

    def test_edit_contains_form_with_current_values(
        self, client: TestClient
    ) -> None:
        """編集フォームに現在の値がプリフィルされる."""
        client.post(
            "/items",
            data={"name": "プリフィル確認", "description": "既存の説明"},
            follow_redirects=True,
        )
        response = client.get("/items/1/edit")
        assert "プリフィル確認" in response.text

    def test_edit_nonexistent_item_returns_404(
        self, client: TestClient
    ) -> None:
        """存在しないアイテムの編集で 404 を返す."""
        response = client.get("/items/99999/edit")
        assert response.status_code == 404


# =============================================================================
# アイテム更新 (POST /items/{id})
# =============================================================================


class TestUpdateItem:
    """アイテム更新のテスト."""

    def test_update_redirects_to_index(self, client: TestClient) -> None:
        """正常な更新で / にリダイレクトされる."""
        client.post(
            "/items",
            data={"name": "更新前", "description": ""},
            follow_redirects=True,
        )
        response = client.post(
            "/items/1",
            data={"name": "更新後", "description": "新しい説明"},
            follow_redirects=False,
        )
        assert response.status_code == 302
        assert response.headers["location"] == "/"

    def test_update_persists_changes(self, client: TestClient) -> None:
        """更新した内容が反映される."""
        client.post(
            "/items",
            data={"name": "更新前名前", "description": ""},
            follow_redirects=True,
        )
        client.post(
            "/items/1",
            data={"name": "更新後名前", "description": "更新説明"},
            follow_redirects=True,
        )
        response = client.get("/items/1")
        assert "更新後名前" in response.text

    def test_update_with_empty_name_shows_error(
        self, client: TestClient
    ) -> None:
        """空の name での更新でバリデーションエラー."""
        client.post(
            "/items",
            data={"name": "元の名前", "description": ""},
            follow_redirects=True,
        )
        response = client.post(
            "/items/1",
            data={"name": "", "description": ""},
        )
        assert response.status_code == 200

    def test_update_nonexistent_item_returns_404(
        self, client: TestClient
    ) -> None:
        """存在しないアイテムの更新で 404 を返す."""
        response = client.post(
            "/items/99999",
            data={"name": "不在", "description": ""},
        )
        assert response.status_code == 404


# =============================================================================
# アイテム削除 (POST /items/{id}/delete)
# =============================================================================


class TestDeleteItem:
    """アイテム削除のテスト."""

    def test_delete_redirects_to_index(self, client: TestClient) -> None:
        """削除後に / にリダイレクトされる."""
        client.post(
            "/items",
            data={"name": "削除対象", "description": ""},
            follow_redirects=True,
        )
        response = client.post("/items/1/delete", follow_redirects=False)
        assert response.status_code == 302
        assert response.headers["location"] == "/"

    def test_delete_removes_item(self, client: TestClient) -> None:
        """削除後にアイテムが一覧から消える."""
        client.post(
            "/items",
            data={"name": "消えるアイテム", "description": ""},
            follow_redirects=True,
        )
        client.post("/items/1/delete", follow_redirects=True)
        response = client.get("/")
        assert "消えるアイテム" not in response.text

    def test_delete_nonexistent_item_returns_404(
        self, client: TestClient
    ) -> None:
        """存在しないアイテムの削除で 404 を返す."""
        response = client.post("/items/99999/delete")
        assert response.status_code == 404


# =============================================================================
# エッジケース
# =============================================================================


class TestRouteEdgeCases:
    """ルートのエッジケーステスト."""

    def test_create_with_special_chars(self, client: TestClient) -> None:
        """特殊文字を含む name で作成できる."""
        response = client.post(
            "/items",
            data={"name": "<b>bold</b> & 'quotes'", "description": ""},
            follow_redirects=False,
        )
        assert response.status_code == 302

    def test_create_with_unicode(self, client: TestClient) -> None:
        """Unicode 文字で作成できる."""
        response = client.post(
            "/items",
            data={"name": "日本語アイテム", "description": "中文描述"},
            follow_redirects=False,
        )
        assert response.status_code == 302

    def test_static_files_accessible(self, client: TestClient) -> None:
        """静的ファイルパスが設定されている."""
        # /static/ パスが存在することを確認（ファイルがなくても 404 であり 500 ではない）
        response = client.get("/static/css/style.css")
        assert response.status_code in (200, 404)
        assert response.status_code != 500
