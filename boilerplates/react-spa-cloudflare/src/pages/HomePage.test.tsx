import { render, screen } from "@/test/test-utils";
import { describe, it, expect } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the title", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "React SPA Boilerplate" })
    ).toBeInTheDocument();
  });

  it("renders features section", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Features" })).toBeInTheDocument();
    expect(screen.getByText("Astryx (design system)")).toBeInTheDocument();
  });

  it("renders navigation link to about page", () => {
    render(<HomePage />);

    const link = screen.getByRole("link", { name: "About" });
    expect(link).toHaveAttribute("href", "/about");
  });
});
