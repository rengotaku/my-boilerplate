import { render, screen } from "@/test/test-utils";
import { describe, it, expect } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the title", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "React SPA Boilerplate"
    );
  });

  it("lists the template features", () => {
    render(<HomePage />);

    expect(screen.getByText("Astryx (design system)")).toBeInTheDocument();
  });

  it("renders navigation link to users", () => {
    render(<HomePage />);

    const link = screen.getByRole("link", { name: "Users" });
    expect(link).toHaveAttribute("href", "/users");
  });
});
