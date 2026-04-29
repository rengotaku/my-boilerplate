# Go REST API Boilerplate

Go + Gin + GORM + JWT の Batteries Included な REST API ボイラープレート。

## Features

- **Router**: [Gin](https://github.com/gin-gonic/gin) — 高速 HTTP ルーター・バリデーション組み込み
- **ORM**: [GORM](https://gorm.io/) + [SQLite](https://github.com/glebarez/sqlite) (pure Go, CGO 不要)
- **Migrations**: [Atlas](https://atlasgo.io/) — スキーマバージョン管理
- **Auth**: [golang-jwt/jwt](https://github.com/golang-jwt/jwt) — JWT Bearer 認証
- **Config**: [go-envconfig](https://github.com/sethvargo/go-envconfig) — 環境変数設定
- **Logging**: `log/slog` (標準ライブラリ)
- **Testing**: [testify](https://github.com/stretchr/testify) + in-memory SQLite
- **Linter**: [golangci-lint](https://golangci-lint.run/)
- **API Spec**: OpenAPI 3.0

## Prerequisites

- [Go](https://go.dev/dl/) 1.22+
- [golangci-lint](https://golangci-lint.run/welcome/install/)
- [atlas CLI](https://atlasgo.io/docs/getting-started) (optional, for migrations)
- [Docker](https://docs.docker.com/get-docker/) (optional)

## Quick Start

```bash
# Install dependencies
make install

# Run server (auto-migrates DB on startup)
make run

# Register a user
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'

# Login and get token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'

# Use token for protected endpoints
curl http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer <token>"
```

## Development (Hot Reload)

```bash
go install github.com/air-verse/air@latest
make dev
```

## Commands

```bash
make help            # Show all commands
make install         # Download dependencies
make build           # Build the binary
make run             # Run the server
make dev             # Run with hot reload
make lint            # Run golangci-lint
make test            # Run tests
make test-cov        # Run tests with coverage
make check           # Run lint + test
make ci              # Run lint + test-cov
make migrate-diff    # Generate migration (requires atlas CLI)
make migrate-apply   # Apply migrations (requires atlas CLI)
make migrate-hash    # Rehash migration dir (requires atlas CLI)
make clean           # Remove build artifacts
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /health | — | Health check |
| POST | /api/v1/users | — | Register a user |
| POST | /api/v1/auth/login | — | Login, returns JWT |
| GET | /api/v1/users | Bearer | List all users |
| GET | /api/v1/users/{id} | Bearer | Get a user |
| PUT | /api/v1/users/{id} | Bearer | Update a user |
| DELETE | /api/v1/users/{id} | Bearer | Delete a user |

## Project Structure

```
go-rest-api/
├── atlasgen/
│   └── main.go               # Atlas schema generator (go:build ignore)
├── cmd/
│   └── server/
│       └── main.go           # Entry point
├── internal/
│   ├── handler/              # Gin HTTP handlers
│   ├── middleware/           # JWT auth middleware
│   ├── model/                # GORM models
│   ├── repository/           # Data access (GORM)
│   ├── service/              # Business logic
│   └── testutil/             # Shared test helpers
├── migrations/               # Atlas SQL migration files
├── api/
│   └── openapi.yaml          # OpenAPI specification
├── atlas.hcl                 # Atlas configuration
├── go.mod
├── Makefile
└── README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | Server port |
| SHUTDOWN_TIMEOUT | 10s | Graceful shutdown timeout |
| DATABASE_DSN | app.db | SQLite database path |
| JWT_SECRET | change-me-in-production | JWT signing secret |
| JWT_EXPIRY | 24h | JWT token expiry |
| APP_ENV | — | Set to `production` for JSON logs |
| LOG_LEVEL | — | Log level (DEBUG/INFO/WARN/ERROR) |

## Atlas Migrations

Atlas CLI を使ってスキーマのバージョン管理ができます。

```bash
# Install atlas CLI
curl -sSf https://atlasgo.sh | sh

# Generate migration from GORM model changes
make migrate-diff

# Apply pending migrations
make migrate-apply

# After editing migration files manually, rehash
make migrate-hash
```

## Docker

```bash
docker build -t go-rest-api .
docker run -p 8080:8080 -e JWT_SECRET=your-secret go-rest-api
```

## License

MIT
