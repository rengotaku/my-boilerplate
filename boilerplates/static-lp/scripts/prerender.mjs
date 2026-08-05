#!/usr/bin/env node
/**
 * ビルド時プリレンダリングスクリプト。
 *
 * 前提: `npm run build` の中で、このスクリプトより先に以下が完了していること。
 *   1. `vite build`（クライアントビルド, `dist/index.html` を含む）
 *   2. `vite build --ssr src/entry-server.tsx --outDir dist-ssr`（Node 実行可能な SSR バンドル）
 *
 * `dist-ssr/entry-server.js` を動的 import して `render(url)` を取得し、`src/routes.ts` の
 * `KNOWN_PATHS`（単一ソース）は Vite の `ssrLoadModule` で直接読み込む（entry-server.tsx は
 * JSX を含むため react-refresh/only-export-components の制約上 `render` 以外を export できない。
 * Node のネイティブ TypeScript 実行にも依存しないため `.node-version` の Node バージョンでも
 * 確実に動く）。
 *
 * 各パスについて `render(path)` の結果を `dist/index.html` テンプレートの
 * `<div id="root"></div>` に埋め込み、`dist/**\/index.html` として書き出す。
 *
 * 出力先マッピング（KNOWN_PATHS のデフォルト値の例）:
 *   "/"        -> dist/index.html（クライアントビルドの出力を上書き）
 *   "/privacy" -> dist/privacy/index.html（新規ディレクトリ）
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer } from "vite";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(rootDir, "dist");
const ssrEntryPath = path.join(rootDir, "dist-ssr", "entry-server.js");
const templatePath = path.join(distDir, "index.html");

const ROOT_PLACEHOLDER = '<div id="root"></div>';

function outputPathFor(routePath) {
  if (routePath === "/") {
    return path.join(distDir, "index.html");
  }
  return path.join(distDir, routePath.replace(/^\/+/, ""), "index.html");
}

async function loadKnownPaths() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
    logLevel: "error",
  });
  try {
    const mod = await vite.ssrLoadModule("/src/routes.ts");
    return mod.KNOWN_PATHS;
  } finally {
    await vite.close();
  }
}

async function main() {
  const template = await readFile(templatePath, "utf-8");
  if (!template.includes(ROOT_PLACEHOLDER)) {
    throw new Error(
      `prerender: ${templatePath} に ${ROOT_PLACEHOLDER} が見つからない（テンプレートの構造が変わった可能性）`
    );
  }

  const [{ render }, KNOWN_PATHS] = await Promise.all([
    import(pathToFileURL(ssrEntryPath).href),
    loadKnownPaths(),
  ]);

  if (!Array.isArray(KNOWN_PATHS) || KNOWN_PATHS.length === 0) {
    throw new Error("prerender: KNOWN_PATHS が空。src/routes.ts を確認すること");
  }

  for (const routePath of KNOWN_PATHS) {
    const appHtml = render(routePath);
    // 置換値を関数で渡す: 文字列で渡すと原稿に $&, $`, $', $$ 等が含まれた場合に
    // String.replace の特殊置換パターンとして解釈され、出力が静かに壊れる。
    const html = template.replace(ROOT_PLACEHOLDER, () => `<div id="root">${appHtml}</div>`);
    const outputPath = outputPathFor(routePath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, "utf-8");
    console.log(`[prerender] ${routePath} -> ${path.relative(rootDir, outputPath)}`);
  }
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exitCode = 1;
});
