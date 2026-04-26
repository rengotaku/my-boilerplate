# my-boilerplate Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-25

## Active Technologies
- TypeScript 5.9, React 19, Node.js 20+ + Vite 8, MUI 7, Zustand, React Hook Form, Zod, react-router-dom (002-cloudflare-spa)
- N/A（単体 SPA、サーバー連携なし） (002-cloudflare-spa)
- Python 3.12+ + FastAPI, Jinja2, uvicorn, Alpine.js (npm), Tailwind CSS v4 (npm) (004-fastapi-jinja2-boilerplate)
- SQLite（標準ライブラリ sqlite3） (004-fastapi-jinja2-boilerplate)

- TypeScript 5.9, React 19 + Apollo Client 3.x, @graphql-codegen/*, MUI 7, Zustand, React Hook Form, Zod (001-graphql-spa)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.9, React 19: Follow standard conventions

## Recent Changes
- 004-fastapi-jinja2-boilerplate: Added Python 3.12+ + FastAPI, Jinja2, uvicorn, Alpine.js (npm), Tailwind CSS v4 (npm)
- 002-cloudflare-spa: Added TypeScript 5.9, React 19, Node.js 20+ + Vite 8, MUI 7, Zustand, React Hook Form, Zod, react-router-dom

- 001-graphql-spa: Added TypeScript 5.9, React 19 + Apollo Client 3.x, @graphql-codegen/*, MUI 7, Zustand, React Hook Form, Zod

<!-- MANUAL ADDITIONS START -->

## テンプレートの利用方法

ユーザーから「my-boilerplate の `<template>` を使って」と指示された場合、**構造だけ真似てゼロから書いてはいけない**。必ず `scripts/download.sh` でファイル一式を対象ディレクトリへ scaffold する（`download.sh` は scaffold を必ず実行する。opt-out は無い）。

```bash
# 共通（name / go-module-name は basename(<dest>) から自動推定）
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- <template> <dest>

# 公開予定の go-* プロジェクトは module パスを明示
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- <template> <dest> --go-module-name=<go-module>
```

理由: 構造模倣だと `envconfig` / 共通 logger / Makefile ターゲット等の既存資産が引き継がれず、ボイラープレートの恩恵が受けられない（#97 参照）。

<!-- MANUAL ADDITIONS END -->
