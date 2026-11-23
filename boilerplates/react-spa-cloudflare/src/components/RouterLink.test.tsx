import { render, screen } from "@/test/test-utils";
import { describe, it, expect } from "vitest";
import { RouterLink } from "./RouterLink";

describe("RouterLink", () => {
  it("maps Astryx's href to a react-router destination", () => {
    render(<RouterLink href="/about">About</RouterLink>);

    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  });

  it("keeps an explicit to over href", () => {
    render(
      <RouterLink href="/ignored" to="/home">
        Home
      </RouterLink>
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
  });
});
