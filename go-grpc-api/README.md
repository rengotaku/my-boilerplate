# Go gRPC API Boilerplate

A minimal Go gRPC API boilerplate with clean architecture.

## Features

- gRPC server with reflection enabled
- Protocol Buffers with buf for schema management
- Input validation using protovalidate
- Clean architecture (repository/service/server layers)
- Structured logging with slog
- Configuration via environment variables
- Docker support
- GitHub Actions CI with 80%+ coverage requirement

## Project Structure

```
go-grpc-api/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── server/              # gRPC server implementation
│   ├── service/             # Business logic
│   └── repository/          # Data access layer
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

## Available Commands

```bash
make install     # Download dependencies
make generate    # Generate protobuf code
make build       # Build the binary
make run         # Run the server
make lint        # Run golangci-lint
make test        # Run tests
make test-cov    # Run tests with coverage
make check       # Run lint + test
make ci          # Run lint + test with coverage
make clean       # Remove build artifacts
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 50051 | gRPC server port |

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
| Logging | slog (standard library) |
| Configuration | envconfig |
| Testing | go test + testify |

## License

MIT
