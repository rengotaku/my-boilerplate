# @scaffold:remove-if no-auth
"""FastAPI アプリケーション定義: structlog / SQLModel / 認証ルーター を統合."""

# @scaffold:end
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse  # @scaffold:keep-if no-sample
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from myweb.config import get_settings
from myweb.database import init_db
from myweb.logging_config import configure_logging, get_logger
from myweb.routes import auth as auth_routes  # @scaffold:remove-if no-auth
from myweb.routes import items as items_routes  # @scaffold:remove-if no-sample

# python-web/ ルートディレクトリ (src/myweb/app.py の 3 つ上)
_BASE_DIR = Path(__file__).parent.parent.parent


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:  # noqa: ARG001
    """アプリ起動時の初期化 (logging + DB)."""
    configure_logging()
    init_db()
    get_logger("myweb").info("startup", env=get_settings().app_env)
    yield


app = FastAPI(title="myweb", lifespan=_lifespan)

# Jinja2 テンプレート
_templates = Jinja2Templates(directory=str(_BASE_DIR / "templates"))
items_routes.set_templates(_templates)  # @scaffold:remove-if no-sample
auth_routes.set_templates(_templates)  # @scaffold:remove-if no-auth

# 静的ファイル
_static_dir = _BASE_DIR / "static"
_static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")

# @scaffold:remove-if both
# ルーター登録
# @scaffold:end
app.include_router(items_routes.router)  # @scaffold:remove-if no-sample
app.include_router(auth_routes.router)  # @scaffold:remove-if no-auth
# @scaffold:keep-if no-sample


@app.get("/")
async def home() -> HTMLResponse:
    """トップページ (サンプルを外した構成)."""
    template = _templates.get_template("index.html")
    return HTMLResponse(content=template.render(no_sample=True))
# @scaffold:end
