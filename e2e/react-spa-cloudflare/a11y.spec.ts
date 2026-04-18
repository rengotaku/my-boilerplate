import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("@a11y react-spa-cloudflare", () => {
  test("home page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("about page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("greeting form has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/greeting");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("greeting result page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/greeting/Alice");
    await expect(page.getByRole("heading", { name: /Hello, Alice!/ })).toBeVisible();
    await expect(page.getByText(/visitor #1/)).toBeVisible();
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
