# Python LLM Pipeline Boilerplate

uv + Typer + ruff + mypy + pytest ベースの、LLM を叩くバッチ/パイプライン用ボイラープレート。
`python-cli` の土台（config / logger / Makefile / ruff / mypy）に、LLM バックエンドの
共通パターン（Protocol・例外階層・プロンプト組み立て）を追加している。

## Features

- **Package Manager**: [uv](https://docs.astral.sh/uv/) (10-100x faster than pip)
- **CLI**: [Typer](https://typer.tiangolo.com/)
- **Config**: [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) (env / `.env` 自動ロード)
- **Logging**: [structlog](https://www.structlog.org/) (console / JSON 切替）
- **LLM backend seam**: `mypipeline.llm.base.LlmClient` Protocol + 例外階層
  (`LlmError` / `TransientLlmError` / `RateLimitedError`) — パイプラインは
  Protocol にのみ依存し、テストは fake 実装を注入する（ネットワーク不要）
- **Subprocess backend**: `mypipeline.llm.subprocess_backend.SubprocessLlmClient`
  — 外部 CLI ラッパー。runner/sleep を注入可能、transient のみ線形バックオフ
  再試行・rate-limit は即 fail・大入力は `spill_argv` で組んだ argv を使い
  0600/0700 の一時ファイルへスピル（`spill_argv` 未設定で閾値超のプロンプトが
  来た場合は、パス文字列を暗黙にプロンプトへ差し替えず `LlmError` を送出する）
- **HTTP API backend**: `mypipeline.llm.api_backend.HttpApiLlmClient`
  （`llm-api` extra、httpx ベース） — コードフェンス除去 + dict 型検証つき
  JSON 応答パース
- **Prompt templates**: `mypipeline.prompts` — system/user 分離 + JSON skeleton 埋め込み
- **State store**: `mypipeline.state.IngestState` — SQLite（WAL）+
  `PRAGMA user_version` による idempotent マイグレーション、watermark
  (cursor) の set/get、`(source, stable_id)` dedup ledger、`_tx()` による
  commit/rollback
- **Permission hardening**: `mypipeline.permissions` — `ensure_private_dir`
  (0700) / `harden_file` (0600)。既存の緩い権限も矯正する
- **Redaction gate**: `mypipeline.redaction.RedactionGate` — LLM 送信前に
  API キー風トークン・Bearer トークンを `<REDACTED>` にマスク
- **Linter**: [ruff](https://docs.astral.sh/ruff/)
- **Type Checker**: [mypy](https://mypy-lang.org/) (strict mode)
- **Testing**: [pytest](https://pytest.org/) + coverage

## Prerequisites

- [uv](https://docs.astral.sh/uv/getting-started/installation/)

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
make install     # Install dependencies with uv
make run         # Run CLI
make lint        # Run ruff
make typecheck   # Run mypy
make format      # Format code
make test        # Run tests
make test-cov    # Run tests with coverage
make check       # Run lint + typecheck
make ci          # Run all checks (lint + typecheck + test-cov)
```

## Project Structure

```
python-llm-pipeline/
├── src/
│   └── mypipeline/
│       ├── __init__.py
│       ├── cli.py
│       ├── config.py
│       ├── logger.py
│       ├── prompts.py               # system/user 分離 + JSON skeleton
│       ├── state.py                 # SQLite watermark + dedup ledger
│       ├── permissions.py           # 0700/0600 パーミッションハードニング
│       ├── redaction.py             # LLM 送信前の機密マスキングゲート
│       └── llm/
│           ├── __init__.py
│           ├── base.py              # LlmClient Protocol + 例外階層
│           ├── subprocess_backend.py  # 外部 CLI ラッパー（retry / spill）
│           └── api_backend.py       # httpx ベース HTTP API backend
├── tests/
│   ├── test_cli.py
│   ├── test_config.py
│   ├── test_logger.py
│   ├── test_llm_base.py
│   ├── test_prompts.py
│   ├── test_subprocess_backend.py
│   ├── test_api_backend.py
│   ├── test_state.py
│   ├── test_permissions.py
│   └── test_redaction.py
├── Makefile
├── pyproject.toml
└── README.md
```

## Configuration

環境変数（`.env` も可）で挙動を切り替えられます。プレフィックスは `MYPIPELINE_`。

| 変数 | 既定値 | 値 |
|---|---|---|
| `MYPIPELINE_LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` / `CRITICAL` |
| `MYPIPELINE_LOG_FORMAT` | `console` | `console` / `json` |

```bash
MYPIPELINE_LOG_LEVEL=DEBUG MYPIPELINE_LOG_FORMAT=json uv run mypipeline hello World
```

## LLM backends

`make install`（`uv sync --all-extras`）で subprocess backend と HTTP API
backend（`llm-api` extra、httpx）の両方が入ります。API backend だけを個別に
入れる場合は `uv sync --extra llm-api`。両バックエンドとも `LlmClient`
Protocol に準拠しているため、パイプライン側は Protocol にのみ依存させ、
テストでは fake / mock を注入してください（実 CLI・実ネットワーク禁止）。

## パイプライン設計原則

LLM を叩くバッチ/パイプラインを組むときに崩れやすい前提を、明文化しておきます。

1. **統一コールへの畳み込み（1 アイテム 1 コール契約を崩さない）**
   複数アイテムを裏で分割・結合して LLM に投げると、失敗時にどのアイテムが
   欠けたか追えなくなります。`LlmClient.complete()` は「1 回の呼び出し =
   1 件分の応答」の契約を崩さず、バッチ化したいときは呼び出し元でループし、
   各回の成否を `mypipeline.state.IngestState` の dedup ledger に記録して
   ください。
2. **同一入力の重複送信禁止（dedup ledger を使う）**
   同じ `(source, stable_id)` を再送すると、LLM 呼び出しコストが重複するだ
   けでなく、レート制限も余計に消費します。送信前に
   `IngestState.is_seen(source, stable_id)` で確認し、送信後に
   `IngestState.record(source, stable_id)` で記録してください
   （`record()` は新規挿入時のみ `True` を返す idempotent な操作です）。
3. **入力縮約（送る前に絞る）**
   プロンプトは「送れるだけ送る」のではなく、必要な情報だけに絞ってから
   送ります。`SubprocessLlmClient` の `spill_threshold_bytes` は
   ARG_MAX 対策の安全弁であって、縮約の代わりではありません — 大きすぎる
   入力は縮約するか要約してから渡してください。閾値超のプロンプトをファイル
   経由で渡したい場合は、ラップする CLI が実際にファイル入力を解釈すること
   を確認したうえで `spill_argv=lambda path: [...]` を明示設定してください
   （未設定のまま閾値を超えると、パス文字列を暗黙にプロンプトとして送る
   silent 誤動作を避けるため `LlmError` になります）。送信直前には
   `mypipeline.redaction.RedactionGate` を通し、API キー・トークン等が
   混入していないことを確認します。
4. **limit・dry-run オプションでの試運転運用**
   新しいプロンプトやバックエンド設定を本番データ全件に対して初回から流
   さないでください。CLI コマンドには `--limit N`（処理件数の上限）と
   `--dry-run`（LLM を実際には呼ばず、対象件数や組み立てたプロンプトだけ
   を表示）を用意し、小さいサンプルで結果を確認してから本番実行に進める
   運用を前提にしてください。

## Customization

1. Rename `mypipeline` to your project name
2. Update `pyproject.toml` (name, description)
3. Update `Makefile` paths
4. Add your commands in `cli.py`

## License

MIT
