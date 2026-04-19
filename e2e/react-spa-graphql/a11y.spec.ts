import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const mockUsers = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Bob Smith", email: "bob@example.com" },
];

test.describe("@a11y react-spa-graphql", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/query", async (route) => {
      const request = route.request();
      const body = (request.postDataJSON() ?? {}) as { operationName?: string };
      if (body.operationName === "GetUsers") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { users: mockUsers } }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {} }),
      });
    });
  });

  test("home page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("users page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByText("Alice Johnson")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("not found page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/this-path-does-not-exist");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});
