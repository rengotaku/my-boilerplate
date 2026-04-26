import { defineConfig, devices } from "@playwright/test";

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
  workers: process.env.CI ? 1 : undefined,
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
    makeFunctionalProject("react-spa-graphql", "http://localhost:4173"),
    makeFunctionalProject("react-spa", "http://localhost:4174"),
    makeFunctionalProject("react-spa-cloudflare", "http://localhost:4175"),
    ...makeVisualProjects("react-spa-graphql", "http://localhost:4173"),
    ...makeVisualProjects("react-spa", "http://localhost:4174"),
    ...makeVisualProjects("react-spa-cloudflare", "http://localhost:4175"),
    // go-ssr-web: visual before functional to capture empty-state snapshots
    // before CRUD tests create users that would overflow the mobile table
    ...makeVisualProjects("go-ssr-web", "http://localhost:8085"),
    makeFunctionalProject("go-ssr-web", "http://localhost:8085"),
  ],
  webServer: [
    {
      command: "cd ../go-graphql-api && go run ./cmd/server",
      url: "http://localhost:8080/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "cd ../go-rest-api && PORT=8081 go run ./cmd/server",
      url: "http://localhost:8081/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "cd ../react-spa-graphql && npm run build && npm run preview",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command:
        "cd ../react-spa && VITE_API_BASE_URL=http://localhost:8081 npm run build && npm run preview -- --port 4174",
      url: "http://localhost:4174",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command:
        "cd ../react-spa-cloudflare && npm run build && npm run preview -- --port 4175",
      url: "http://localhost:4175",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "../go-ssr-web/scripts/run-with-tailwind.sh",
      env: { PORT: "8085" },
      url: "http://localhost:8085/",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
