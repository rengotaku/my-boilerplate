import { describe, it, expect } from "vitest";
import { statusTone, formatDuration } from "./status";

describe("statusTone", () => {
  it("maps run statuses to tones", () => {
    expect(statusTone("succeeded")).toBe("success");
    expect(statusTone("failed")).toBe("error");
    expect(statusTone("running")).toBe("running");
    expect(statusTone("queued")).toBe("neutral");
  });
});

describe("formatDuration", () => {
  it("returns a dash when not finished", () => {
    expect(formatDuration("2026-06-16T01:00:00Z", null)).toBe("—");
  });

  it("formats seconds", () => {
    expect(formatDuration("2026-06-16T01:00:00Z", "2026-06-16T01:00:45Z")).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration("2026-06-16T01:00:00Z", "2026-06-16T01:02:30Z")).toBe("2m 30s");
  });
});
