import { describe, it, expect } from "vitest";
import { runSchema, runsResponseSchema } from "./run";

describe("run schemas", () => {
  it("parses a valid run", () => {
    const run = runSchema.parse({
      id: 1,
      jobId: 2,
      jobName: "job",
      status: "succeeded",
      startedAt: "2026-06-16T01:00:00Z",
      finishedAt: null,
      createdAt: "2026-06-16T00:59:00Z",
    });
    expect(run.status).toBe("succeeded");
    expect(run.finishedAt).toBeNull();
  });

  it("rejects an unknown status", () => {
    expect(() =>
      runSchema.parse({
        id: 1,
        jobId: 2,
        jobName: "job",
        status: "cancelled",
        startedAt: "x",
        finishedAt: null,
        createdAt: "x",
      })
    ).toThrow();
  });

  it("rejects a response missing required fields", () => {
    expect(() => runsResponseSchema.parse({ items: [] })).toThrow();
  });
});
