import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { JobsPage } from "./JobsPage";

describe("JobsPage", () => {
  it("renders jobs from the API", async () => {
    render(<JobsPage />);

    await waitFor(() => {
      expect(screen.getByText("nightly-export")).toBeInTheDocument();
    });
    expect(screen.getByText("sync-users")).toBeInTheDocument();
    expect(screen.getByText("enabled")).toBeInTheDocument();
    expect(screen.getByText("disabled")).toBeInTheDocument();
    expect(screen.getByText("0 2 * * *")).toBeInTheDocument();
  });

  it("has a New job link", async () => {
    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText("nightly-export")).toBeInTheDocument();
    });
    const link = screen.getByRole("link", { name: /New job/ });
    expect(link).toHaveAttribute("href", "/jobs/new");
  });
});
