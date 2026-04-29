import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:4174";
const API_URL = "http://localhost:8081";

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

  test("users page loads and displays user management UI", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/users`);
    await expect(
      page.getByRole("heading", { name: /users/i })
    ).toBeVisible();
    // Create form should be visible
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create/i })
    ).toBeVisible();
  });

  test("create user via API and verify it appears in the list", async ({
    page,
    request,
  }) => {
    // Create user via API (form does not include password field)
    const createResp = await request.post(`${API_URL}/api/v1/users`, {
      data: {
        name: "E2E REST User",
        email: "e2e-rest@example.com",
        password: "password123",
      },
    });
    expect(createResp.ok()).toBe(true);

    await page.goto(`${BASE_URL}/users`);
    await expect(page.getByText("E2E REST User")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("e2e-rest@example.com")).toBeVisible();
  });

  test("REST API endpoint returns valid response", async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/users`);
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
