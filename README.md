# my-boilerplate

Collection of project boilerplates.

## Principles

1. **Minimal**: 必要最低限のファイルのみ。過剰な設定は追加しない
2. **Modern**: 各言語の最新ツール・ベストプラクティスを採用
3. **CI-first**: GitHub Actionsで品質チェック。ローカルフック不要
4. **Test-ready**: テスト環境セットアップ済み。80%カバレッジ目標
5. **SQLite-first** (Web): 開発・テスト環境はSQLiteを使用。本番DBへの移行は利用者判断

## Standard Structure

```
<boilerplate>/
├── Makefile          # install, lint, test, clean
├── .github/
│   └── workflows/    # CI設定
├── README.md         # セットアップ手順
├── src/ or cmd/      # ソースコード
└── tests/            # テストコード
```

## Naming Convention

```
{language}-{type}
```

| Type | Description |
|------|-------------|
| cli | コマンドラインツール |
| rest-api | REST API |
| graphql-api | GraphQL API |
| grpc-api | gRPC API |
| web | Web API / Webアプリ |

## Quality Gates (CI)

| Check | Python | Go | Rust |
|-------|--------|-----|------|
| Linting | ruff | golangci-lint | clippy |
| Type checking | mypy | Go標準 | Rust標準 |
| Formatting | ruff format | gofmt | rustfmt |
| Tests + Coverage | pytest --cov (80%+) | go test -cover (80%+) | cargo test (80%+) |

## Available Boilerplates

| Name | Description |
|------|-------------|
| [python-cli](./python-cli) | Python CLI with uv, Typer, ruff, mypy, pytest |
| [go-cli](./go-cli) | Go CLI with Cobra, golangci-lint, go test |
| [rust-cli](./rust-cli) | Rust CLI with clap, clippy, rustfmt, cargo test |
| [go-rest-api](./go-rest-api) | Go REST API with Chi, ozzo-validation, OpenAPI |
| [go-graphql-api](./go-graphql-api) | Go GraphQL API with gqlgen, GraphQL Playground |
| [go-grpc-api](./go-grpc-api) | Go gRPC API with grpc-go, buf, protovalidate |
| [go-ssr-web](./go-ssr-web) | Go SSR Web with Chi, html/template |

## Roadmap

| Priority | Template | Status |
|----------|----------|--------|
| - | python-cli | Done |
| - | go-cli | Done |
| - | rust-cli | Done |
| Next | python-web | Planned |
| Future | go-web | Planned |

## Dev Server Management

```bash
# Check all servers
make status

# Stop all servers
make stop-all
```

### Port Convention

| Project | Port | Usage |
|---------|------|-------|
| go-rest-api | 8080 | REST API |
| go-graphql-api | 8081 | GraphQL API |
| go-grpc-api | 50051 | gRPC |
| go-ssr-web | 8082 | SSR Web |
| react-spa | 5173 | Vite dev |

### New Project Checklist

When adding a new server project:
- [ ] Add `PORT`, `stop`, `status` targets to Makefile
- [ ] Add to `SERVERS` in root Makefile
- [ ] Update port convention table above

## Usage

```bash
# Clone specific boilerplate
cp -r python-cli ~/projects/my-new-project
cd ~/projects/my-new-project
make install
```

## License

MIT
