# Go React Admin Boilerplate

運用ダッシュボード（管理コンソール）を全面に据えた Go + React フルスタック
テンプレート。1 つのバイナリに **worker デーモン** と **web サーバ** を
同居させる。ジョブの実行履歴（runs）・フェーズ・メトリクスを SQLite に
蓄積し、jsonl ログと Prometheus メトリクスを出力する。React 製の管理画面
（shadcn/ui + recharts）で可視化する。

サンプルドメインとして「ジョブ（jobs）とその実行（runs / phases / metrics）」を
同梱しているので、自分の運用対象（バッチ・クローラ・ETL など）に差し替えて使う
土台になる。

## What it is

- **管理コンソール shell**: サイドバー + ルーティング + 一覧/詳細画面という
  「運用ダッシュボードのガワ」が組み上がった状態。
- **example jobs/runs ドメイン**: worker が定期的にダミージョブを実行し、run・
  phase・metric を SQLite に書き込む。Web UI からその履歴とメトリクスを閲覧できる。
- **Web UI のみ**: cobra CLI は持たない（`server --version` / `--config` フラグの
  みの薄いエントリポイント）。SSE / ライブ tail も無く、ログ・run の閲覧はすべて
  REST + 画面側のポーリングで完結する。

## Architecture

```
go-react-admin/
├── cmd/server/main.go        # 薄いエントリポイント（signal 配線 + server.Run）
├── internal/
│   ├── server/               # Run(ctx) error — config + worker + web の lifecycle
│   ├── web/                  # gin: jobs/runs REST API + /metrics + SPA fallback
│   ├── worker/               # 定期実行デーモン（jobs を回して runs を記録）
│   ├── store/                # SQLite メトリクスストア（jobs / runs / phases / metrics）
│   ├── persistlog/           # jsonl ログの追記（LOG_DIR 配下）
│   ├── observability/        # Prometheus レジストリ + ハンドラ
│   ├── config/               # envconfig（env-only。secrets なし）
│   └── static/
│       ├── static.go             # FileSystem interface
│       ├── static_embed.go       # //go:build !dev — dist/ を埋め込み
│       ├── static_dev.go         # //go:build dev   — 空スタブ
│       └── dist/                 # vite build 出力（バイナリに埋め込み）
├── frontend/                 # Vite + React 管理画面（shadcn/ui + recharts）
│   └── .shared-ui.toml       # shared-react-ui の ui + admin を materialize する manifest
├── go.mod
└── Makefile
```

### Single binary（worker + web）

`internal/server.Run(ctx)` が config を読み込み、worker デーモンと HTTP サーバを
起動する。`ctx` が cancel されたら `SHUTDOWN_TIMEOUT` 内で graceful shutdown する。
`cmd/server/main.go` は `signal.NotifyContext` でシグナルを受けて `server.Run()` を
呼ぶだけの薄いラッパ。

### Build tags（embed / dev）

静的アセットの供給元はビルドタグで切り替わる:

| Tag        | File              | Behavior                                              |
|------------|-------------------|-------------------------------------------------------|
| (default)  | `static_embed.go` | `embed.FS` が `internal/static/dist/` をバイナリに埋め込む |
| `-tags dev`| `static_dev.go`   | 空の FS — Vite が `:5175` で SPA を配信                |

`make run` は air を `-tags dev` で回し、Vite を SPA の source of truth にする。
`make build` はデフォルトタグで dist/ をバイナリに埋め込む。

### Persistence / Observability

- **SQLite メトリクスストア** (`internal/store`): jobs / runs / phases / metrics を
  保存。DSN は `DATABASE_DSN`（default `admin.db`）。
- **jsonl persistlog** (`internal/persistlog`): run のログ行を `LOG_DIR` 配下に
  jsonl で追記。
- **Prometheus** (`internal/observability`): `/metrics` で標準メトリクスを公開。

### REST API

| Method | Path                          | Description                                  |
|--------|-------------------------------|----------------------------------------------|
| GET    | /health                       | ヘルスチェック                               |
| GET    | /metrics                      | Prometheus メトリクス                        |
| GET    | /api/runs                     | run 一覧（`job_id` / ページング クエリ対応） |
| GET    | /api/runs/:id                 | run 詳細（phases / metrics / ログ含む）      |
| GET    | /api/metrics/aggregate        | メトリクスの集計（ダッシュボード用）         |
| GET    | /api/config                   | 設定一覧（env=読み取り専用 / toml=編集可 を判別）|
| PUT    | /api/config                   | toml 設定の更新（再起動で反映。env は不可）  |
| POST   | /api/restart                  | worker+web の再起動（toml 値を再読込）        |
| GET    | /{anything-else}              | SPA fallback（埋め込み dist/、クライアント側ルーティング用） |

### shared-react-ui の admin compose

`frontend/.shared-ui.toml` の `[ui]` / `[admin]` セクションが scaffold 時に働く。
`shared-react-ui/src/{ui,admin}` を `frontend/src/components/{ui,admin}` へ
materialize する。これにより scaffold 後のプロジェクトは shared-react-ui に
依存せず自己完結する（shadcn の「コピペで追加」ワークフローを維持）。
monorepo 内のローカル開発では `make compose-ui` が同じ merge を行う。

## Prerequisites

- Go 1.25+
- Node.js（`frontend/.node-version` に従う）
- [air](https://github.com/cosmtrek/air) と [golangci-lint](https://golangci-lint.run/) v2.11+
  （いずれも `make setup` で導入）

## Quick start

```bash
# Bootstrap: install（shared UI/admin compose + go mod download + npm ci）+ 開発ツール（air, golangci-lint）
make setup

# Build: vite build -> internal/static/dist/、go build で dist/ を埋め込み
make build

# 単一バイナリを実行（worker + web、1 ポートで SPA + API を配信）
make run-binary
# open http://localhost:8084
```

## Development

```bash
# 2 プロセス開発: Go (:8084) を air でホットリロード + Vite (:5175) を並行起動。
# Vite が /api -> :8084 に proxy するので http://localhost:5175 を開く
make run

# 両方停止
make stop
```

## Available commands

```bash
make install         # compose-ui + go mod download + npm ci
make setup           # install + 開発ツール（air, golangci-lint）
make compose-ui      # shared-react-ui の ui/admin を frontend/ に materialize（monorepo 外では no-op）
make build-frontend  # vite build -> internal/static/dist/
make build           # build-frontend + go build（単一バイナリ）
make run             # Go (air, -tags dev) + Vite を並行起動
make run-binary      # ビルド済みの単一バイナリを実行（ホットリロードなし）
make stop            # :8084 / :5175 の dev サーバを停止
make status          # dev サーバの稼働状況を表示
make lint            # golangci-lint
make lint-frontend   # frontend ESLint
make test            # go test
make test-frontend   # frontend tests
make test-cov        # go test with coverage
make coverage        # frontend tests with coverage
make check           # 全 linter + テスト
make ci              # CI: lint + test-cov + frontend lint + frontend test
make clean           # bin/ / coverage.out / *.db / data/ / node_modules / dist/* を削除
```

## Configuration

設定は 2 層に分かれる。**env（インフラ。読み取り専用）** と **toml ファイル（実行時調整値。Config 画面から編集可）**。

### env（読み取り専用）

| Variable     | Default       | Description                                  |
|--------------|---------------|----------------------------------------------|
| PORT         | 8084          | worker+web バイナリの HTTP ポート            |
| DATABASE_DSN | admin.db      | SQLite データベースファイルパス              |
| LOG_DIR      | ./data/logs   | jsonl ログの出力先ディレクトリ               |
| CONFIG_FILE  | config.toml   | 編集可能設定の toml ファイルパス             |

### toml ファイル（編集可。`config.toml`）

初回起動時に既定値で自動生成される。Config 画面のフォームから編集 → 保存（`PUT /api/config`）→
**Restart & apply**（`POST /api/restart`）で worker+web が in-process で再起動し反映される。
保存しただけでは実行中の設定は変わらない（再起動で適用）。

| Key              | Default | Description                      |
|------------------|---------|----------------------------------|
| worker_interval  | 15s     | worker デーモンの実行間隔         |
| shutdown_timeout | 10s     | graceful shutdown のタイムアウト  |

```toml
# config.toml
worker_interval = "15s"
shutdown_timeout = "10s"
```

## Scaffolding

boilerplate 共通の download スクリプトでスタンドアロンプロジェクトを scaffold する:

```bash
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- go-react-admin ~/projects/my-admin
```

scaffold は `frontend/src/components/{ui,admin}` を shared-react-ui から
materialize する（`.shared-ui.toml` は削除される）。あわせて Go の module path と
`package.json` の `name` を書き換える。
`make install && make build && ./bin/server` がそのまま動く自己完結ディレクトリ
を生成する。

公開予定の場合は scaffold 後に canonical path へ書き換える:

```bash
cd ~/projects/my-admin
go mod edit -module github.com/<user>/<repo>
```
