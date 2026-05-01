import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:4174";
const API_URL = "http://localhost:8081";

const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}@example.com`;

test.describe("react-spa ↔ go-rest-api integration", () => {
  test("API health check responds", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBe(true);
  });

  test("home page loads and links to users", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/react-spa/i);
    const usersLink = page
      .getByRole("banner")
      .getByRole("link", { name: /users/i });
    await expect(usersLink).toBeVisible();
  });

  test("users page loads and displays user management UI with password field", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/users`);
    await expect(
      page.getByRole("heading", { name: /users/i })
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create/i })
    ).toBeVisible();
  });

  test("login page exposes email and password fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(
      page.getByRole("heading", { name: /sign in/i })
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
  });

  test("create user via UI form including password", async ({ page }) => {
    const email = uniqueEmail("e2e-ui");
    await page.goto(`${BASE_URL}/users`);

    await page.getByLabel("Name").fill("E2E UI User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /^create$/i }).click();

    await expect(page.getByText("E2E UI User")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(email)).toBeVisible();
  });

  test("login flow stores token and grants protected access (UI)", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-login");
    const password = "password123";

    const createResp = await request.post(`${API_URL}/api/v1/users`, {
      data: { name: "E2E Login User", email, password },
    });
    expect(createResp.ok()).toBe(true);

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // After login, header shows Logout instead of Login
    await expect(
      page.getByRole("button", { name: /logout/i })
    ).toBeVisible({ timeout: 10_000 });

    // Token persisted in localStorage
    const token = await page.evaluate(() =>
      window.localStorage.getItem("react-spa-auth-token")
    );
    expect(token).toBeTruthy();
  });

  test("REST API endpoint returns valid response", async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/users`);
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
