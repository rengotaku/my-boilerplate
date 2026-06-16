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
    // ky needs an absolute base to resolve relative request paths; in the
    // browser this comes from same-origin, in jsdom we point it at the API host.
    environmentOptions: {
      jsdom: {
        url: "http://localhost:8080",
      },
    },
    env: {
      VITE_API_BASE_URL: "http://localhost:8080",
    },
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/main.tsx", "src/vite-env.d.ts"],
    },
  },
});
