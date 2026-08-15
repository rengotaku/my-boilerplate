---
adr: 0001
title: 直近リポジトリからのテンプレ抽出は「推奨度・高」のみ採用し static-lp / python-llm-pipeline を新設する
status: accepted
superseded_by: null
date: 2026-08-05
issues: [280, 281, 282]
tags: [template-extraction, static-lp, python-llm-pipeline, scaffold]
description: 直近 2 ヶ月のリポジトリ横断調査から再利用資産を抽出し、二重発明・作り込みが実証された 2 件のみ新テンプレ化。他候補は再評価条件付きでバックログ化した
---

# ADR 0001: 直近リポジトリからのテンプレ抽出は「推奨度・高」のみ採用し static-lp / python-llm-pipeline を新設する

## 背景

「最近作ったリポジトリから再利用できそうなものを抽出して追加」（#280）を受けて横断調査した。対象は直近 2 ヶ月に作成された次のリポジトリ等で、5 グループに分けた。

- staiclabs-site / strcount / knowledge-fabric / ai-podcast / mcp-grok-cdp
- codex-run / agy-run / nano-banana-studio / smart-object-select

テンプレ化候補は 5 件挙がった。ただし全部を取り込むとテンプレ集が肥大化し、保守コストが増える。

## 決定

- **採用基準は「複数リポジトリでの再発が実証されている」こと**。調査で推奨度・高と評価された 2 件のみ新テンプレとして追加した:
  - `static-lp`（#281 / PR #288）: react-spa-cloudflare をベースに、staiclabs-site で磨いた SSR プリレンダリング・SEO 資産・リンク整合テスト・カバレッジ絞り込みを移植。既存 react-spa-cloudflare への差分追加ではなく**別テンプレとして分離**（テスト戦略とビルドパイプラインが既存前提と衝突するため）
  - `python-llm-pipeline`（#282 / PR #287, #289）: python-cli をベースに、knowledge-fabric と ai-podcast が**独立に二重発明していた**資産を統合。対象は LLM backend Protocol・リトライ・SQLite 状態ストア・パーミッションハードニング・redaction
- 見送り 3 件は**再評価条件を明記したバックログ issue** として残す:
  - mcp-server（#283）
  - go-cli-wrapper（#284、3 例目の出現で再評価）
  - react-spa 追加資産（#285、3 例目の画像系 SPA で再評価）
- scaffold の名前置換は python-llm-pipeline で **env prefix（`MYPIPELINE_` → `<NAME>_`）も対象**に含める（python.sh。python-cli 本体は現状維持）

## 捨てた案

- **5 候補すべてをテンプレ化**:
  - mcp-server は元リポに CI/Makefile/lint が無く「移植」でなく「新規設計」になる
  - go-cli-wrapper は実例 2 件で時期尚早（codex-run の ADR 0003 自身が「規模になったら」と条件付き）
  - 1 リポでしか使われていない資産（ImageDropZone 等）は「毎回追加している」の実証がない
- **static-lp を react-spa-cloudflare への差分（オプション）として吸収**: カバレッジ対象の絞り込み（config/lib/hooks のみ）が既存テンプレの「src/** 全体 80%」前提と真逆になる。フラグ分岐は両テンプレを複雑化する
- **python-llm-pipeline の全依存をコアに含める**: httpx は extras `llm-api` に分離した。コア（subprocess backend / state / permissions / redaction）は標準ライブラリ + 最小依存で成立させた

## 変えてよい前提 / 壊すと危ない前提

- **変えてよい**:
  - バックログ 3 件の再評価タイミング（3 例目の出現）
  - static-lp の CSP ベースライン・OGP プレースホルダ文言
  - python-llm-pipeline のリトライ既定値（max_attempts=3、backoff、スピル閾値 60KB）
- **壊すと危ない**:
  - python-llm-pipeline の**例外階層契約**（429=RateLimitedError / timeout・接続障害・空応答=TransientLlmError / その他=LlmError）。呼び出し側の fail-fast / リトライ方針がこの分類に依存する
  - subprocess backend の**スピル明示契約**（`spill_argv` 未設定 + 閾値超は LlmError。暗黙のパス置換に戻すと、ファイル入力を解釈しない CLI へパス文字列を送ってしまい、silent 誤動作が再発する）
  - `IngestState.open()` が**既存親ディレクトリの権限を変更しない**こと（相対パスで cwd を 0700 に chmod する事故の再発防止）
  - static-lp の **prerender と hydration の整合**（main.tsx の hydrateRoot 分岐・404.html 生成・preview のディレクトリインデックス解決）。どれかを外すと hydration mismatch / クローラー誤配信が再発する
  - テンプレ内の import は**括弧 + trailing comma 形式**を維持する。scaffold 名の長さで ruff E501/I001 が発火した実障害 #289 の再発防止であり、テンプレ名で収まっていても長い scaffold 名で壊れる
