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
./bin/mycli note "Buy milk" --tags home,errand --priority 3
./bin/mycli note -- "--dry-run needs documenting"  # leading-dash title via --
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

## Cobra Conventions

cobra コマンドを追加するときの規約。`cmd/note.go` がこの規約に沿った推奨スケルトン（自由文の位置引数 + 本物のフラグ + `--help`/`--` がそのまま効く）。

- **`DisableFlagParsing: true` は具体的な理由がない限り使わない。** これを付けると cobra/pflag 標準の `--help`/`-h` 処理と `--`（引数終端）サポートを**同時に捨てる**。その結果、各コマンドが pflag の劣化版を手書きする羽目になる。典型的な事故: `mycli add --help` が usage を出さず `--help` をタイトルとして書き込む。やむを得ず使う場合は理由を `// DisableFlagParsing:` コメントで明記する。
- **オプションは pflag の本物のフラグとして定義する**（`cmd.Flags().StringVar(...)` 等）。手書きパーサで再実装しない。typo は `unknown flag` で弾かれる。
- **`-` 始まりになりうる自由文は `--`（引数終端）の後ろに渡す。** pflag が flag 扱いするのはトークン先頭が `-` のときだけなので、`--` が標準・ゼロコストの手段。help / flag / `--` の解釈は cobra に任せる。

### 自由文を渡すラッパー規約

シェル関数等でコマンドをラップする場合、末尾の自由文引数の前に `--` を自動挿入すると「flag/help は cobra」「自由文は常に安全」を両立できる:

```bash
mycli-note() {
  # 末尾の自由文（タイトル）は必ず `--` の後ろへ
  command mycli note "${@:1:$#-1}" -- "${@: -1}"
}
```

回帰防止として `cmd/note_test.go` に `note --help` が exit 0 で usage を返すスモークテスト、`--` 経由の `-` 始まりタイトル、未知フラグ reject のテストを同梱している。

## Project Structure

```
go-cli/
├── cmd/
│   ├── root.go            # Cobra root command (config + logger をロード)
│   ├── root_test.go
│   ├── note.go            # 推奨スケルトン + cobra 規約（DisableFlagParsing を使わない）
│   └── note_test.go       # --help / -- / unknown-flag のスモークテスト
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
