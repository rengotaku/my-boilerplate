import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders the 404 message", () => {
    render(<NotFoundPage />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Go to Runs")).toBeInTheDocument();
  });
});
