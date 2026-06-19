# Rust CLI Boilerplate

Rust + clap + config + tracing — batteries included な Rust CLI ボイラープレート。

## Features

- **CLI Framework**: [clap](https://github.com/clap-rs/clap) (derive)
- **Error Handling**: [anyhow](https://github.com/dtolnay/anyhow)
- **Configuration**: [config](https://github.com/rust-cli/config-rs) (TOML) + [dotenvy](https://github.com/allan2/dotenvy) (`.env`)
- **Logging**: [tracing](https://github.com/tokio-rs/tracing) + [tracing-subscriber](https://docs.rs/tracing-subscriber/) (`RUST_LOG` 対応)
- **Linter**: [clippy](https://github.com/rust-lang/rust-clippy)
- **Formatter**: [rustfmt](https://github.com/rust-lang/rustfmt)
- **Testing**: cargo test + [assert_cmd](https://github.com/assert-rs/assert_cmd)

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) 1.85+
- [cargo-tarpaulin](https://github.com/xd009642/tarpaulin) (optional, for coverage)

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
make install     # Build in debug mode
make build       # Build release binary
make run         # Run CLI
make lint        # Run clippy + fmt check
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
./target/release/mycli hello          # Output: Hello, World!
./target/release/mycli hello Alice    # Output: Hello, Alice!
./target/release/mycli --version      # Output: mycli 0.1.0
./target/release/mycli --help         # Show help
```

## Configuration

設定値は次の優先順で解決される（後ろが優先）。

1. `config/default.toml`（デフォルト値）
2. `.env`（dotenvy で読み込み — `.env.example` を参照）
3. プロセス環境変数（`APP__<KEY>` プレフィックス、区切りは `__`）

| Key | Env | Default | 説明 |
|---|---|---|---|
| `greeting` | `APP__GREETING` | `Hello` | あいさつの prefix |
| `log_level` | `APP__LOG_LEVEL` | `info` | デフォルトのログレベル |

ログレベルは `RUST_LOG` 環境変数で上書きできる（`tracing-subscriber` の `EnvFilter`）。

```bash
RUST_LOG=debug make run ARGS="hello"
APP__GREETING=Bonjour make run ARGS="hello Marie"   # → Bonjour, Marie!
```

## Project Structure

```
rust-cli/
├── src/
│   ├── main.rs           # Entry point
│   ├── cli.rs            # CLI definition (clap)
│   ├── lib.rs            # Library exports
│   ├── greet.rs          # Sample functionality
│   ├── logging.rs        # tracing-subscriber init
│   └── settings.rs       # config + dotenvy loader
├── config/
│   └── default.toml      # Default configuration values
├── tests/
│   └── integration_test.rs  # Integration tests
├── .env.example          # Sample dotenv overrides
├── Cargo.toml            # Package manifest
├── Makefile
├── rustfmt.toml          # Formatter config
├── clippy.toml           # Linter config
└── README.md
```

## Customization

1. Update `Cargo.toml` (name, version, description)
2. Modify `src/cli.rs` (commands, arguments)
3. Add your logic in `src/`
4. Update tests accordingly

## License

MIT
