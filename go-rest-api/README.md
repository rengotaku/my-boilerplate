# Go REST API Boilerplate

Go + Chi + ozzo-validation の REST API ボイラープレート。

## Features

- **Router**: [Chi](https://github.com/go-chi/chi)
- **Validation**: [ozzo-validation](https://github.com/go-ozzo/ozzo-validation)
- **Config**: [envconfig](https://github.com/kelseyhightower/envconfig)
- **Logging**: slog (標準ライブラリ)
- **Linter**: [golangci-lint](https://golangci-lint.run/)
- **API Spec**: OpenAPI 3.0

## Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [golangci-lint](https://golangci-lint.run/welcome/install/)
- [Docker](https://docs.docker.com/get-docker/) (optional)

## Quick Start

```bash
# Install dependencies
make install

# Run server
make run

# Test API
curl http://localhost:8080/health
```

## Commands

```bash
make help        # Show all commands
make install     # Download dependencies
make build       # Build the binary
make run         # Run the server
make lint        # Run golangci-lint
make test        # Run tests
make test-cov    # Run tests with coverage
make check       # Run lint + test
make ci          # Run lint + test-cov
make clean       # Remove build artifacts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/v1/users | List all users |
| POST | /api/v1/users | Create a user |
| GET | /api/v1/users/{id} | Get a user |
| PUT | /api/v1/users/{id} | Update a user |
| DELETE | /api/v1/users/{id} | Delete a user |

## Example

```bash
# Create a user
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# List users
curl http://localhost:8080/api/v1/users
```

## Project Structure

```
go-rest-api/
├── cmd/
│   └── server/
│       └── main.go           # Entry point
├── internal/
│   ├── handler/              # HTTP handlers
│   │   ├── handler.go
│   │   ├── handler_test.go
│   │   └── user.go
│   ├── service/              # Business logic
│   │   ├── user.go
│   │   └── user_test.go
│   └── repository/           # Data access
│       └── user.go
├── api/
│   └── openapi.yaml          # OpenAPI specification
├── go.mod
├── Makefile
├── .golangci.yml
├── Dockerfile
└── README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | Server port |
| SHUTDOWN_TIMEOUT | 10s | Graceful shutdown timeout |

## Docker

```bash
# Build image
docker build -t go-rest-api .

# Run container
docker run -p 8080:8080 go-rest-api
```

## Customization

1. Update `go.mod` module name
2. Modify handlers in `internal/handler/`
3. Add business logic in `internal/service/`
4. Implement persistence in `internal/repository/`
5. Update `api/openapi.yaml` for API documentation

## License

MIT
