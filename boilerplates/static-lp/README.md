# static-lp

SEO 向けにビルド時プリレンダリング（SSG）する、Cloudflare Pages デプロイ向けの静的
LP（ランディングページ）テンプレート。

## このテンプレートの性格

**表示専用の静的サイト**を想定したテンプレートである。分岐やサーバー状態を持たない、
ビルド時にプリレンダリングした静的 HTML を配信する用途（コーポレートサイト・サービス
LP・お知らせページ等）に向いている。ログイン・DB・API 連携など動的な機能が必要な場合は
`react-spa-cloudflare` テンプレートを検討すること。

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite |
| Language | TypeScript |
| Routing | React Router |
| UI | Tailwind CSS v4 + shadcn/ui |
| UI State | Zustand |
| Prerendering | ビルド時 SSG（`react-dom/server` + カスタムスクリプト） |
| Linter | ESLint |
| Formatter | Prettier |
| Testing | Vitest + Testing Library |
| Logging | consola |
| Deployment | Cloudflare Pages |

## Project Structure

```
src/
├── components/       # UI コンポーネント（Layout など）
├── config/           # 外部リンク等の設定（links.ts）
├── hooks/            # カスタムフック（useUIStore, useInView, usePrefersReducedMotion）
├── lib/              # ユーティリティ（logger, cn）
├── pages/            # ページコンポーネント（Home, Privacy, 404）
├── test/             # テストユーティリティ・モック
├── entry-server.tsx  # SSR プリレンダリング用サーバーエントリ
├── router.tsx        # React Router 設定
├── routes.ts         # プリレンダ対象パス一覧（KNOWN_PATHS）
├── App.tsx           # クライアント用エントリ（BrowserRouter）
└── main.tsx          # React エントリポイント

scripts/
├── prerender.mjs         # ビルド時プリレンダリングスクリプト
└── verify-prerender.mjs  # プリレンダ結果の検証スクリプト（ビルドゲート）

public/
├── _headers      # Cloudflare セキュリティヘッダ（CSP 含む）
├── _routes.json  # SPA ルーティング設定
├── robots.txt    # クローラ向け設定
└── sitemap.xml   # サイトマップ雛形

docs/
├── deploy.md            # Cloudflare Pages デプロイ手順
├── seo-verification.md  # SEO・検索エンジンインデックス確認手順
└── visual-check.md      # Playwright を使ったビジュアルチェック手順
```

## プリレンダリング（SSG）パイプライン

`npm run build` は以下を順に実行する単一コマンドに統合されている:

1. `tsc -b` — 型チェック
2. `vite build`（`build:client`） — クライアント向けビルド（`dist/`）
3. `vite build --ssr src/entry-server.tsx`（`build:ssr`） — Node 実行可能な SSR
   バンドル（`dist-ssr/`）
4. `node scripts/prerender.mjs`（`prerender`） — `src/routes.ts` の `KNOWN_PATHS` を
   走査し、各パスの HTML を `dist/**/index.html` として書き出す
5. `dist-ssr/` の削除（`clean:ssr`） — SSR バンドルは配信に不要なため
6. `node scripts/verify-prerender.mjs`（`verify:prerender`） — 生成された HTML に
   期待テキストが含まれること・エラー痕跡が無いことを検証する（失敗時はビルド全体を
   失敗させる）

新しいページを追加する場合は `src/router.tsx` の Route 定義と `src/routes.ts` の
`KNOWN_PATHS` の両方に追記すること（`src/routes.ts` のコメント参照）。
`scripts/verify-prerender.mjs` の期待テキストも見出し文言の変更に合わせて更新すること。

## Getting Started

```bash
# 依存関係のインストール
make install

# 開発サーバー起動
make run

# テスト実行
make test

# 本番ビルド（プリレンダ・検証込み）
make build
```

## デプロイ

1. [`docs/deploy.md`](./docs/deploy.md) — Cloudflare Pages への初回セットアップ手順
2. [`docs/seo-verification.md`](./docs/seo-verification.md) — デプロイ後の SEO・
   インデックス確認手順
3. [`docs/visual-check.md`](./docs/visual-check.md) — レイアウト崩れ等の目視確認手順
   （Playwright スクリーンショット）

```bash
make deploy          # 本番デプロイ
make deploy-preview  # プレビューデプロイ
```

## SSR/sitemap が不要な場合の削除手順

本テンプレートは SEO のためのビルド時プリレンダリング（SSG）を前提にしているが、
社内ツール・単一ページのユーティリティなど SEO を必要としない用途で使う場合は、
以下を削除して通常の CSR（Client-Side Rendering）の SPA として運用できる。

1. `src/entry-server.tsx` / `scripts/prerender.mjs` / `scripts/verify-prerender.mjs` /
   `src/routes.ts` を削除する
2. `package.json` の `scripts.build` を `"tsc -b && vite build"` に戻し、
   `build:client` / `build:ssr` / `prerender` / `clean:ssr` / `verify:prerender` の
   各 script エントリを削除する
3. `public/sitemap.xml` / `public/robots.txt` を削除する（検索エンジンにインデックス
   させる必要がない場合）
4. `index.html` の OGP / Twitter Card の meta タグは、SNS 上での見え方を気にしないなら
   削除してよい（`title` / `description` は残すことを推奨）
5. `docs/seo-verification.md` を削除する（`docs/deploy.md` / `docs/visual-check.md` は
   プリレンダの有無に関わらず有効）

これにより最小構成の `react-spa-cloudflare` 相当の SPA として運用できる。

## Make Targets

| Target | Description |
|--------|-------------|
| `make install` | 依存関係のインストール（shared-react-ui の合成を含む） |
| `make run` | 開発サーバー起動 |
| `make build` | 本番ビルド（プリレンダ・検証込み） |
| `make preview` | 本番ビルドのプレビュー |
| `make test` | テスト実行 |
| `make test-cov` | カバレッジ付きテスト実行 |
| `make lint` | ESLint 実行 |
| `make format` | Prettier フォーマット |
| `make ci` | lint + format-check + test-cov + build |
| `make deploy` | Cloudflare Pages へ本番デプロイ |
| `make deploy-preview` | Cloudflare Pages へプレビューデプロイ |
| `make clean` | ビルド成果物の削除 |

## Cloudflare Pages Configuration

- `wrangler.toml` — Wrangler 設定（Pages プロジェクト名等）
- `public/_routes.json` — SPA ルーティング（プリレンダ済み HTML を優先させる設定）
- `public/_headers` — セキュリティヘッダ（CSP 含む）

## Features

- React 19 + TypeScript
- ビルド時プリレンダリング（SSG）による SEO 対応
- Tailwind CSS v4 + shadcn/ui
- リンク切れ検知の統合テスト（`src/App.test.tsx`）
- Cloudflare Pages エッジ配信向けに最適化
- セキュリティヘッダ（CSP 含む）を事前設定済み
