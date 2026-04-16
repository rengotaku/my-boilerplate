"""FastAPI アプリケーション定義: Jinja2, StaticFiles, ルーター登録, DB 初期化."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from myweb.database import init_db
from myweb.routes.items import router as items_router
from myweb.routes.items import set_templates

# python-web/ ルートディレクトリ (src/myweb/app.py の 3 つ上)
_BASE_DIR = Path(__file__).parent.parent.parent

app = FastAPI(title="myweb")

# Jinja2 テンプレートの設定
_templates = Jinja2Templates(directory=str(_BASE_DIR / "templates"))
set_templates(_templates)

# 静的ファイルの設定
_static_dir = _BASE_DIR / "static"
_static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")

# ルーター登録
app.include_router(items_router)

# DB 初期化(テーブルが存在しない場合のみ作成)
init_db()
