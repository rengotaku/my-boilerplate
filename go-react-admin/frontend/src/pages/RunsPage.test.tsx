import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { RunsPage } from "./RunsPage";

describe("RunsPage", () => {
  it("renders runs from the API", async () => {
    render(<RunsPage />);

    await waitFor(() => {
      expect(screen.getByText("nightly-export")).toBeInTheDocument();
    });
    expect(screen.getByText("sync-users")).toBeInTheDocument();
    expect(screen.getByText("cleanup")).toBeInTheDocument();
    // succeeded status badge
    expect(screen.getByText("succeeded")).toBeInTheDocument();
    // duration of the first run
    expect(screen.getByText("2m 30s")).toBeInTheDocument();
  });

  it("shows pagination summary", async () => {
    render(<RunsPage />);
    await waitFor(() => {
      expect(screen.getByText(/of 3/)).toBeInTheDocument();
    });
  });
});
