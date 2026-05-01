# Spike: Next.js (App Router) + OpenNext on Cloudflare

親 Issue: [#121](https://github.com/rengotaku/my-boilerplate/issues/121)

## ゴール

`nextjs-cloudflare` テンプレートを追加するか否かを判断する材料を揃える。

## サブタスク

| # | 内容 | Issue |
|---|------|-------|
| A | 最小サンプル + ローカル動作確認 | [#158](https://github.com/rengotaku/my-boilerplate/issues/158) |
| B | OpenNext で Cloudflare Workers にデプロイ（無料プラン） | [#159](https://github.com/rengotaku/my-boilerplate/issues/159) |
| C | 既存テンプレ比較 + 採用判断 + コスト試算 | [#160](https://github.com/rengotaku/my-boilerplate/issues/160) |

## 成果物

- `findings.md` — 検証ログ（動作確認・制約・計測値）
- `decision.md` — 判断根拠と次アクション（C 完了時に確定）

## 実機サンプル

`tmp/nextjs-cloudflare-spike/` に `create-next-app` 出力を配置（gitignore 済み）。
