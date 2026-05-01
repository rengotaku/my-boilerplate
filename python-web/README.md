# myweb

Python Web application **batteries-included** boilerplate: FastAPI + Jinja2 + Alpine.js + Tailwind CSS + SQLite.

定番パッケージを同梱しており、scaffold 直後から DB / 認証 / ロギング / Config を追加インストール無しで使える。

## Batteries Included

| カテゴリ | パッケージ |
|---|---|
| Web | `fastapi`, `uvicorn[standard]`, `jinja2`, `python-multipart` |
| ORM / Migrations | `sqlmodel`, `alembic` |
| 認証 | `pyjwt`, `pwdlib[argon2]` |
| ロギング | `structlog` |
| Config | `pydantic-settings` |

## Prerequisites

- Python 3.12+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

## Setup

```bash
make install
make migrate     # Alembic で初回マイグレーション
```

## Development

```bash
make run
# Open http://localhost:8000
```

## Testing

```bash
make test        # Run tests
make test-cov    # Run tests with coverage
make ci          # Run lint + typecheck + test-cov
```

## Production assets

```bash
make build       # Build production assets (Tailwind CSS minify)
make migrate     # Apply migrations
```

Makefile はローカル開発用。本番サーバー起動はホスト環境の手段 (uvicorn 直叩き / gunicorn / systemd / Docker など) で行う。

## Project Structure

```
src/myweb/
├── app.py                # FastAPI application + lifespan
├── config.py             # pydantic-settings 設定
├── logging_config.py     # structlog 設定
├── database.py           # SQLModel エンジン / Session
├── models.py             # SQLModel エンティティ (Item, User)
├── auth/                 # 認証ユーティリティ (JWT + argon2)
├── routes/
│   ├── items.py          # Item CRUD
│   └── auth.py           # register / login / logout
├── services/             # ビジネスロジック
├── repositories/         # データアクセス
└── alembic/              # Alembic マイグレーション
templates/                # Jinja2 テンプレート
static/                   # 静的アセット
tests/                    # テストスイート
```

## Available Commands

`make help` で全ターゲットを確認できる。

## Environment Variables

`.env` または環境変数で上書き可能 (`pydantic-settings` がロードする):

| 変数 | デフォルト | 用途 |
|---|---|---|
| `APP_ENV` | `development` | 動作環境名 |
| `LOG_LEVEL` | `INFO` | structlog ログレベル |
| `LOG_JSON` | `false` | true で JSON 形式ログ |
| `DATABASE_URL` | `sqlite:///./myweb.db` | SQLAlchemy URL |
| `JWT_SECRET` | `dev-secret-change-me` | JWT 署名キー (本番では必ず変更) |
| `JWT_ALGORITHM` | `HS256` | JWT 署名アルゴリズム |
| `JWT_EXPIRE_MINUTES` | `1440` | JWT 有効期限 (分) |
| `SESSION_COOKIE_NAME` | `session` | セッション Cookie 名 |
