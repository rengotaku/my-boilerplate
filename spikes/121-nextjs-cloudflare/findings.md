# Findings — Next.js + OpenNext on Cloudflare

検証ログ。サブタスク A → B の順に追記する。

---

## A. 最小サンプル + ローカル動作確認 (#158)

### 環境

| 項目 | バージョン |
|------|-----------|
| Node.js | v25.2.1 |
| npm | 11.6.2 |
| Next.js | 16.2.4 |
| React / React DOM | 19.2.4 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |
| ESLint | ^9 |

作成コマンド:

```bash
npx create-next-app@latest tmp/nextjs-cloudflare-spike \
  --ts --app --tailwind --eslint --src-dir \
  --import-alias "@/*" --use-npm --no-turbopack --skip-install
```

確認日: 2026-05-01

実機サンプル: `tmp/nextjs-cloudflare-spike/`（gitignore 済み、再現は上記コマンド）

### 追加した最小サンプル

| ファイル | 種別 | 目的 |
|---------|------|------|
| `src/app/api/hello/route.ts` | Route Handler | GET で JSON を返す |
| `src/app/actions/page.tsx` | Server Component | RSC で時刻をレンダ |
| `src/app/actions/greet.ts` | Server Action (`"use server"`) | フォーム入力を受けて文字列を返す |
| `src/app/actions/GreetForm.tsx` | Client Component (`"use client"`) | Server Action を呼び出すフォーム |

### 動作確認結果

`npm run dev` (port 3030) で起動し、curl で確認。

| 機能 | 結果 | 確認方法 |
|------|------|---------|
| Server Components (RSC) | ✅ | `/actions` レスポンスに RSC レンダリング時刻 `2026-05-01T04:01:49.673Z` が埋め込まれている |
| Server Actions | ✅ | POST `/actions` が 200 を返し、新しいタイムスタンプ (`04:02:05.176Z`) で再レンダ |
| Route Handlers | ✅ | `GET /api/hello` → `{"message":"hello from route handler","runtime":"nodejs",...}` |
| `"use client"` 境界 | ✅ | `GreetForm.tsx` が独立した client chunk（`src_app_actions_GreetForm_tsx_*`）として分離 |
| Turbopack dev | ✅ | `Ready in 142ms`、`Next.js 16.2.4 (Turbopack)` 表示 |

### `"use client"` 境界の整理メモ

- **デフォルトは Server Component**。`page.tsx`/`layout.tsx` ともに `async function` で書け、`fetch` も DB アクセスもサーバ側で完結。
- **Client Component が必要なケース**: フック (`useState`/`useTransition` 等)、ブラウザ API、イベントハンドラ。`GreetForm.tsx` は `useState` + `useTransition` を使うため `"use client"` が必須。
- **Server Action のインポート方向**: Client Component からは Server Action (`"use server"` 関数) を `import` 可能。逆向き (Server から Client にロジックを渡す) は不可、Client Component を **JSX 子要素として埋め込む** 形でしか連携できない。
- **境界の引き方**: ページ全体を Client にせず、インタラクティブな部分だけ Client Component に切り出す（今回の `actions/page.tsx` + `GreetForm.tsx` パターン）。これで RSC のメリット（ハイドレーション軽量化）を維持できる。

### 詰まりポイント / 注意点

- `--no-turbopack` を指定しても dev server は Turbopack で起動した（Next.js 16 系では Turbopack がデフォルト）。Cloudflare 向け `opennextjs-cloudflare build` がどのバンドラを要求するかは B (#159) で要確認。
- `npm install` 後に `2 moderate severity vulnerabilities` の警告。スパイクなので無視するが、本実装時は再確認。
- `process.env.NEXT_RUNTIME` は Node.js ランタイム時に `nodejs` を返した。Workers (edge) では `edge` になるはずで、B でランタイム互換フラグ `nodejs_compat` を設定したときの値変化を観察対象とする。

### B への引き継ぎ事項

- Next.js **16.2.4** で `@opennextjs/cloudflare` の対応バージョン range を確認（最新版が 16.x をサポートしているか）
- Turbopack ビルドと OpenNext のビルドパイプラインの相性
- `nodejs_compat` フラグで `process.env.NEXT_RUNTIME` がどう変わるか
- Tailwind v4 + PostCSS パイプラインが Workers ビルドを通るか

---

## B. OpenNext で Cloudflare Workers にデプロイ (#159)

未着手。
