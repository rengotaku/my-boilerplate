# Go SSR Web Boilerplate

A minimal Go server-side rendering web application boilerplate (batteries included).

## Features

- HTTP framework: [gin-gonic/gin](https://github.com/gin-gonic/gin)
- Server-side HTML rendering with `html/template`
- ORM: [GORM](https://gorm.io/) + SQLite ([glebarez/sqlite](https://github.com/glebarez/sqlite) — pure Go)
- Migrations: [Atlas](https://atlasgo.io/)
- Session-based auth: [gorilla/sessions](https://github.com/gorilla/sessions) cookie store + bcrypt
- Config: [sethvargo/go-envconfig](https://github.com/sethvargo/go-envconfig)
- Logging: `log/slog` (standard library) + [tint](https://github.com/lmittmann/tint) for dev pretty-printing
- Testing: [testify](https://github.com/stretchr/testify)
- Tailwind CSS v4 (standalone CLI)
- Embedded templates and static files
- Docker support
- GitHub Actions CI with 80%+ coverage requirement

## Project Structure

```
go-ssr-web/
├── atlasgen/
│   └── main.go              # Atlas schema generator (build tag: ignore)
├── cmd/
│   ├── migrate/
│   │   └── main.go          # GORM AutoMigrate entry point
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── handler/             # gin HTTP handlers (auth, user CRUD, render)
│   ├── middleware/          # gorilla/sessions middleware
│   ├── model/               # GORM models
│   ├── repository/          # Data access layer (GORM)
│   ├── service/             # Business logic + bcrypt
│   └── testutil/            # Test helpers (in-memory SQLite)
├── migrations/              # Atlas SQL migrations
├── web/
│   ├── embed.go
│   ├── templates/           # HTML templates
│   └── static/
│       ├── css/
│       └── icons/
├── atlas.hcl
├── Dockerfile
├── go.mod
├── Makefile
└── README.md
```

## Prerequisites

- Go 1.24+
- [golangci-lint](https://golangci-lint.run/welcome/install/) (for linting)
- [atlas](https://atlasgo.io/) CLI (optional — only required for `make migrate-diff` / `migrate-apply`)

## Quick Start

```bash
# Install dependencies
make install

# Apply migrations (GORM AutoMigrate; no atlas required)
make migrate

# Run the server
make run

# Open http://localhost:8080
```

The server seeds nothing by default. Create your first account from `/users/new` (it sets a bcrypt-hashed password) and sign in via `/login`.

## Available Commands

```bash
make install        # Download dependencies
make build          # Build the binary (and Tailwind CSS)
make run            # Run the server
make stop           # Stop the server (kills :PORT)
make status         # Show running status
make lint           # Run golangci-lint
make test           # Run tests
make test-cov       # Run tests with coverage
make check          # lint + test
make ci             # lint + test-cov
make migrate        # Apply migrations via GORM AutoMigrate
make migrate-diff   # Generate a new migration (requires atlas CLI)
make migrate-apply  # Apply pending migrations (requires atlas CLI)
make migrate-hash   # Rehash the migration directory (requires atlas CLI)
make tailwind-build # Rebuild Tailwind CSS
make clean          # Remove build artifacts and app.db
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server port |
| `DATABASE_DSN` | `app.db` | SQLite database path |
| `SESSION_SECRET` | `change-me-in-production` | Cookie store secret (REQUIRED in production) |
| `SESSION_MAX_AGE` | `86400` | Session cookie max-age (seconds) |
| `SHUTDOWN_TIMEOUT` | `10s` | Graceful shutdown timeout |
| `APP_ENV` | _(unset)_ | Set to `production` for JSON logs + Secure cookie + gin ReleaseMode |
| `LOG_LEVEL` | `INFO` | Log level (DEBUG / INFO / WARN / ERROR) |

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | public | Home page |
| GET | `/login` | public | Login form |
| POST | `/login` | public | Submit credentials |
| POST | `/logout` | required | Clear session |
| GET | `/profile` | required | Current user info |
| GET | `/users` | public | List users |
| GET | `/users/new` | public | New user form (sets password) |
| POST | `/users` | public | Create user |
| GET | `/users/:id` | public | Show user |
| GET | `/users/:id/edit` | public | Edit user form |
| POST | `/users/:id` | public | Update user |
| POST | `/users/:id/delete` | public | Delete user |
| GET | `/static/*` | public | Static files |

## Docker

```bash
docker build -t go-ssr-web .
docker run -p 8080:8080 go-ssr-web
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| HTTP framework | gin-gonic/gin |
| Templates | html/template (standard library) |
| ORM | GORM + glebarez/sqlite |
| Migrations | Atlas (+ GORM AutoMigrate fallback) |
| Auth (sessions) | gorilla/sessions + bcrypt |
| Logging | slog (standard library) + tint |
| Configuration | sethvargo/go-envconfig |
| Styling | Tailwind CSS v4 (standalone CLI) |
| Testing | go test + testify |

## License

MIT
