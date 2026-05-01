# go-ssr-web-minimal

Minimal Go server-side rendering boilerplate. Just `gin` + `html/template` + `embed` + `slog` + `envconfig` + plain CSS.

## What this is

- Single binary that serves a couple of HTML pages and a small static-CSS bundle, all `embed`-ed at build time.
- No database. No auth. No Tailwind / Node toolchain. No Dockerfile. No GitHub Actions deploy pipelines.
- Suitable for read-only viewers, status / dashboard pages, single-endpoint health UIs, and SSO-fronted internal tools where auth lives outside the app.

## What this is not

- Not a full-stack web app starter. If you need GORM + SQLite + sessions + auth + user CRUD + Tailwind + Dockerfile + GitHub Actions, use [`go-ssr-web`](../go-ssr-web) instead.
- Not opinionated about persistence. Add whatever you need (sqlite, files, in-memory, a remote API client) yourself.

## Stack

- [gin-gonic/gin](https://github.com/gin-gonic/gin) — HTTP routing + middleware
- `html/template` — server-rendered templates
- `embed` — single-binary deploy (templates and static CSS shipped in the binary)
- [lmittmann/tint](https://github.com/lmittmann/tint) — colorized `slog` output for dev; structured JSON for production
- [sethvargo/go-envconfig](https://github.com/sethvargo/go-envconfig) — env-var-based config

## Layout

```
.
├── cmd/server/main.go           # gin + envconfig + slog + graceful shutdown
├── internal/handler/            # HTTP handlers (one sample: index + healthz)
├── web/
│   ├── embed.go                 # //go:embed templates static/css
│   ├── templates/               # base.html + index.html
│   └── static/css/style.css     # plain CSS (no Tailwind)
├── Makefile                     # install, build, run, lint, test, test-cov, ci, clean
├── go.mod
└── README.md
```

## Quick start

```bash
go mod tidy
make run
# or
make build && ./bin/server
```

The default port is `8083`. Override via `PORT=9000 make run`.

## Configuration

Environment variables:

| Variable           | Default | Description                                |
|--------------------|---------|--------------------------------------------|
| `PORT`             | `8083`  | HTTP listen port                           |
| `APP_ENV`          | _empty_ | Set to `production` for JSON logs + release-mode gin |
| `GREETING`         | `world` | Sample value rendered on the home page     |
| `LOG_LEVEL`        | `info`  | `debug` / `info` / `warn` / `error`        |
| `SHUTDOWN_TIMEOUT` | `10s`   | Graceful-shutdown timeout                  |

## Endpoints

- `GET /` — renders `index.html`
- `GET /healthz` — returns `{"status":"ok"}`
- `GET /static/*` — serves embedded CSS

Add new routes in `internal/handler/handler.go`. Add new templates by creating `web/templates/<name>.html` and registering it in `loadTemplates()` in `cmd/server/main.go`.

## Tests

```bash
make test            # go test ./...
make test-cov        # go test -coverprofile=coverage.out ./...
```

## See also

- [`go-ssr-web`](../go-ssr-web) — full-stack variant with DB / auth / Tailwind / Dockerfile.
