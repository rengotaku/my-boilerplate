import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";
import { AstryxWrapper } from "@/test/test-utils";

describe("App", () => {
  const renderApp = () => render(<App />, { wrapper: AstryxWrapper });

  it("renders home page by default", () => {
    renderApp();
    expect(screen.getByText("React SPA Boilerplate")).toBeInTheDocument();
  });

  it("shows navigation links", () => {
    renderApp();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "About" }).length).toBeGreaterThan(0);
  });

  it("renders with correct app title", () => {
    renderApp();
    expect(screen.getByText("React SPA Cloudflare")).toBeInTheDocument();
  });
});
