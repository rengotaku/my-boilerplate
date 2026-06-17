import { describe, it, expect } from "vitest";
import { jobsApi } from "./jobs";

describe("jobsApi", () => {
  it("lists jobs and validates the response shape", async () => {
    const res = await jobsApi.list();
    expect(res.items).toHaveLength(2);
    expect(res.items[0].name).toBe("nightly-export");
    expect(res.items[1].enabled).toBe(false);
  });

  it("fetches a single job", async () => {
    const job = await jobsApi.get(10);
    expect(job.id).toBe(10);
    expect(job.schedule).toBe("0 2 * * *");
  });

  it("creates a job and echoes it back", async () => {
    const job = await jobsApi.create({ name: "new-job", schedule: "@hourly" });
    expect(job.id).toBe(99);
    expect(job.name).toBe("new-job");
    expect(job.kind).toBe("task");
  });

  it("surfaces the server { error } on validation failure", async () => {
    await expect(jobsApi.create({ name: "", schedule: "bad" })).rejects.toThrow(
      "name is required"
    );
  });
});
