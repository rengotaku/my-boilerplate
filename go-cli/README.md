# Go CLI Boilerplate

Go + Cobra + golangci-lint の Go CLI ボイラープレート。

## Features

- **CLI Framework**: [Cobra](https://github.com/spf13/cobra)
- **Linter**: [golangci-lint](https://golangci-lint.run/) (v2 config)
- **Testing**: go test + coverage

## Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [golangci-lint](https://golangci-lint.run/welcome/install/)

## Quick Start

```bash
# Install dependencies
make install

# Run CLI
make run ARGS="hello World"

# Run tests
make test
```

## Commands

```bash
make help        # Show all commands
make install     # Download dependencies
make build       # Build the binary
make run         # Run CLI
make lint        # Run golangci-lint
make test        # Run tests
make test-cov    # Run tests with coverage
make check       # Run lint + test
make ci          # Run lint + test-cov
make clean       # Remove build artifacts
```

## CLI Usage

```bash
# Build the CLI
make build

# Run commands
./bin/mycli hello          # Output: Hello, World!
./bin/mycli hello Alice    # Output: Hello, Alice!
./bin/mycli version        # Output: mycli version dev
./bin/mycli --help         # Show help
```

## Project Structure

```
go-cli/
├── cmd/
│   └── root.go           # Cobra root command and subcommands
├── internal/
│   └── greet/
│       ├── greet.go      # Sample functionality
│       └── greet_test.go # Tests
├── main.go               # Entry point
├── go.mod                # Module: mycli
├── Makefile
├── .golangci.yml         # golangci-lint v2 config
└── README.md
```

## Customization

1. Rename module in `go.mod`
2. Update `cmd/root.go` (command names, descriptions)
3. Add your logic in `internal/`
4. Update `Makefile` binary name if needed

## License

MIT
