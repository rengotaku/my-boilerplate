import { test, expect } from "@playwright/test";

test.describe("go-ssr-web users CRUD", () => {
  test("home page loads and has link to users", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /welcome to go ssr web/i })).toBeVisible();
    const usersLink = page.getByRole("link", { name: /manage users/i });
    await expect(usersLink).toBeVisible();
  });

  test("users page shows empty state and link to create new user", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /new user/i })).toBeVisible();
  });

  test("new user form is displayed at /users/new", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /new user/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible();
  });

  test("create user and verify it appears in the list", async ({ page }) => {
    const uniqueEmail = `create-${Date.now()}@example.com`;
    const uniqueName = `E2E Create User ${Date.now()}`;

    await page.goto("/users/new");
    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(uniqueEmail)).toBeVisible();
  });

  test("view created user detail page", async ({ page }) => {
    const uniqueEmail = `detail-${Date.now()}@example.com`;
    const uniqueName = `E2E Detail User ${Date.now()}`;

    await page.goto("/users/new");
    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page).toHaveURL(/\/users$/);
    await page.getByRole("link", { name: uniqueName }).click();

    await expect(page.getByRole("heading", { name: uniqueName })).toBeVisible();
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    await expect(page.getByRole("link", { name: /edit/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to list/i })).toBeVisible();
  });

  test("edit created user", async ({ page }) => {
    const uniqueEmail = `edit-${Date.now()}@example.com`;
    const uniqueName = `E2E Edit User ${Date.now()}`;
    const updatedName = `E2E Edited User ${Date.now()}`;
    const updatedEmail = `edited-${Date.now()}@example.com`;

    await page.goto("/users/new");
    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page).toHaveURL(/\/users$/);
    await page.getByRole("link", { name: uniqueName }).click();
    await page.getByRole("link", { name: /edit/i }).click();

    await expect(page.getByRole("heading", { name: /edit user/i })).toBeVisible();
    await page.getByLabel(/name/i).fill(updatedName);
    await page.getByLabel(/email/i).fill(updatedEmail);
    await page.getByRole("button", { name: /update/i }).click();

    await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();
    await expect(page.getByText(updatedEmail)).toBeVisible();
  });

  test("delete created user", async ({ page }) => {
    const uniqueEmail = `delete-${Date.now()}@example.com`;
    const uniqueName = `E2E Delete User ${Date.now()}`;

    await page.goto("/users/new");
    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByText(uniqueName)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("row", { name: new RegExp(uniqueName) })
      .getByRole("button", { name: /delete/i })
      .click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByText(uniqueName)).not.toBeVisible({ timeout: 10_000 });
  });
});
