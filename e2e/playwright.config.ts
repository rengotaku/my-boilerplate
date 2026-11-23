import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// go-ssr-web keeps its data in a SQLite file (DATABASE_DSN). The integration
// tests create users, while the VRT baselines capture an empty user list, and
// the server would otherwise reuse the app.db left by the previous run. Give
// each server a database file of its own, created fresh for every run (#342).
const makeGoSSRWebDatabase = () => {
  const dir = mkdtempSync(join(tmpdir(), "go-ssr-web-e2e-"));
  process.on("exit", () => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Best effort: a leftover temp directory must not fail the run.
    }
  });
  return join(dir, "app.db");
};

const GO_SSR_WEB_VRT_PORT = "8085";
const GO_SSR_WEB_CRUD_PORT = "8086";
const goSSRWebVRTDatabase = makeGoSSRWebDatabase();
const goSSRWebCRUDDatabase = makeGoSSRWebDatabase();

const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

type Viewport = keyof typeof viewports;

const makeVisualProjects = (template: string, baseURL: string) =>
  (Object.keys(viewports) as Viewport[]).map((name) => ({
    name: `${template}-visual-${name}`,
    testDir: `./${template}`,
    testMatch: /visual\.spec\.ts/,
    use: {
      ...devices["Desktop Chrome"],
      baseURL,
      viewport: viewports[name],
    },
  }));

const makeFunctionalProject = (template: string, baseURL: string) => ({
  name: template,
  testDir: `./${template}`,
  testIgnore: [/visual\.spec\.ts/],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    viewport: viewports.desktop,
  },
});

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "html",
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    makeFunctionalProject("react-spa", "http://localhost:4174"),
    makeFunctionalProject("react-spa-cloudflare", "http://localhost:4175"),
    ...makeVisualProjects("react-spa", "http://localhost:4174"),
    ...makeVisualProjects("react-spa-cloudflare", "http://localhost:4175"),
    // go-ssr-web runs two servers with separate databases: the VRT projects
    // read the empty one, the integration / a11y project writes the other.
    ...makeVisualProjects("go-ssr-web", `http://localhost:${GO_SSR_WEB_VRT_PORT}`),
    makeFunctionalProject("go-ssr-web", `http://localhost:${GO_SSR_WEB_CRUD_PORT}`),
  ],
  webServer: [
    {
      command:
        "cd ../boilerplates/react-spa && npm run build && npm run preview -- --port 4174",
      url: "http://localhost:4174",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command:
        "cd ../boilerplates/react-spa-cloudflare && npm run build && npm run preview -- --port 4175",
      url: "http://localhost:4175",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "../boilerplates/go-ssr-web/scripts/run-with-tailwind.sh",
      env: { PORT: GO_SSR_WEB_VRT_PORT, DATABASE_DSN: goSSRWebVRTDatabase },
      url: `http://localhost:${GO_SSR_WEB_VRT_PORT}/`,
      // Always start our own server: a reused one would not use this run's
      // temporary database, which is the point of the two entries above.
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "../boilerplates/go-ssr-web/scripts/run-with-tailwind.sh",
      env: { PORT: GO_SSR_WEB_CRUD_PORT, DATABASE_DSN: goSSRWebCRUDDatabase },
      url: `http://localhost:${GO_SSR_WEB_CRUD_PORT}/`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
