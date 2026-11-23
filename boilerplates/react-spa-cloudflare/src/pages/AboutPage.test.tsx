import { render, screen } from "@/test/test-utils";
import { describe, it, expect } from "vitest";
import { AboutPage } from "./AboutPage";

describe("AboutPage", () => {
  it("renders about heading", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<AboutPage />);

    expect(screen.getByText(/React SPA boilerplate/i)).toBeInTheDocument();
  });

  it("renders back to home button", () => {
    render(<AboutPage />);

    expect(screen.getByRole("link", { name: "Back to Home" })).toBeInTheDocument();
  });
});
