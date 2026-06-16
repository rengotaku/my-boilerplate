import { describe, it, expect } from "vitest";
import { configApi } from "./config";

describe("configApi", () => {
  it("fetches and validates config", async () => {
    const cfg = await configApi.get();
    expect(cfg.port).toBe("8080");
    expect(cfg.worker_interval).toBe(30);
    expect(cfg.shutdown_timeout).toBe(10);
  });
});
