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

describe("Layout sidebar collapse", () => {
  it("toggles the sidebar labels via the collapse button", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    render(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>child</div>} />
        </Route>
      </Routes>,
      { initialEntries: ["/"] }
    );

    // expanded by default → labels visible
    expect(screen.getByText("Runs")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    // collapsed → text labels hidden, expand control available
    expect(screen.queryByText("Runs")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });
});
