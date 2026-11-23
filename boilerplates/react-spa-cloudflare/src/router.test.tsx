import { render as rtlRender, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { AstryxWrapper } from "@/test/test-utils";
import { AppRouter } from "./router";

const renderAt = (path: string) =>
  rtlRender(
    <AstryxWrapper>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </AstryxWrapper>
  );

describe("AppRouter", () => {
  it("renders home page on root path", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { name: "React SPA Boilerplate" })
    ).toBeInTheDocument();
  });

  it("renders about page on /about path", () => {
    renderAt("/about");

    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
  });

  it("renders greeting form on /greeting path", () => {
    renderAt("/greeting");

    expect(screen.getByRole("heading", { name: /Greeting Demo/i })).toBeInTheDocument();
  });

  it("renders greeting page with name parameter", () => {
    renderAt("/greeting/TestUser");

    expect(
      screen.getByRole("heading", { name: /Hello, TestUser!/i })
    ).toBeInTheDocument();
  });

  it("renders 404 page on unknown path", () => {
    renderAt("/unknown-path");

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
  });
});
