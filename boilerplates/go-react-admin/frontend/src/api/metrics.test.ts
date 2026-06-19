import { describe, it, expect } from "vitest";
import { metricsApi } from "./metrics";

describe("metricsApi", () => {
  it("aggregates metrics and validates the response", async () => {
    const res = await metricsApi.aggregate({ bucket: "1h" });
    expect(res.bucket).toBe("1h");
    expect(res.series).toHaveLength(2);
    expect(res.series[0].name).toBe("succeeded");
    expect(res.series[0].points[0].value).toBe(3);
  });
});
