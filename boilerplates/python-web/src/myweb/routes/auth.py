"""認証ルート: register / login / logout (Cookie ベース JWT セッション)."""

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session
from starlette.responses import Response

from myweb.auth import InvalidTokenError, decode_token
from myweb.config import get_settings
from myweb.database import get_session
from myweb.models import User
from myweb.repositories.user_repo import UserRepository
from myweb.services.user_service import (
    InvalidCredentialsError,
    UserAlreadyExistsError,
    UserService,
)

router = APIRouter()
templates: Jinja2Templates | None = None


def set_templates(tmpl: Jinja2Templates) -> None:
    """テンプレートエンジンをルーターに注入する."""
    global templates  # noqa: PLW0603
    templates = tmpl


def get_user_service(
    session: Session = Depends(get_session),
) -> UserService:
    """依存性注入: UserService を生成する."""
    return UserService(UserRepository(session))


def get_current_user(
    request: Request,
    session: Session = Depends(get_session),
) -> User | None:
    """セッション Cookie から JWT を読んでユーザーを返す (任意認証)."""
    settings = get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        return None
    try:
        payload = decode_token(token)
    except InvalidTokenError:
        return None
    sub = payload.get("sub")
    if not sub:
        return None
    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        return None
    return UserService(UserRepository(session)).get_by_id(user_id)


@router.get("/register", response_class=HTMLResponse)
async def register_form(request: Request) -> HTMLResponse:
    """ユーザー登録フォーム."""
    assert templates is not None
    return templates.TemplateResponse(request, "auth/register.html", {})


@router.post("/register", response_model=None)
async def register(
    request: Request,
    email: str = Form(default=""),
    password: str = Form(default=""),
    service: UserService = Depends(get_user_service),
) -> Response:
    """ユーザー登録処理."""
    assert templates is not None
    try:
        service.register(email=email, password=password)
    except (ValueError, UserAlreadyExistsError) as exc:
        return templates.TemplateResponse(
            request,
            "auth/register.html",
            {"error": str(exc), "email": email},
            status_code=200,
        )
    return RedirectResponse(url="/login", status_code=302)


@router.get("/login", response_class=HTMLResponse)
async def login_form(request: Request) -> HTMLResponse:
    """ログインフォーム."""
    assert templates is not None
    return templates.TemplateResponse(request, "auth/login.html", {})


@router.post("/login", response_model=None)
async def login(
    request: Request,
    email: str = Form(default=""),
    password: str = Form(default=""),
    service: UserService = Depends(get_user_service),
) -> Response:
    """ログイン処理: 成功時に JWT Cookie を発行する."""
    assert templates is not None
    try:
        user = service.authenticate(email=email, password=password)
    except InvalidCredentialsError as exc:
        return templates.TemplateResponse(
            request,
            "auth/login.html",
            {"error": str(exc), "email": email},
            status_code=200,
        )
    settings = get_settings()
    token = service.issue_token(user)
    response = RedirectResponse(url="/", status_code=302)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
    )
    return response


@router.post("/logout", response_model=None)
async def logout() -> Response:
    """ログアウト処理: Cookie を削除する."""
    settings = get_settings()
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie(settings.session_cookie_name)
    return response
