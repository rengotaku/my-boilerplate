# アーキテクチャ

このリポジトリは、複数のプロジェクト雛形（テンプレート）を 1 か所で管理し、雛形からスタンドアロンのプロジェクトを生成して配るためのものです。テンプレートの一覧は各テンプレートの `template.toml` が正本で、README の表は `make readme-list` で生成します。

## 構成

| 場所 | 役割 |
|---|---|
| `boilerplates/` | 配布するテンプレートの本体です。1 テンプレート = 1 ディレクトリで、`template.toml` に名前・言語・説明・タグを持ちます |
| `scripts/download.sh` | テンプレートを取得して配る入口です。単体で curl から実行できます |
| `scripts/scaffold/` | 取得したテンプレートを生成物へ変換します。`scaffold.sh` と、家族別の処理を持つ `lib/` からなります |
| `scripts/gen-readme-list.sh` | README のテンプレート表を `template.toml` から生成します |
| `scripts/e2e-update-snapshots.sh` | VRT の基準画像を CI と同じコンテナで作り直します |
| `e2e/` | テンプレートをまたぐ Playwright のテストです。統合・VRT・アクセシビリティの 3 層があります |
| `docs/` | 決定の記録（`docs/adr/`）を置きます |
| `meta/` | テンプレート以外の配布物です。`meta/github-workflow/` に PR / Issue テンプレートがあります |
| `.github/workflows/` | このリポジトリ自身の CI と、配布物に変換される CI の元があります |

### テンプレート一覧

テンプレートは 11 個です。一覧の正本は `boilerplates/*/template.toml` です。

| 名前 | 言語 | 内容 |
|---|---|---|
| `chrome-extension` | TypeScript | Manifest V3 の Chrome 拡張です |
| `go-cli` | Go | cobra + slog + envconfig の Go CLI です |
| `go-cli-wrapper` | Go | 外部 CLI のラッパー向け Go CLI です |
| `go-react-admin` | Go+React | 管理コンソールの Go + React フルスタックです。React は `frontend/` にあります |
| `mcp-server` | TypeScript | stdio の MCP サーバーです |
| `python-cli` | Python | uv + Typer の Python CLI です |
| `python-llm-pipeline` | Python | LLM パイプラインの基盤です |
| `python-web` | Python | FastAPI + Jinja2 + Alpine.js の Web アプリです |
| `react-spa` | React | Vite + Astryx + Zustand の SPA です |
| `react-spa-cloudflare` | React | Cloudflare Pages 向けの React SPA です |
| `static-lp` | React | ビルド時にプリレンダリングする静的 LP です |

README の表は `make readme-list` で `template.toml` から生成します。表が古い場合は、CI の `make check-readme-list`（`.github/workflows/docs.yml`）が失敗します。`download.sh --list` も同じ `template.toml` を読みます。

画面を持つテンプレートは `react-spa`、`react-spa-cloudflare`、`go-react-admin`、`static-lp` です。前の 3 つは Astryx（`@astryxdesign/core`、`@astryxdesign/theme-neutral`、`@astryxdesign/cli` の `0.7.12`）を使います。`static-lp` は軽さを優先し、使う部品だけを直接持ちます。

## データフロー

1. `download.sh` が、既定では `rengotaku/my-boilerplate` の `main` の tarball を取得します。取得先は `MY_BOILERPLATE_REPO`、`MY_BOILERPLATE_REF`、`MY_BOILERPLATE_TARBALL_URL` で変えられます。
2. 展開したツリーから、`boilerplates/*/template.toml` と `meta/*/template.toml` を探してテンプレートを列挙します。テンプレート名の検証も、この実物の一覧に対して行います。
3. scaffold モードでは、展開したツリーの `scripts/scaffold/scaffold.sh` を呼びます。`--list`、`--tree`、`--pick` は scaffold を実行しません。
4. `scaffold.sh` は、次の順に生成します。引数の検証、テンプレートのコピー、`template.toml` の削除、Node の版の解決、CI の変換。続いて、テンプレート名からプロジェクト名への置換、家族別の置換、`--no-auth` の適用、GitHub テンプレートの注入、README の生成です。
5. CI は `.github/workflows/<template>.yml` を `.github/workflows/ci.yml` に変換して生成物へ入れます。`<template>-deploy.yml` があれば `deploy.yml` も生成します。Go の再利用ワークフローを呼ぶ CI は、呼び出しを展開して単体の CI にします。

### フラグの効き方

| フラグ | 対象 | 効き方 |
|---|---|---|
| `--no-auth` | `python-web` と `react-spa` | `python-web` は login / register / JWT / users を除きます。`react-spa` は React SPA の認証（ログイン、ユーザー）を除きます。`react-spa-cloudflare` と `go-react-admin` は、指定すると壊れた生成物になる既知の不具合があります（#333、ADR 0003） |
| `--no-sample` | `python-web` のみ | items の CRUD サンプルを除きます。`--no-auth` とは独立しています |
| `--no-github-templates` | すべて | `meta/github-workflow/` の PR / Issue テンプレートを生成物へ入れません |

`--no-auth` の `react-spa` 側（`react-spa-cloudflare` と `go-react-admin` は #333 のとおり壊れています）は、`scripts/scaffold/lib/noauth.sh` が `.noauth-remove` の一覧でファイルを消します。残る参照はヒアドキュメントで書き換えます。`python-web` 側は、`python_features.sh` が `.noauth-remove` / `.nosample-remove` と `@scaffold:remove-if` の目印を使います。

## どこを触れば何が変わるか

| したいこと | 触る場所 |
|---|---|
| 新しいテンプレートを足す | `boilerplates/<name>/template.toml` を追加し、`scripts/scaffold/lib/common.sh` の `VALID_TEMPLATES` と `detect_family` に足します。`.github/workflows/<name>.yml` と `scaffold-verify-<name>.yml` を用意し、`make readme-list` で README を更新します。サーバーを持つ場合は、ルート `Makefile` の `SERVERS` とポート表にも足します |
| 画面の部品を変える | 各テンプレートの `src/components/` などを直接変えます。Astryx の版は各 `package.json` で固定しており、CSS の読み込み順は `src/main.tsx` の reset → 部品 → テーマです。`react-spa` と `react-spa-cloudflare` は、見た目が変わったら `make e2e-update-snapshots` で VRT の基準画像を更新します |
| `--no-auth` を変える | `react-spa` は `scripts/scaffold/lib/noauth.sh` と各テンプレートの `.noauth-remove` を直します。検証は `scaffold-verify-react-spa-noauth.yml` です。`python-web` は `scripts/scaffold/lib/python_features.sh`、`.noauth-remove`、`@scaffold` の目印を直し、`scaffold-verify-python-web-flags.yml` で見ます |
| CI を足す | `.github/workflows/<template>.yml` を足します。生成物の CI になるので、テンプレート名を含む paths やモノレポ固有の設定は `scaffold.sh` の変換が前提です。デプロイは `<template>-deploy.yml` です |

## ADR への導線

決定の理由と捨てた案は `docs/adr/` にあります。索引は `docs/adr/README.md` で、`generate-adr-index.zsh` が frontmatter から自動生成します。

- [0001: 直近リポジトリからのテンプレ抽出は「推奨度・高」のみ採用し static-lp / python-llm-pipeline を新設する](adr/0001-extract-templates-from-recent-repos.md)
- [0002: scaffold のあとに毎回消されるサンプルはフラグで外せるようにし、テンプレート一覧は template.toml を正本にする](adr/0002-scaffold-flags-and-template-list-source.md)
- [0003: 使っていないテンプレートを削除し、画面のある React テンプレートは Astryx を前提にする](adr/0003-adopt-astryx-for-react-templates.md)
