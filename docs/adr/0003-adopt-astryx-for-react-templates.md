---
adr: 0003
title: 使っていないテンプレートを削除し、画面のある React テンプレートは Astryx を前提にする
status: accepted
superseded_by: null
date: 2026-11-23
issues: [320, 323, 326, 327, 328, 329, 330, 331]
tags: [astryx, shared-react-ui, template-removal, react-spa, go-react-admin, static-lp]
description: #304 の利用実態の調査を受け、使っていない 9 つのテンプレートを削除した。画面のある 3 つのテンプレートは UI を Astryx に統一し、共有 UI と合成の仕組みをやめた。static-lp は軽さを優先して部品を直接持つ
---

# ADR 0003: 使っていないテンプレートを削除し、画面のある React テンプレートは Astryx を前提にする

## 背景

#304 の利用実態の調査で、使われていないテンプレートと、重い共有の仕組みが見つかった。リポジトリの持ち主から、次の指示があった。

> 使っていないボイラープレートを削除。ログイン機能とか使わない。grpc も使わない。graphql も
>
> `shared-react-ui` は不要で、Astryx を前提とした構成にして。画面があるものは

## 決定

- **決定 1: 使っていない 9 つのテンプレートを削除した。** 最初に `go-grpc-api`、`go-graphql-api`、`react-spa-graphql`、`go-rest-api` を削除した（#320）。次に `rust-cli`、`vite-ts`、`go-ssr-web`、`go-ssr-web-minimal`、`go-react-spa` を削除した（#323）。`go-react-spa` から展開される `go-react-spa-noauth` も対象にした。使用実績は、来歴行が残る repo のうち `go-react-spa` が 1 件で、ほかは 0 件だった。
- **決定 2: 画面のある 3 つのテンプレートを Astryx に切り替えた。** 対象は `react-spa`、`react-spa-cloudflare`、`go-react-admin`。画面を shadcn/ui + Tailwind から Astryx に変えた。使うのは `@astryxdesign/core`、`@astryxdesign/theme-neutral`、`@astryxdesign/cli` の 3 パッケージで、版は `0.7.12` に固定した。テーマは `neutral`、フォントはシステムフォントにした。あわせて `shared-react-ui` と、それを合成する仕組み（`.shared-ui.toml`、`shared_ui.sh`）を削除した。
- **決定 3: `static-lp` は Astryx にしない。** `shared-react-ui` をやめ、使う部品（`button`）を直接持つ。Astryx の CSS だけで約 300 KB あり、静的な LP には重すぎる。
- **決定 4: `go-react-admin` のグラフは `recharts` を残す。** Astryx にグラフの部品が無い。色は `useTheme` のトークンから取る。
- **決定 5: `react-spa` の `--no-auth` は既存の方式のままにする。** `scripts/scaffold/lib/noauth.sh` のヒアドキュメント方式を維持し、Astryx 版の画面を書き換える。ファイル内の目印（`@scaffold:remove-if`）方式にはしない。#327 の判断で、既存の仕組みを変えない最小変更を選んだ。

## 捨てた案

- shadcn/ui のまま `shared-react-ui` を残す
- `static-lp` も Astryx にする
- `go-react-admin` を後回しにする

## 変えてよい前提 / 壊すと危ない前提

- **変えてよい**: Astryx の版（`0.7.12`）、テーマ（`neutral`）、`static-lp` の部品の置き場所
- **壊すと危ない**:
  - Astryx は Beta で、版により挙動が変わる
  - 3 パッケージ（`core`、`theme-neutral`、`cli`）の版を揃える
  - `@stylexjs/stylex` はピア依存として入れる
  - CSS の読み込み順は、reset → 部品 → テーマ

## 既知の限界

- `react-spa-cloudflare` と `go-react-admin` の `--no-auth` は元から壊れている（#333）
- `react-spa` のログインとユーザー作成の e2e が無い（#322）
