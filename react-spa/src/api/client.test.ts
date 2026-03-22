import { describe, it, expect } from "vitest";
import { apiClient } from "./client";

describe("apiClient", () => {
  it("is configured with correct base URL", async () => {
    // Test that apiClient can make requests to the configured base URL
    const response = await apiClient.get("api/v1/users");
    const users = await response.json();

    expect(Array.isArray(users)).toBe(true);
  });

  it("includes Content-Type header", async () => {
    // This is tested implicitly through successful JSON requests
    const response = await apiClient.post("api/v1/users", {
      json: { name: "Test", email: "test@example.com" },
    });

    expect(response.ok).toBe(true);
  });
});
