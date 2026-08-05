#!/usr/bin/env node
/**
 * プリレンダリング結果の検証スクリプト。
 *
 * `npm run build` の最終ステップとして実行し、ブラウザ実行なし（fs.readFile + includes()）で
 * 以下を検証する。失敗したら非ゼロ終了し、ビルド全体を失敗させる:
 *
 *   1. `dist/index.html` が存在し、ホームページの見出しテキストを含む
 *   2. `dist/privacy/index.html` が存在し、プライバシーポリシーページの見出しテキストを含む
 *   3. `dist/404.html` が存在し、NotFoundPage の見出しテキストを含む
 *   4. いずれのファイルにもエラー痕跡（"Uncaught" 等）が無い
 *
 * このテンプレートは原稿を集約する `src/content/` を持たないため、期待テキストは
 * このスクリプトにハードコードしている。`src/pages/HomePage.tsx` /
 * `src/pages/PrivacyPage.tsx` / `src/pages/NotFoundPage.tsx` の見出し文言を変更した
 * 場合、`src/routes.ts` にパスを追加した場合は、あわせて HOME_HEADING /
 * PRIVACY_HEADING / NOT_FOUND_HEADING / assertPage の呼び出しも更新すること。
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(rootDir, "dist");

// src/pages/HomePage.tsx の見出しテキスト。
const HOME_HEADING = "Static LP Boilerplate";
// src/pages/PrivacyPage.tsx の見出しテキスト。
const PRIVACY_HEADING = "プライバシーポリシー";
// src/pages/NotFoundPage.tsx の見出しテキスト。
const NOT_FOUND_HEADING = "404";

const ERROR_MARKERS = ["Uncaught", "ReferenceError", "TypeError:", "ChunkLoadError"];

async function assertPage(label, filePath, expectedText) {
  let html;
  try {
    html = await readFile(filePath, "utf-8");
  } catch {
    throw new Error(`[verify-prerender] ${label}: ${filePath} が存在しない`);
  }

  if (!html.includes(expectedText)) {
    throw new Error(
      `[verify-prerender] ${label}: ${filePath} に期待テキストが含まれない: "${expectedText}"`
    );
  }

  for (const marker of ERROR_MARKERS) {
    if (html.includes(marker)) {
      throw new Error(
        `[verify-prerender] ${label}: ${filePath} にエラー痕跡 "${marker}" が含まれている`
      );
    }
  }

  console.log(`[verify-prerender] OK: ${label} (${path.relative(rootDir, filePath)})`);
}

async function main() {
  await assertPage("home", path.join(distDir, "index.html"), HOME_HEADING);
  await assertPage(
    "privacy",
    path.join(distDir, "privacy", "index.html"),
    PRIVACY_HEADING
  );
  await assertPage("404", path.join(distDir, "404.html"), NOT_FOUND_HEADING);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
