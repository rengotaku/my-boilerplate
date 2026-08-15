# go-cli-wrapper

`go-cli` をベースに、外部 CLI をラップして実行する Go CLI アプリケーションのテンプレート（codex / agy などの AI CLI に限らず、任意の外部コマンドが対象）。codex-run / agy-run で個別に実装されていた次の 4 点を、汎用パッケージ群として抽出・同梱している。

- 外部コマンド実行 + timeout + プロセスグループ kill
- rate-limit/quota シグネチャ検出
- 候補を順に試すフォールバック
- fake コマンドでのテスト

## 特徴

- **Standard CLI Features**: Cobra + `envx`（環境変数ヘルパー）
- **外部コマンドラッパー一式**: `execx` + `logscan` + `fallback` を組み合わせて、rate-limit/timeout に強い外部コマンド実行を最小コードで書ける
- **Dependency Injection**: 環境変数（`envx.Env`）や外部プロセスの動作をテスタブルに注入可能
- **fakebin Helper**: `testutil/fakebin` により、実 CLI を叩かずに fake 実行可能スクリプトで外部コマンド呼び出しをテスト可能

## サンプルコマンド

`cmd/wrap.go` の `wrap` コマンドが、このテンプレートの主目的（execx + fallback + logscan の組み合わせ方）を示す最小例になっている。

```sh
mycli wrap --candidates primary-cli,backup-cli -- --version
```

`primary-cli` を実行し、失敗した場合は失敗内容が retryable（timeout、または出力に rate-limit/quota シグネチャを検出）と判定されたときだけ `backup-cli` へフォールバックする。retryable でない失敗（例: 引数エラー）は即座に打ち切る。実プロジェクトで実 CLI をラップする際は、この `wrap.go` をコピーして `execx.Options` の組み立てと候補リストの取得方法を差し替える想定。

## パッケージ構成

### `internal/envx` — 環境変数ヘルパー

`Env func(string) string` を注入できる `Or` / `IntOr` / `BoolOr`。`os.Getenv` に直接依存せず、テストでは fake の `Env` 関数を渡して環境変数の状態をテーブル駆動で網羅できる。

- 抽出元: codex-run `cmd/root.go` の `envOr` 系ヘルパー、agy-run `internal/config` の `envInt` / `envBool`
- 設計意図: 両リポジトリで独立に同じ「デフォルト値付き env 取得 + テスト時の注入」パターンが実装されていたため、DI 可能な形に一般化した

### `testutil/fakebin` — fake 外部コマンド生成ヘルパー

`t.TempDir()` に実行可能なシェルスクリプトを書き出し、`Create` はパスだけを返す。`CreateInPATH` はさらにそのディレクトリを `PATH` の先頭に注入し（`t.Setenv` でテスト終了時に自動復元）、コマンド名だけで呼び出せるようにする。

- 抽出元: codex-run の `writeFakeCodex`（実 `codex` CLI を叩かずに `os/exec` 経由の呼び出しをテストするためのヘルパー）
- 設計意図: 「fake の実行可能スクリプトを一時ディレクトリに書いて PATH に通す」というテスト手法をヘルパー化し、`execx` / `fallback` のテストで使い回せるようにした

### `internal/execx` — 外部コマンド実行

`Run(ctx, Options) (Result, error)` を提供する。`context` の timeout、プロセスグループ単位の kill（`Setpgid: true` + 負の PID への `SIGKILL`）、stdout/stderr を分離したキャプチャを備える。

- 抽出元: agy-run `internal/runner` の attempt 実行 + `killGroup`、codex-run `internal/runner` の `runAttempt`
- 設計意図: 外部 CLI のハング時、`context` の cancel だけでは子プロセスが生き残ることもある。外部 CLI がさらに孫プロセスを起動するケースで起きる。そこで `Setpgid` によりプロセスグループを分離する。cancel 時にグループごと `SIGKILL` すれば、ハングした外部 CLI とその子孫プロセスを確実に回収できる

### `internal/logscan` — rate-limit シグネチャ検出 + reset 時間パース

`Detect(text) bool` は `429` / `rate limit` / `quota` / `capacity` / `overloaded` / `resource_exhausted` 系のシグネチャを大小文字無視で検出する。`ParseResetWait(text) (time.Duration, bool)` は `"Resets in 2h 30m"` のような文言から待機時間を抽出する。

- 抽出元: agy-run `internal/ratelimit`、codex-run の `failPatterns`
- 設計意図: AI CLI（や外部 API をラップする CLI 全般）の rate-limit エラーは exit code だけで判別できない。stdout/stderr のテキストにしか手がかりが無いことも多い。そこで正規表現ベースのシグネチャ検出を独立パッケージへ切り出し、`fallback` の retryable 判定と個別に単体テストできるようにした

### `internal/fallback` — 候補を順に試すフォールバック連鎖

候補（モデル名やコマンド名）のリストを受け取り、`RunnerFunc` で1つずつ実行する。失敗が retryable（timeout または `logscan.Detect` が true）なら次の候補へ、そうでなければ即座に打ち切る。使用した候補と全試行の履歴を `Result` に含める。

- 抽出元: codex-run `Run()`、agy-run `execute()`
- 設計意図: 「rate-limit で落ちたら次のモデル/エンドポイントを試す」という制御フローは、両リポジトリで同型に実装されていた。ただし retryable 判定（`logscan`）と実行（`execx`）を直接埋め込んでいたため、テストが難しかった。3 者を分離したので、`fallback` のテストでは `execx.Run` の代わりに `RunnerFunc` の fake を渡すだけで済む

## やらないこと（意図的にスコープ外）

- codex / agy / gemini 固有のプロトコル（stdout JSON 契約・conversation-id・slot/flock による並列制御・watchdog）は持ち込まない。exec/timeout/fallback/logscan/envx/fakebin の 6 点に絞った汎用パッケージのみを提供する（詳細は ADR 0001 参照）

## 開発ガイド

### Makefile ターゲット

- `make build`: バイナリをビルド (`bin/mycli`)
- `make test`: テストを実行 (`go test ./...`)
- `make test-cov`: カバレッジ付きでテストを実行
- `make lint`: Linter を実行 (`golangci-lint run`)
- `make check`: `lint` + `test`
- `make ci`: `lint` + `test-cov`
