import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PrivacyPage } from "./PrivacyPage";

describe("PrivacyPage", () => {
  it("renders the heading", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: "プライバシーポリシー" })
    ).toBeInTheDocument();
  });

  it("renders a contact email link", () => {
    render(<PrivacyPage />);

    const link = screen.getByRole("link", { name: "contact@example.com" });
    expect(link).toHaveAttribute("href", "mailto:contact@example.com");
  });
});
