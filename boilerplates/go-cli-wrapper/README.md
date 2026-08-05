# go-cli-wrapper

codex-run / agy-run など外部 AI CLI ラッパー共通パターンを同梱した Go CLI アプリケーションのテンプレート。

## 特徴

- **Standard CLI Features**: Cobra + `logscan` + `envx` + `testutil/fakebin`
- **Dependency Injection**: 環境変数や外部プロセスの動作をテスタブルに注入可能
- **fakebin Helper**: `testutil/fakebin` により外部コマンドのモック化を容易にテスト可能

## パッケージ構成

- `internal/envx`: 環境変数ヘルパー (`Or`, `IntOr`, `BoolOr` など `Env func(string) string` 注入可能)
- `testutil/fakebin`: fake 外部コマンド生成ヘルパー (tmp dir に実行可能シェルスクリプトを書き出し PATH に注入)

## 開発ガイド

### Makefile ターゲット

- `make build`: バイナリをビルド (`bin/mycli`)
- `make test`: テストを実行 (`go test ./...`)
- `make lint`: Linter を実行 (`golangci-lint run`)
- `make check`: `lint` + `test`
