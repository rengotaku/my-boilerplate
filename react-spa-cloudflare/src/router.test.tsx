import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { AppRouter } from "./router";

describe("AppRouter", () => {
  it("renders home page on root path", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "React SPA Boilerplate" })
    ).toBeInTheDocument();
  });

  it("renders about page on /about path", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
  });

  it("renders 404 page on unknown path", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-path"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
  });
});
