import { describe, it, expect } from "vitest";
import { runsApi } from "./runs";

describe("runsApi", () => {
  it("lists runs and validates the response shape", async () => {
    const res = await runsApi.list({ page: 1, pageSize: 20 });
    expect(res.items).toHaveLength(3);
    expect(res.total).toBe(3);
    expect(res.items[0].jobName).toBe("nightly-export");
  });

  it("forwards the status filter", async () => {
    const res = await runsApi.list({ status: "failed" });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].status).toBe("failed");
  });

  it("fetches a run detail with phases, events and logs", async () => {
    const detail = await runsApi.get(1);
    expect(detail.run.id).toBe(1);
    expect(detail.phases).toHaveLength(2);
    expect(detail.events).toHaveLength(2);
    expect(detail.logs).toHaveLength(2);
  });
});
