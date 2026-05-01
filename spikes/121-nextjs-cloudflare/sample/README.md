# sample/ — レビュー用ソース

`tmp/nextjs-cloudflare-spike/` に scaffold した実機サンプルのうち、**spike A で追加した検証用ソースだけ** を抜き出して配置している（gitignore された `tmp/` は PR から見えないため）。

## 再現手順

1. `tmp/` に scaffold:
   ```bash
   npx create-next-app@latest tmp/nextjs-cloudflare-spike \
     --ts --app --tailwind --eslint --src-dir \
     --import-alias "@/*" --use-npm --no-turbopack --skip-install
   ```
2. このディレクトリ配下のソースをコピー:
   ```bash
   cp -R spikes/121-nextjs-cloudflare/sample/src/app/* tmp/nextjs-cloudflare-spike/src/app/
   ```
3. 起動:
   ```bash
   cd tmp/nextjs-cloudflare-spike && npm install && PORT=3030 npm run dev
   ```

## ファイル一覧

| パス | 種別 | 確認項目 |
|------|------|---------|
| `src/app/api/hello/route.ts` | Route Handler | `GET /api/hello` で JSON |
| `src/app/actions/page.tsx` | Server Component | RSC でタイムスタンプをサーバレンダ |
| `src/app/actions/greet.ts` | Server Action (`"use server"`) | フォーム入力を受けて文字列を返す |
| `src/app/actions/GreetForm.tsx` | Client Component (`"use client"`) | Server Action を呼び出すフォーム |
| `package.json` | (参考) | scaffold 直後の依存バージョン記録 |
