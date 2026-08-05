import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      // LP の表示専用ページ/コンポーネント（src/pages, src/components 等）はスナップショット的な
      // 同語反復テストを書かない方針（rules/testing.md「静的コンテンツにテストを作り込まない」）の
      // ため、カバレッジゲートの対象からも外す。分岐のあるロジック（src/config/** の設定値・
      // src/lib/** のユーティリティ関数・src/hooks/** のフック）のみを対象にする。
      include: [
        "src/config/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
      ],
    },
  },
});
