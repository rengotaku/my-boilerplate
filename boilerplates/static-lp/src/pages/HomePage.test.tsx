import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the title", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Static LP Boilerplate" })
    ).toBeInTheDocument();
  });

  it("renders features section", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: "Features" })).toBeInTheDocument();
  });

  it("renders navigation link to privacy page", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const link = screen.getByRole("link", { name: "プライバシーポリシー" });
    expect(link).toHaveAttribute("href", "/privacy");
  });

  // 追加テスト: ページ内アンカーリンク（Features へ）が対応する id を持つ要素に
  // 解決できること / src/App.test.tsx のリンク整合統合テストが検証する対象を
  // 単体でも確認するため。
  it("resolves the in-page anchor link to the Features section", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const link = screen.getByRole("link", { name: "Features を見る" });
    expect(link).toHaveAttribute("href", "#features");
    expect(document.getElementById("features")).not.toBeNull();
  });
});
