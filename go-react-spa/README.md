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
├── cmd/server/main.go    # binary entrypoint
├── internal/
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
- [air](https://github.com/cosmtrek/air) — installed automatically by `make install`
- [golangci-lint](https://golangci-lint.run/) v2.11+

## Quick start

```bash
# Install: composes frontend/ from base+overlay, then `go mod download`,
# `go install air`, and `npm ci`
make install

# Build: `vite build` -> internal/static/dist/, then `go build` embedding the bundle
make build

# Run the built monolithic binary (single port, serves SPA + API)
make start
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
make install            # compose + download Go modules + air + npm ci
make compose            # materialize frontend/ from base + overlay
make compose-clean      # remove frontend/
make build-frontend     # vite build -> internal/static/dist/
make build              # build-frontend + go build (monolithic binary)
make run                # Go (air, -tags dev) + Vite in parallel (dev mode)
make start              # run the built monolithic binary
make stop               # kill dev servers on :8080 and :5174
make status             # report which dev servers are running
make lint               # golangci-lint
make lint-frontend      # frontend ESLint
make test               # go test
make test-frontend      # frontend tests
make test-cov           # go test with coverage
make test-cov-frontend  # frontend tests with coverage
make check              # all linters + tests
make ci                 # CI: lint + test-cov + frontend lint + frontend test
make verify             # smoke-test the scaffold pathway in a tmp dir
make clean              # remove bin/, coverage.out, frontend/node_modules, dist/*
```

## Configuration

| Variable | Default | Description                |
|----------|---------|----------------------------|
| PORT     | 8080    | Go server port             |

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
