import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router-dom";
import { render, screen } from "@/test/test-utils";
import { Layout } from "./Layout";

describe("Layout", () => {
  it("renders the sidebar navigation and the outlet", () => {
    render(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>child content</div>} />
        </Route>
      </Routes>,
      { initialEntries: ["/"] }
    );

    expect(screen.getByText("Admin Console")).toBeInTheDocument();
    expect(screen.getByText("Runs")).toBeInTheDocument();
    expect(screen.getByText("Metrics")).toBeInTheDocument();
    expect(screen.getByText("Logs")).toBeInTheDocument();
    expect(screen.getByText("Config")).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
