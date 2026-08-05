import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

/**
 * `vite preview` は appType "spa" の既定動作により、拡張子なしパス（例: `/privacy`）への
 * リクエストを一律 `dist/index.html`（SPA フォールバック）で返す。本テンプレートは
 * `scripts/prerender.mjs` でルートごとに `dist/<path>/index.html` を、未知パス向けに
 * `dist/404.html` を個別生成しているため、フォールバックが先に効くと常に home 用の
 * プリレンダ済み HTML が返ってしまい、クライアント（実際の URL に基づき対応するページを
 * 描画する）との間で構造が食い違い、hydration mismatch（React error #418）が発生する
 * （Cloudflare Pages 等、ディレクトリインデックス解決・404.html 規約を持つ静的ホストでは
 * 発生しない。あくまで `vite preview` によるローカル検証時の配信経路の差）。
 *
 * `configurePreviewServer` フックはビルトインの静的アセット配信・SPA フォールバックより
 * 前に登録されるため、ここで `dist/<path>/index.html` が実在すればそれを優先して返し、
 * 存在しない（＝ KNOWN_PATHS 外の未知パス）場合は `dist/404.html` を 404 応答として返す。
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
        const distDir = path.join(__dirname, "dist");
        const candidate = path.join(distDir, url, "index.html");
        if (fs.existsSync(candidate)) {
          res.setHeader("Content-Type", "text/html");
          res.end(fs.readFileSync(candidate));
          return;
        }
        const notFoundCandidate = path.join(distDir, "404.html");
        if (fs.existsSync(notFoundCandidate)) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/html");
          res.end(fs.readFileSync(notFoundCandidate));
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
