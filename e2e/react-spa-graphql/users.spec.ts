import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:4173";
const API_URL = "http://localhost:8080";

test.describe("react-spa-graphql ↔ go-graphql-api integration", () => {
  test("API health check responds", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("home page loads and links to users", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/react-spa/i);
    const usersLink = page
      .getByRole("banner")
      .getByRole("link", { name: /users/i });
    await expect(usersLink).toBeVisible();
  });

  test("users page loads and displays user management UI", async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
    // Create form should be visible
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible();
  });

  test("create user and verify it appears in the list", async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);

    // Fill in create user form
    await page.getByLabel(/name/i).fill("E2E Test User");
    await page.getByLabel(/email/i).fill("e2e@example.com");
    await page.getByRole("button", { name: /create/i }).click();

    // Wait for the new user to appear in the table
    await expect(page.getByText("E2E Test User")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("e2e@example.com")).toBeVisible();
  });

  test("GraphQL endpoint returns valid response", async ({ request }) => {
    const response = await request.post(`${API_URL}/query`, {
      data: {
        query: "{ users { id name email } }",
      },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data).toHaveProperty("users");
    expect(Array.isArray(body.data.users)).toBe(true);
  });
});
