import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  timeout: 30_000,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "react-spa-graphql",
      testDir: "./react-spa-graphql",
    },
    {
      name: "react-spa",
      testDir: "./react-spa",
    },
  ],
  webServer: [
    {
      command: "cd ../go-graphql-api && go run ./cmd/server",
      url: "http://localhost:8080/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command:
        "cd ../go-rest-api && PORT=8081 go run ./cmd/server",
      url: "http://localhost:8081/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "cd ../react-spa-graphql && npm run build && npm run preview",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command:
        "cd ../react-spa && VITE_API_BASE_URL=http://localhost:8081 npm run build && npm run preview -- --port 4174",
      url: "http://localhost:4174",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
