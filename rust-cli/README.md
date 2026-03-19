# Rust CLI Boilerplate

Rust + clap + clippy の Rust CLI ボイラープレート。

## Features

- **CLI Framework**: [clap](https://github.com/clap-rs/clap) (derive)
- **Error Handling**: [anyhow](https://github.com/dtolnay/anyhow)
- **Linter**: [clippy](https://github.com/rust-lang/rust-clippy)
- **Formatter**: [rustfmt](https://github.com/rust-lang/rustfmt)
- **Testing**: cargo test + [assert_cmd](https://github.com/assert-rs/assert_cmd)

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) 1.80+
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

## Project Structure

```
rust-cli/
├── src/
│   ├── main.rs           # Entry point
│   ├── cli.rs            # CLI definition (clap)
│   ├── lib.rs            # Library exports
│   └── greet.rs          # Sample functionality
├── tests/
│   └── integration_test.rs  # Integration tests
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
