import { describe, it, expect } from "vitest";
import { configApi } from "./config";

describe("configApi", () => {
  it("fetches and validates config items with their source", async () => {
    const cfg = await configApi.get();
    expect(cfg.configPath).toBe("config.toml");

    const byKey = Object.fromEntries(cfg.items.map((i) => [i.key, i]));
    expect(byKey["port"].source).toBe("env");
    expect(byKey["port"].editable).toBe(false);
    expect(byKey["worker_interval"].source).toBe("toml");
    expect(byKey["worker_interval"].editable).toBe(true);
    expect(byKey["worker_interval"].value).toBe("30s");
  });

  it("updates editable settings and reports restart is required", async () => {
    const res = await configApi.update({ worker_interval: "45s" });
    expect(res.workerInterval).toBe("45s");
    expect(res.restartRequired).toBe(true);
  });

  it("posts a restart request", async () => {
    await expect(configApi.restart()).resolves.toBeUndefined();
  });
});
