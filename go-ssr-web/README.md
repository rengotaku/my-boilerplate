# Go SSR Web Boilerplate

A minimal Go server-side rendering web application boilerplate.

## Features

- Server-side HTML rendering with html/template
- Chi router with middleware (logging, recovery)
- Clean architecture (repository/service/handler layers)
- Embedded templates and static files
- Structured logging with slog
- Configuration via environment variables
- Docker support
- GitHub Actions CI with 80%+ coverage requirement

## Project Structure

```
go-ssr-web/
├── cmd/
│   └── server/
│       └── main.go           # Application entry point
├── internal/
│   ├── handler/              # HTTP handlers
│   ├── service/              # Business logic
│   └── repository/           # Data access layer
├── web/
│   ├── templates/            # HTML templates
│   │   ├── base.html
│   │   ├── index.html
│   │   └── users/
│   └── static/
│       └── css/
├── go.mod
├── Makefile
├── .golangci.yml
├── Dockerfile
└── README.md
```

## Prerequisites

- Go 1.21+
- [golangci-lint](https://golangci-lint.run/welcome/install/) (for linting)

## Quick Start

```bash
# Install dependencies
make install

# Run the server
make run

# Open http://localhost:8080
```

## Available Commands

```bash
make install     # Download dependencies
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
| PORT | 8080 | HTTP server port |
| SHUTDOWN_TIMEOUT | 10s | Graceful shutdown timeout |

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Home page |
| GET | /users | List users |
| GET | /users/new | New user form |
| POST | /users | Create user |
| GET | /users/{id} | Show user |
| GET | /users/{id}/edit | Edit user form |
| POST | /users/{id} | Update user |
| POST | /users/{id}/delete | Delete user |
| GET | /static/* | Static files |

## Docker

```bash
# Build image
docker build -t go-ssr-web .

# Run container
docker run -p 8080:8080 go-ssr-web
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Router | Chi |
| Templates | html/template (standard library) |
| Logging | slog (standard library) |
| Configuration | envconfig |
| Testing | go test + testify |

## License

MIT
