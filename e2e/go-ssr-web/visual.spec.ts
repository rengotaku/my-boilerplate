import { test, expect } from "@playwright/test";

test.describe("@visual go-ssr-web", () => {
  const gotoAndWait = async (page: import("@playwright/test").Page, path: string) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
  };

  test("home page", async ({ page }) => {
    await gotoAndWait(page, "/");
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("users page with empty list", async ({ page }) => {
    await gotoAndWait(page, "/users");
    await expect(page).toHaveScreenshot("users.png", { fullPage: true });
  });

  test("new user form", async ({ page }) => {
    await gotoAndWait(page, "/users/new");
    await expect(page).toHaveScreenshot("users-new.png", { fullPage: true });
  });
});
