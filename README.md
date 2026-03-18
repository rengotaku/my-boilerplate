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
| web | Web API / Webアプリ |

## Quality Gates (CI)

| Check | Python | Go |
|-------|--------|-----|
| Linting | ruff | golangci-lint |
| Type checking | mypy | Go標準 |
| Tests + Coverage | pytest --cov (80%+) | go test -cover (80%+) |

## Available Boilerplates

| Name | Description |
|------|-------------|
| [python-cli](./python-cli) | Python CLI with uv, Typer, ruff, mypy, pytest |
| [go-cli](./go-cli) | Go CLI with Cobra, golangci-lint, go test |

## Roadmap

| Priority | Template | Status |
|----------|----------|--------|
| - | python-cli | Done |
| - | go-cli | Done |
| Next | python-web | Planned |
| Future | go-web | Planned |

## Usage

```bash
# Clone specific boilerplate
cp -r python-cli ~/projects/my-new-project
cd ~/projects/my-new-project
make install
```

## License

MIT
