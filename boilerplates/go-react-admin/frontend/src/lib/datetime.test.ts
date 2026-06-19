import { describe, it, expect } from "vitest";
import { formatInstant } from "./datetime";

describe("formatInstant", () => {
  it("formats an instant in the given time zone", () => {
    // 2026-06-17T00:00:00Z is 09:00 in Tokyo (UTC+9).
    const jst = formatInstant("2026-06-17T00:00:00Z", "Asia/Tokyo");
    expect(jst).toContain("2026-06-17");
    expect(jst).toContain("09:00:00");
    // ...and 20:00 the previous day in New York (UTC-4 in June).
    const ny = formatInstant("2026-06-17T00:00:00Z", "America/New_York");
    expect(ny).toContain("2026-06-16");
    expect(ny).toContain("20:00:00");
  });

  it("returns an em dash for nullish input", () => {
    expect(formatInstant(null, "Asia/Tokyo")).toBe("—");
    expect(formatInstant(undefined, "Asia/Tokyo")).toBe("—");
  });

  it("defaults to Asia/Tokyo when no zone is given", () => {
    expect(formatInstant("2026-06-17T00:00:00Z")).toContain("09:00:00");
  });
});
