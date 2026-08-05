import { describe, it, expect } from "vitest";
import { links, resolveHref } from "./links";

describe("links", () => {
  // TC1（issue #281 実装ブリーフ 凍結ケース1）: ready エントリの解決。
  it("TC1: resolveHref returns the href string for a ready entry", () => {
    expect(resolveHref({ status: "ready", href: "mailto:foo@example.com" })).toBe(
      "mailto:foo@example.com"
    );
  });

  // TC2（凍結ケース2）: preparing エントリは href を返さない（UI 側で非活性になる）。
  it("TC2: resolveHref returns undefined for a preparing entry", () => {
    expect(resolveHref({ status: "preparing" })).toBeUndefined();
  });

  it("TC3: links.contact is ready with a mailto href using the centralized contact email", () => {
    expect(links.contact).toEqual({
      status: "ready",
      href: `mailto:${links.contactEmail}`,
    });
  });

  it("TC4: links.newsletter is preparing (placeholder for an undecided external URL)", () => {
    expect(links.newsletter).toEqual({ status: "preparing" });
  });

  it("TC5: contactEmail is the centralized contact address", () => {
    expect(links.contactEmail).toBe("contact@example.com");
  });
});
