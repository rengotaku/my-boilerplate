# my-boilerplate

Collection of project boilerplates.

## Principles

1. **Minimal**: 必要最低限のファイルのみ。過剰な設定は追加しない
2. **Modern**: 各言語の最新ツール・ベストプラクティスを採用
3. **CI-first**: GitHub Actionsで品質チェック。ローカルフック不要
4. **Test-ready**: テスト環境セットアップ済み。80%カバレッジ目標
5. **SQLite-first** (Web): 開発・テスト環境はSQLiteを使用。本番DBへの移行は利用者判断

## Standard Structure

```
<boilerplate>/
├── Makefile          # install, lint, test, clean
├── .github/
│   └── workflows/    # CI設定
├── README.md         # セットアップ手順
├── src/ or cmd/      # ソースコード
└── tests/            # テストコード
```

## Naming Convention

```
{language}-{type}
```

| Type | Description |
|------|-------------|
| cli | コマンドラインツール |
| rest-api | REST API |
| graphql-api | GraphQL API |
| grpc-api | gRPC API |
| web | Web API / Webアプリ |

## Quality Gates (CI)

| Check | Python | Go |
|-------|--------|-----|
| Linting | ruff | golangci-lint |
| Type checking | mypy | Go標準 |
| Formatting | ruff format | gofmt |
| Tests + Coverage | pytest --cov (80%+) | go test -cover (80%+) |

## Available Boilerplates

各テンプレートは `boilerplates/<name>/` 配下に集約されています（`e2e/`, `meta/`, `scripts/`, `specs/` などテンプレ以外と分離）。`download.sh` / `scaffold.sh` に渡すのは従来どおりテンプレート名のみで、パスを意識する必要はありません。

一覧は各テンプレートの `template.toml` から生成しています（`make readme-list`）。手で編集しないでください。`download.sh --list` も同じ元から出します。

<!-- BEGIN: template-list -->
| Name | Description |
|------|-------------|
| [chrome-extension](./boilerplates/chrome-extension) | Chrome Extension (MV3) with Vite, @crxjs, TypeScript, Vitest |
| [go-cli-wrapper](./boilerplates/go-cli-wrapper) | 外部 CLI ラッパー向け Go CLI（execx + logscan + fallback + envx + fakebin） |
| [go-cli](./boilerplates/go-cli) | Batteries-included な Go CLI（cobra + slog + envconfig + Make ターゲット） |
| [go-react-admin](./boilerplates/go-react-admin) | 管理コンソール（運用ダッシュボード）を全面に据えた Go + React フルスタック。worker+web 単一バイナリ / gin + embed / SQLite メトリクスストア / jsonl ログ / Prometheus / Astryx + recharts 管理画面 |
| [mcp-server](./boilerplates/mcp-server) | MCP Server (stdio) template with TypeScript, Vitest, and @modelcontextprotocol/sdk |
| [python-cli](./boilerplates/python-cli) | uv + Typer + ruff + mypy + pytest の Python CLI |
| [python-llm-pipeline](./boilerplates/python-llm-pipeline) | uv + Typer + ruff + mypy + pytest の LLM パイプライン基盤 (backend Protocol / retry / SQLite state store) |
| [python-web](./boilerplates/python-web) | FastAPI + Jinja2 + Alpine.js + Tailwind CSS + SQLite の Web ボイラープレート |
| [react-spa-cloudflare](./boilerplates/react-spa-cloudflare) | Cloudflare Pages デプロイ向けに最適化された Astryx ベースの React SPA |
| [react-spa](./boilerplates/react-spa) | Vite + TypeScript + Astryx + Zustand の最小 React SPA |
| [static-lp](./boilerplates/static-lp) | SEO 向けにビルド時プリレンダリング（SSG）する、Cloudflare Pages デプロイ向け静的 LP テンプレート |
<!-- END: template-list -->

## Roadmap

| Priority | Template | Status |
|----------|----------|--------|
| - | python-cli | Done |
| - | go-cli | Done |
| Future | go-web | Planned |

## Dev Server Management

```bash
# Check all servers
make status

# Stop all servers
make stop-all
```

### Port Convention

| Project | Port | Usage |
|---------|------|-------|
| go-react-admin | 8084 / 5175 | Admin console (Go API / Vite dev) |
| react-spa | 5173 | Vite dev |

### New Project Checklist

When adding a new server project:
- [ ] Add `PORT`, `stop`, `status` targets to Makefile
- [ ] Add to `SERVERS` in root Makefile
- [ ] Update port convention table above

## Usage

リポジトリをクローンせずに、テンプレートを 1 コマンドで scaffold 済みのスタンドアロンプロジェクトとして配置できます。**scaffold（placeholder 置換）は常時実行**で opt-out はありません。

```bash
# どのテンプレートも基本これだけ。`name` は <dest> から自動推定される
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- go-react-admin ~/projects/my-new-app
```

オプション:

| Option | Description |
|--------|-------------|
| `--name=NAME` | プロジェクト名。省略時は `basename(<dest>)` |
| `--no-auth` | 認証を scaffold 時に外します。`python-web` は login / register / JWT / users を、`react-spa` は認証（ログイン画面・ユーザー一覧・JWT）を除きます。バックエンドを持たない `react-spa` の単体アプリは、これを付けます |
| `--no-sample` | `python-web` のみ。items の CRUD サンプルを scaffold 時に外します。`--no-auth` とは独立しており、同時に指定できます |
| `--no-github-templates` | `.github/` の PR・Issue テンプレートを入れません |

`python-web` で両方のフラグを同時に使う例:

```bash
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- python-web ~/projects/my-app --no-auth --no-sample
```

Go テンプレートの場合、`go.mod` の `module` 行は `basename(<dest>)`（ローカル限定モジュール）で初期化されます。**公開予定の場合**はスキャフォールド後に canonical path へ書き換えてください:

```bash
cd ~/projects/my-new-app
go mod edit -module github.com/<user>/<repo>
```

環境変数で fork や別 ref を指定可能:

```bash
MY_BOILERPLATE_REPO=myorg/my-fork MY_BOILERPLATE_REF=v1.0.0 \
  sh download.sh react-spa ~/projects/my-app
```

リポジトリをクローン済みなら直接 [`scripts/scaffold/scaffold.sh`](./scripts/scaffold/scaffold.sh) も使えます。`download.sh` はそれをラップして「リポジトリ未取得」状態から実行できるようにしたものです。

### github-workflow テンプレートを既存プロジェクトに取り込む

`meta/github-workflow/` の PR/Issue テンプレートを既存プロジェクトへコピーするには `--pick` モードを使います（scaffold は不要）。

```bash
# 取り込み可能なファイル一覧を確認 (dry-run)
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- github-workflow . \
    --pick=PR-template.md,parent-issue.md,sub-issue.md,discussion-issue.md

# 実際にコピー (--apply)
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- github-workflow . \
    --pick=PR-template.md,parent-issue.md,sub-issue.md,discussion-issue.md \
    --apply
```

ファイル一覧の確認:
```bash
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- github-workflow --tree
```

## Dependabot Policy

dependabot PR は以下のルールで運用しています:

| 種別 | 挙動 |
|------|------|
| patch / minor | CI 緑になり次第 **自動でスカッシュマージ**（`.github/workflows/dependabot-auto-merge.yml`） |
| major | `needs-review` ラベルを付与し、**手動レビュー** |
| security update | `update-type` が patch/minor 相当なら自動マージ、major なら手動レビュー |

兄弟 PR の conflict を減らすため、`.github/dependabot.yml` の各 ecosystem は minor/patch を 1 PR に **groups** で集約しています。

## License

MIT
