import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

/**
 * `vite preview` は appType "spa" の既定動作により、拡張子なしパス（例: `/privacy`）への
 * リクエストを一律 `dist/index.html`（SPA フォールバック）で返す。本テンプレートは
 * `scripts/prerender.mjs` でルートごとに `dist/<path>/index.html` を個別生成しているため、
 * フォールバックが先に効くと `/privacy` で home 用のプリレンダ済み HTML が返ってしまい、
 * クライアント（実際の URL に基づき PrivacyPage を描画する）との間で構造が食い違い、
 * hydration mismatch（React error #418）が発生する（Cloudflare Pages 等、ディレクトリ
 * インデックス解決を行う静的ホストでは発生しない。あくまで `vite preview` による
 * ローカル検証時の配信経路の差）。
 *
 * `configurePreviewServer` フックはビルトインの静的アセット配信・SPA フォールバックより
 * 前に登録されるため、ここで `dist/<path>/index.html` が実在すればそれを優先して返す。
 */
function prerenderedRoutesPreviewPlugin(): Plugin {
  return {
    name: "static-lp-prerendered-routes-preview",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (!url || url === "/" || path.extname(url)) {
          next();
          return;
        }
        const candidate = path.join(__dirname, "dist", url, "index.html");
        if (fs.existsSync(candidate)) {
          res.setHeader("Content-Type", "text/html");
          res.end(fs.readFileSync(candidate));
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), prerenderedRoutesPreviewPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
