import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { LogsPage } from "./LogsPage";

describe("LogsPage", () => {
  it("defaults to the latest run and shows its logs", async () => {
    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText("starting extract")).toBeInTheDocument();
    });
    expect(screen.getByText("transient read error, retrying")).toBeInTheDocument();
  });
});
