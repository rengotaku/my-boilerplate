# Go CLI Boilerplate

Batteries-included Go CLI ボイラープレート。スキャフォールド直後から
**設定ロード / 構造化ロギング / テスト** まで一通りそろっており、AI が機能実装に
そのまま入れる状態を目指している（#122 / #129）。

## Features

- **CLI Framework**: [Cobra](https://github.com/spf13/cobra)
- **Config**: [sethvargo/go-envconfig](https://github.com/sethvargo/go-envconfig)
- **Logger**: [`log/slog`](https://pkg.go.dev/log/slog)（標準ライブラリ）
- **Testing**: [stretchr/testify](https://github.com/stretchr/testify) + go test + coverage
- **Linter**: [golangci-lint](https://golangci-lint.run/) (v2 config)

## Prerequisites

- [Go](https://go.dev/dl/) 1.24+
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
./bin/mycli hello                    # Hello, World!
./bin/mycli hello Alice              # Hello, Alice!
./bin/mycli version                  # mycli version dev
./bin/mycli config                   # Print loaded config
./bin/mycli --help                   # Show help

# Logging is configured via env vars (slog)
LOG_LEVEL=debug ./bin/mycli hello    # text handler with DEBUG output
APP_ENV=production ./bin/mycli hello # JSON handler (structured logs)
```

## Environment Variables

| Variable    | Default       | 説明                                                 |
|-------------|---------------|------------------------------------------------------|
| `APP_ENV`   | `development` | `production` で slog の JSON ハンドラに切り替わる    |
| `LOG_LEVEL` | `info`        | `debug` / `info` / `warn` / `error` を受け付ける     |

## Project Structure

```
go-cli/
├── cmd/
│   ├── root.go            # Cobra root command (config + logger をロード)
│   └── root_test.go
├── internal/
│   ├── config/            # envconfig ベースの設定ローダー
│   ├── logger/            # slog ベースのロガー
│   └── greet/             # サンプル機能
├── main.go                # Entry point
├── go.mod                 # Module: mycli
├── Makefile
├── .golangci.yml          # golangci-lint v2 config
└── README.md
```

## Customization

1. Rename module in `go.mod`
2. Update `cmd/root.go` (command names, descriptions)
3. `internal/config.Config` に必要な環境変数フィールドを追加
4. Add your logic in `internal/`
5. Update `Makefile` binary name if needed

## License

MIT
