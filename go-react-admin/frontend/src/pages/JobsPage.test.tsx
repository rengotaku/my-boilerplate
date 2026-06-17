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

describe("JobsPage interactions", () => {
  it("opens a job detail drawer when a row is clicked", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    render(<JobsPage />);

    await waitFor(() => {
      expect(screen.getByText("nightly-export")).toBeInTheDocument();
    });
    await user.click(screen.getByText("nightly-export"));

    // JobDetailContent loads inside the drawer → run history heading + Close.
    await waitFor(() => {
      expect(screen.getByText("Run history")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
