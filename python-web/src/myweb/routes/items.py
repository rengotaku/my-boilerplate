"""Item CRUD ルート: contracts/routes.md に準拠した APIRouter 定義."""

import sqlite3
from collections.abc import Generator

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.responses import Response

from myweb.database import get_connection
from myweb.repositories.item_repo import ItemRepository
from myweb.services.item_service import ItemNotFoundError, ItemService

router = APIRouter()
templates: Jinja2Templates | None = None


def set_templates(tmpl: Jinja2Templates) -> None:
    """テンプレートエンジンをルーターに注入する(app.py から呼ばれる)。"""
    global templates  # noqa: PLW0603
    templates = tmpl


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """依存性注入: SQLite 接続を返すジェネレータ。"""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def get_item_service(
    conn: sqlite3.Connection = Depends(get_db),
) -> ItemService:
    """依存性注入: ItemService を生成する。"""
    repo = ItemRepository(conn)
    return ItemService(repo)


@router.get("/", response_class=HTMLResponse)
async def index(
    request: Request,
    service: ItemService = Depends(get_item_service),
) -> HTMLResponse:
    """トップページ(Item 一覧)."""
    assert templates is not None
    items = service.get_all_items()
    return templates.TemplateResponse(
        request, "index.html", {"items": items}
    )


@router.get("/items/new", response_class=HTMLResponse)
async def new_item(request: Request) -> HTMLResponse:
    """新規作成フォーム."""
    assert templates is not None
    return templates.TemplateResponse(request, "items/new.html", {})


@router.post("/items", response_model=None)
async def create_item(
    request: Request,
    name: str = Form(default=""),
    description: str = Form(default=""),
    service: ItemService = Depends(get_item_service),
) -> Response:
    """アイテム作成。成功時は / にリダイレクト、失敗時はフォームを再表示。"""
    assert templates is not None
    try:
        service.create_item(name=name, description=description)
    except ValueError as exc:
        return templates.TemplateResponse(
            request,
            "items/new.html",
            {"error": str(exc), "name": name, "description": description},
            status_code=200,
        )
    return RedirectResponse(url="/", status_code=302)


@router.get("/items/{item_id}", response_class=HTMLResponse)
async def show_item(
    request: Request,
    item_id: int,
    service: ItemService = Depends(get_item_service),
) -> HTMLResponse:
    """アイテム詳細表示."""
    assert templates is not None
    try:
        item = service.get_item(item_id)
    except ItemNotFoundError:
        return templates.TemplateResponse(
            request, "items/show.html", {"item": None}, status_code=404
        )
    return templates.TemplateResponse(request, "items/show.html", {"item": item})


@router.get("/items/{item_id}/edit", response_class=HTMLResponse)
async def edit_item(
    request: Request,
    item_id: int,
    service: ItemService = Depends(get_item_service),
) -> HTMLResponse:
    """編集フォーム."""
    assert templates is not None
    service_inst = service
    try:
        item = service_inst.get_item(item_id)
    except ItemNotFoundError:
        return templates.TemplateResponse(
            request, "items/edit.html", {"item": None}, status_code=404
        )
    return templates.TemplateResponse(request, "items/edit.html", {"item": item})


@router.post("/items/{item_id}", response_model=None)
async def update_item(
    request: Request,
    item_id: int,
    name: str = Form(default=""),
    description: str = Form(default=""),
    service: ItemService = Depends(get_item_service),
) -> Response:
    """アイテム更新。成功時は / にリダイレクト、失敗時はフォームを再表示。"""
    assert templates is not None
    try:
        item = service.get_item(item_id)
    except ItemNotFoundError:
        return templates.TemplateResponse(
            request, "items/edit.html", {"item": None}, status_code=404
        )
    try:
        service.update_item(item_id, name=name, description=description)
    except ValueError as exc:
        return templates.TemplateResponse(
            request,
            "items/edit.html",
            {
                "error": str(exc),
                "item": item,
                "name": name,
                "description": description,
            },
            status_code=200,
        )
    return RedirectResponse(url="/", status_code=302)


@router.post("/items/{item_id}/delete", response_model=None)
async def delete_item(
    request: Request,
    item_id: int,
    service: ItemService = Depends(get_item_service),
) -> Response:
    """アイテム削除。成功時は / にリダイレクト。"""
    assert templates is not None
    try:
        service.delete_item(item_id)
    except ItemNotFoundError:
        return templates.TemplateResponse(
            request, "items/show.html", {"item": None}, status_code=404
        )
    return RedirectResponse(url="/", status_code=302)
