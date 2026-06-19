"""認証ルートのエンドツーエンドテスト."""

from fastapi.testclient import TestClient


class TestRegisterRoute:
    def test_get_register_form(self, client: TestClient) -> None:
        response = client.get("/register")
        assert response.status_code == 200
        assert "<form" in response.text.lower()

    def test_post_register_redirects_to_login(self, client: TestClient) -> None:
        response = client.post(
            "/register",
            data={"email": "new@example.com", "password": "strongpass1"},
            follow_redirects=False,
        )
        assert response.status_code == 302
        assert response.headers["location"] == "/login"

    def test_post_register_invalid_shows_error(self, client: TestClient) -> None:
        response = client.post(
            "/register",
            data={"email": "invalid", "password": "x"},
        )
        assert response.status_code == 200
        assert "form" in response.text.lower()


class TestLoginRoute:
    def test_get_login_form(self, client: TestClient) -> None:
        response = client.get("/login")
        assert response.status_code == 200
        assert "<form" in response.text.lower()

    def test_post_login_sets_cookie(self, client: TestClient) -> None:
        client.post(
            "/register",
            data={"email": "lc@example.com", "password": "strongpass1"},
            follow_redirects=True,
        )
        response = client.post(
            "/login",
            data={"email": "lc@example.com", "password": "strongpass1"},
            follow_redirects=False,
        )
        assert response.status_code == 302
        assert response.headers["location"] == "/"
        assert "session" in response.cookies or "session" in response.headers.get(
            "set-cookie", ""
        )

    def test_post_login_wrong_credentials(self, client: TestClient) -> None:
        response = client.post(
            "/login",
            data={"email": "absent@example.com", "password": "wrongpass1"},
        )
        assert response.status_code == 200


class TestLogoutRoute:
    def test_post_logout_redirects(self, client: TestClient) -> None:
        response = client.post("/logout", follow_redirects=False)
        assert response.status_code == 302
        assert response.headers["location"] == "/login"
