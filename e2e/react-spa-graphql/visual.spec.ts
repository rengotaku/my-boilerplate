import { test, expect } from "@playwright/test";

const mockUsers = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Bob Smith", email: "bob@example.com" },
];

test.describe("@visual react-spa-graphql", () => {
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

  const gotoAndWait = async (page: import("@playwright/test").Page, path: string) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
  };

  test("home page", async ({ page }) => {
    await gotoAndWait(page, "/");
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("users page with list", async ({ page }) => {
    await gotoAndWait(page, "/users");
    await expect(page.getByText("Alice Johnson")).toBeVisible();
    await expect(page).toHaveScreenshot("users.png", { fullPage: true });
  });

  test("not found page", async ({ page }) => {
    await gotoAndWait(page, "/this-path-does-not-exist");
    await expect(page).toHaveScreenshot("not-found.png", { fullPage: true });
  });
});
