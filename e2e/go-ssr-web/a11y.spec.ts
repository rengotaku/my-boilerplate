import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("@a11y go-ssr-web", () => {
  test("home page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("users page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("new user page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});
