import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AppRouter } from "@/router";

/**
 * ビルド時プリレンダリング (SSG) 用のサーバーエントリ。
 *
 * `scripts/prerender.mjs` からのみ import される。`src/App.tsx`（クライアント用の
 * `BrowserRouter`）は変更せず、こちらは `StaticRouter` で `AppRouter` を直接包む。
 *
 * `AppRouter`（src/router.tsx）と配下のコンポーネントツリーは window / document /
 * localStorage に依存しないこと（依存すると SSR 実行時にクラッシュする）。新しい
 * ページ・コンポーネントを追加する際はこの制約を維持すること。
 *
 * このファイルは `render` のみを export する（react-refresh/only-export-components の
 * 制約に合わせる。`KNOWN_PATHS` は `scripts/prerender.mjs` 側で `src/routes.ts` を
 * 直接 `vite.ssrLoadModule` して取得する。src/routes.ts のコメント参照）。
 */
export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <AppRouter />
    </StaticRouter>
  );
}
