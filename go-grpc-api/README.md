# Go gRPC API Boilerplate

A minimal Go gRPC API boilerplate with clean architecture.

## Features

- gRPC server with reflection enabled
- Protocol Buffers with buf for schema management
- Input validation using protovalidate
- Clean architecture (repository/service/server layers)
- **ORM**: [GORM](https://gorm.io/) + SQLite ([glebarez/sqlite](https://github.com/glebarez/sqlite) — pure Go)
- **Migrations**: [Atlas](https://atlasgo.io/)
- **Auth**: [golang-jwt/jwt](https://github.com/golang-jwt/jwt)
- **Config**: [sethvargo/go-envconfig](https://github.com/sethvargo/go-envconfig)
- Structured logging with slog (標準ライブラリ)
- **Testing**: [testify](https://github.com/stretchr/testify)
- Docker support
- GitHub Actions CI with 80%+ coverage requirement

## Project Structure

```
go-grpc-api/
├── atlasgen/
│   └── main.go              # Atlas schema generator
├── cmd/
│   ├── migrate/
│   │   └── main.go          # Migration entry point
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── middleware/           # JWT auth interceptor
│   ├── model/               # GORM models
│   ├── server/              # gRPC server implementation
│   ├── service/             # Business logic
│   ├── repository/          # Data access layer (GORM)
│   └── testutil/            # Test helpers
├── migrations/              # Atlas SQL migrations
├── api/
│   └── proto/
│       └── v1/
│           └── user.proto   # Protocol Buffer definitions
├── pkg/
│   └── pb/                  # Generated protobuf code
├── buf.yaml                 # Buf configuration
├── buf.gen.yaml             # Buf code generation config
├── go.mod
├── Makefile
├── .golangci.yml
├── Dockerfile
└── README.md
```

## Prerequisites

- Go 1.21+
- [buf](https://buf.build/docs/installation) (for protobuf management)
- [golangci-lint](https://golangci-lint.run/welcome/install/) (for linting)
- [grpcurl](https://github.com/fullstorydev/grpcurl) (optional, for testing)

## Quick Start

```bash
# Install dependencies
make install

# Generate protobuf code
make generate

# Run the server
make run
```

## Development (Hot Reload)

```bash
# Install Air (once)
go install github.com/air-verse/air@latest

# Run with hot reload
make dev
```

Air will watch `.go` files and automatically rebuild/restart the server on changes.

## Available Commands

```bash
make install        # Download dependencies
make generate       # Generate protobuf code
make build          # Build the binary
make run            # Run the server
make dev            # Run with hot reload (requires air)
make lint           # Run golangci-lint
make test           # Run tests
make test-cov       # Run tests with coverage
make check          # Run lint + test
make ci             # Run lint + test with coverage
make migrate        # Apply migrations (GORM AutoMigrate, no atlas required)
make migrate-diff   # Generate a new migration (requires atlas CLI)
make migrate-apply  # Apply pending migrations (requires atlas CLI)
make migrate-hash   # Rehash the migration directory (requires atlas CLI)
make clean          # Remove build artifacts
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `50051` | gRPC server port |
| `DATABASE_DSN` | `app.db` | SQLite database path |
| `JWT_SECRET` | `change-me-in-production` | JWT signing secret |
| `APP_ENV` | `` | Set to `production` for JSON logging |
| `LOG_LEVEL` | `INFO` | Log level (DEBUG, INFO, WARN, ERROR) |

## API

### UserService

| Method | Description |
|--------|-------------|
| ListUsers | Returns all users |
| GetUser | Returns a user by ID |
| CreateUser | Creates a new user |
| UpdateUser | Updates an existing user |
| DeleteUser | Deletes a user by ID |

## Testing with grpcurl

```bash
# List services
grpcurl -plaintext localhost:50051 list

# List methods
grpcurl -plaintext localhost:50051 list api.v1.UserService

# Create a user
grpcurl -plaintext -d '{"name": "John Doe", "email": "john@example.com"}' \
  localhost:50051 api.v1.UserService/CreateUser

# List users
grpcurl -plaintext localhost:50051 api.v1.UserService/ListUsers

# Get a user
grpcurl -plaintext -d '{"id": "user-id"}' \
  localhost:50051 api.v1.UserService/GetUser

# Update a user
grpcurl -plaintext -d '{"id": "user-id", "name": "Jane Doe", "email": "jane@example.com"}' \
  localhost:50051 api.v1.UserService/UpdateUser

# Delete a user
grpcurl -plaintext -d '{"id": "user-id"}' \
  localhost:50051 api.v1.UserService/DeleteUser
```

## Docker

```bash
# Build image
docker build -t go-grpc-api .

# Run container
docker run -p 50051:50051 go-grpc-api
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | grpc-go |
| Proto Management | buf |
| Validation | protovalidate |
| ORM | GORM + glebarez/sqlite |
| Migrations | Atlas |
| Auth | golang-jwt/jwt |
| Logging | slog (standard library) |
| Configuration | sethvargo/go-envconfig |
| Testing | go test + testify |

## License

MIT
