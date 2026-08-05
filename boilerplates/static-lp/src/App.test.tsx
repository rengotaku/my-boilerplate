import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";
import { KNOWN_PATHS } from "./routes";

describe("App", () => {
  it("renders home page by default", () => {
    render(<App />);
    expect(screen.getByText("Static LP Boilerplate")).toBeInTheDocument();
  });

  it("shows navigation links", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("renders with correct app title", () => {
    render(<App />);
    expect(screen.getByText("Static LP")).toBeInTheDocument();
  });
});

/**
 * リンク整合の統合テスト（issue #281 実装ブリーフの凍結ケース3〜5）。
 *
 * 各ページ・コンポーネントの単体テストとは別に、実際に render した App（既定は "/"
 * = HomePage）の DOM 構造からリンク切れを検知する:
 * - ページ内アンカー（href="#foo"）が同一ページ上に id="foo" を持つ要素として実在すること
 * - 内部パスリンク（href="/foo"）が src/routes.ts の KNOWN_PATHS に対応すること
 * - href が空文字・"#"のみ・未定義のリンクが存在しないこと
 *
 * LP 原稿の文言そのものは検証しない（同語反復テストを避けるため）。
 */
describe("App link integrity", () => {
  it("has no link with an empty, '#'-only, or undefined href", () => {
    render(<App />);

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      const href = link.getAttribute("href");
      expect(href, `link "${link.textContent}" is missing an href`).toBeTruthy();
      expect(href, `link "${link.textContent}" has an empty href`).not.toBe("");
      expect(href, `link "${link.textContent}" has a "#"-only href`).not.toBe("#");
    }
  });

  it('resolves every in-page anchor link (href="#foo") to an element with id="foo"', () => {
    render(<App />);

    const anchorLinks = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => !!href && href.startsWith("#"));

    // ページ内アンカーを最低1本は使っている前提（HomePage の Features ジャンプリンク）。
    expect(anchorLinks.length).toBeGreaterThan(0);

    for (const href of anchorLinks) {
      const id = href.slice(1);
      expect(
        document.getElementById(id),
        `no element with id="${id}" for anchor link "${href}"`
      ).not.toBeNull();
    }
  });

  it('resolves every internal path link (href="/foo") to a route registered in KNOWN_PATHS', () => {
    render(<App />);

    const internalLinks = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => !!href && href.startsWith("/"));

    // 内部パスリンクを最低1本は使っている前提（Layout ナビ / HomePage の Privacy リンク）。
    expect(internalLinks.length).toBeGreaterThan(0);

    for (const href of internalLinks) {
      expect(
        (KNOWN_PATHS as readonly string[]).includes(href),
        `href="${href}" is not a route registered in KNOWN_PATHS (src/routes.ts)`
      ).toBe(true);
    }
  });
});
