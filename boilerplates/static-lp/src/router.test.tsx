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
      screen.getByRole("heading", { name: "Static LP Boilerplate" })
    ).toBeInTheDocument();
  });

  it("renders privacy page on /privacy path", () => {
    render(
      <MemoryRouter initialEntries={["/privacy"]}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "プライバシーポリシー" })
    ).toBeInTheDocument();
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
