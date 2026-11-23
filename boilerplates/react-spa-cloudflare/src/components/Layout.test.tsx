import { render, screen } from "@/test/test-utils";
import { describe, it, expect } from "vitest";
import { Layout } from "./Layout";

describe("Layout", () => {
  it("renders navigation links", () => {
    render(<Layout />);

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Greeting" })).toBeInTheDocument();
  });

  it("renders banner and main landmarks", () => {
    render(<Layout />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("has correct link hrefs", () => {
    render(<Layout />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "Greeting" })).toHaveAttribute(
      "href",
      "/greeting"
    );
  });

  it("renders app title", () => {
    render(<Layout />);

    expect(screen.getByText("React SPA Cloudflare")).toBeInTheDocument();
  });
});
