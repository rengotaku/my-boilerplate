import { test, expect } from "@playwright/test";

test.describe("@visual react-spa-cloudflare", () => {
  const gotoAndWait = async (page: import("@playwright/test").Page, path: string) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
  };

  test("home page", async ({ page }) => {
    await gotoAndWait(page, "/");
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("about page", async ({ page }) => {
    await gotoAndWait(page, "/about");
    await expect(page).toHaveScreenshot("about.png", { fullPage: true });
  });

  test("greeting form (empty state)", async ({ page }) => {
    await gotoAndWait(page, "/greeting");
    await expect(page).toHaveScreenshot("greeting-form.png", { fullPage: true });
  });

  test("greeting result page", async ({ page }) => {
    await gotoAndWait(page, "/greeting/Alice");
    await expect(page.getByRole("heading", { name: /Hello, Alice!/ })).toBeVisible();
    await expect(page.getByText(/visitor #1/)).toBeVisible();
    await expect(page).toHaveScreenshot("greeting-result.png", { fullPage: true });
  });

  test("not found page", async ({ page }) => {
    await gotoAndWait(page, "/this-path-does-not-exist");
    await expect(page).toHaveScreenshot("not-found.png", { fullPage: true });
  });
});
