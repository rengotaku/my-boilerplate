import { render, screen } from "@/test/test-utils";
import { describe, it, expect } from "vitest";
import { UsersPage } from "./UsersPage";

describe("UsersPage", () => {
  it("displays users heading", () => {
    render(<UsersPage />);
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("displays pending message", () => {
    render(<UsersPage />);
    expect(screen.getByText(/GraphQL integration pending/)).toBeInTheDocument();
  });
});
