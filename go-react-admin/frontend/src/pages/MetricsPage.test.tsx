import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { MetricsPage } from "./MetricsPage";

describe("MetricsPage", () => {
  it("renders chart sections once metrics load", async () => {
    render(<MetricsPage />);

    await waitFor(() => {
      expect(screen.getByText("Over time")).toBeInTheDocument();
    });
    expect(screen.getByText("Stacked by series")).toBeInTheDocument();
    expect(screen.getByText("Metrics")).toBeInTheDocument();
  });
});
