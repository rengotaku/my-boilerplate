# Go React SPA Boilerplate

Monolithic Go server with an embedded React SPA. The Go binary serves the
SPA bundle and JSON API from a single port; in dev mode, Vite runs separately
on `:5174` and proxies `/api` to Go on `:8080`.

## Composite template

This template is **composite**: it does not ship its own React source tree.
Instead, the frontend is composed at build/dev time from:

- `react-spa/` (sibling template) — the base SPA
- `frontend.overlay/` — monolith-specific differences (`vite.config.ts`
  proxy + `outDir`, empty `.env.production` so the bundle hardcodes
  same-origin requests, `api/client.ts` `??` fallback)
- `.compose.toml` — manifest that drives the merge

`make compose` materializes both into `frontend/`. The materialized
`frontend/` is **gitignored**; it is regenerated from base + overlay each
time. When this template is scaffolded via `scripts/download.sh`, scaffold
runs the same compose step against the extracted tarball and the
**resulting project no longer needs the base template** — the scaffolded
`frontend/` is self-contained and the `compose` machinery is stripped from
its Makefile.

## Project structure

```
go-react-spa/
├── .compose.toml         # composite manifest (base + overlay)
├── cmd/server/main.go    # binary entrypoint (signal wiring + server.Run)
├── internal/
│   ├── server/           # Run(ctx) error — config + DB + HTTP lifecycle
│   ├── handler/          # HTTP + JSON API
│   └── static/
│       ├── static.go         # FileSystem interface
│       ├── static_embed.go   # //go:build !dev — embeds dist/
│       ├── static_dev.go     # //go:build dev   — empty stub
│       └── dist/             # vite build output (embedded into binary)
├── frontend.overlay/     # monolith-only diffs over react-spa
├── frontend/             # composed at build time (gitignored)
├── go.mod
└── Makefile
```

## Build tags

The static asset path is selected at build time:

| Tag        | File                | Behavior                                              |
|------------|---------------------|-------------------------------------------------------|
| (default)  | `static_embed.go`   | `embed.FS` reads `internal/static/dist/` into binary  |
| `-tags dev`| `static_dev.go`     | empty FS — Vite serves the SPA on `:5174`             |

`make run` runs `air` with `-tags dev` so the embedded bundle is bypassed
and Vite is the source of truth for SPA assets. `make build` uses the
default tag set so the bundle is embedded into the produced binary.

## Prerequisites

- Go 1.25+
- Node.js (matches `react-spa/.node-version`)
- [air](https://github.com/cosmtrek/air) (only for `make run`)
- [golangci-lint](https://golangci-lint.run/) v2.11+

## Quick start

```bash
# Install: composes frontend/ from base+overlay, then `go mod download` + `npm ci`
make install

# Build: `vite build` -> internal/static/dist/, then `go build` embedding the bundle
make build

# Run the built binary (single port, serves SPA + API)
make run-binary
# open http://localhost:8080
```

## Development

```bash
# Two-process dev: Go (:8080) with hot reload + Vite (:5174) in parallel.
# Vite proxies /api -> :8080, so open http://localhost:5174
make run

# Stop both
make stop
```

## Available commands

```bash
make install         # compose + download Go modules + npm ci
make compose         # materialize frontend/ from base + overlay
make compose-clean   # remove frontend/
make build-frontend  # vite build -> internal/static/dist/
make build           # build-frontend + go build (monolithic binary)
make run             # Go (air, -tags dev) + Vite in parallel
make run-binary      # run the built monolithic binary (no hot reload)
make stop            # kill dev servers on :8080 and :5174
make status          # report which dev servers are running
make lint            # golangci-lint
make lint-frontend   # frontend ESLint
make test            # go test
make test-frontend   # frontend tests
make test-cov        # go test with coverage
make coverage        # frontend tests with coverage
make migrate         # apply migrations via GORM AutoMigrate
make migrate-diff    # generate atlas migration (requires atlas CLI)
make migrate-apply   # apply pending atlas migrations (requires atlas CLI)
make migrate-hash    # rehash migration directory (requires atlas CLI)
make check           # all linters + tests
make ci              # CI: lint + test-cov + frontend lint + frontend test
make verify          # smoke-test the scaffold pathway in a tmp dir
make clean           # remove bin/, coverage.out, app.db, frontend/node_modules, dist/*
```

## Configuration

| Variable          | Default                   | Description                                     |
|-------------------|---------------------------|-------------------------------------------------|
| PORT              | 8080                      | Go server port                                  |
| SHUTDOWN_TIMEOUT  | 10s                       | Graceful shutdown timeout                       |
| DATABASE_DSN      | app.db                    | SQLite database file path                       |
| JWT_SECRET        | change-me-in-production   | HMAC secret for JWT signing/validation          |
| JWT_TTL           | 24h                       | Issued JWT lifetime                             |
| LOG_LEVEL         | INFO                      | slog level (DEBUG / INFO / WARN / ERROR)        |
| APP_ENV           | (unset)                   | Set to `production` for JSON logs + gin release |

## Routes

| Method | Path                  | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | /health               | Health check                         |
| GET    | /api/v1/users         | List users                           |
| POST   | /api/v1/users         | Create user                          |
| GET    | /api/v1/users/{id}    | Get user                             |
| PUT    | /api/v1/users/{id}    | Update user                          |
| DELETE | /api/v1/users/{id}    | Delete user                          |
| GET    | /{anything-else}      | SPA fallback (embedded `dist/`, served via NotFound for client-side routing) |

## Scaffolding

Use the boilerplate-wide download script to scaffold a standalone project:

```bash
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- go-react-spa ~/projects/my-app
```

The scaffold step composes `frontend/` from the base template + overlay,
rewrites the Go module path and `package.json` `name`, strips the compose
machinery from the Makefile, and produces a self-contained directory where
`make install && make build && ./bin/server` works immediately.

If the project will be published, after scaffolding run:

```bash
go mod edit -module github.com/<user>/<repo>
```

## cobra subcommand への組み込み

Server lifecycle は `internal/server` パッケージの `Run(ctx context.Context) error`
に切り出されている。`cmd/server/main.go` は `signal.NotifyContext` でシグナルを
受ける薄ラッパで、本体は `server.Run()` 一行。

既存の cobra CLI に「サーバ起動」サブコマンドとして組み込む場合、`Run()` を
import してそのまま `RunE` に渡せる:

```go
package main

import (
	"github.com/spf13/cobra"

	// このテンプレートを scaffold した module path に合わせて差し替え:
	"<your-module>/internal/server"
)

func newServeCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "serve",
		Short: "Start the API server (graceful shutdown on SIGINT/SIGTERM)",
		RunE: func(cmd *cobra.Command, _ []string) error {
			// cobra が `cmd.SetContext(signal.NotifyContext(...))` で
			// シグナル付き ctx を流していれば、ここで再度 signal.Notify は不要。
			return server.Run(cmd.Context())
		},
	}
}
```

`Run()` は内部で `envconfig` から `PORT` / `DATABASE_DSN` / `SHUTDOWN_TIMEOUT`
等を読み込み、`ctx` が cancel されたら `SHUTDOWN_TIMEOUT` 内で graceful
shutdown して `nil` を返す。サーバ起動が失敗した場合は wrapped error を返すので、
cobra 側の `SilenceErrors` / `SilenceUsage` と組み合わせて適切に表示できる。

`scripts/download.sh go-react-spa <existing-cobra-repo> --pick=internal/server/,internal/handler/,internal/service/,internal/repository/,internal/model/,internal/static/`
で必要な内部パッケージだけ既存リポジトリへ取り込んで使うパターンも想定している
（pick 後に import path を自分の module 名に rewrite する手間は別途必要）。

## Removing authentication

If your project does not need JWT authentication, scaffold without it:

```bash
# Option A: dedicated no-auth template
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- go-react-spa-noauth ~/projects/my-app

# Option B: --no-auth flag on go-react-spa
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- go-react-spa ~/projects/my-app --no-auth
```

Both options remove the following frontend files and clean up their index re-exports:

| Removed | Cleaned up |
|---|---|
| `src/api/auth.ts`, `users.ts`, `users.test.ts` | `src/api/index.ts` |
| `src/api/client.test.ts` | auth-specific tests |
| `src/hooks/useAuthStore.ts`, `useUsers.ts`, `useUsers.test.tsx` | `src/hooks/index.ts` |
| `src/schemas/auth.ts`, `user.ts` | `src/schemas/index.ts` |
| `src/types/auth.ts`, `user.ts` | `src/types/index.ts` |
| `src/pages/LoginPage.tsx`, `LoginPage.test.tsx`, `UsersPage.tsx`, `UsersPage.test.tsx` | `App.tsx`, `src/pages/index.ts` |

`Layout.tsx`, `App.tsx`, and their tests are rewritten to remove auth UI and routes.
`src/api/client.ts` is rewritten to remove Bearer-token injection and 401-redirect logic.
