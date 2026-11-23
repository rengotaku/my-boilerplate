import { render, screen } from "@/test/test-utils";
import { describe, it, expect } from "vitest";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders 404 message", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page Not Found")).toBeInTheDocument();
  });

  it("renders link to home", () => {
    render(<NotFoundPage />);

    const link = screen.getByRole("link", { name: "Go to Home" });
    expect(link).toHaveAttribute("href", "/");
  });
});
