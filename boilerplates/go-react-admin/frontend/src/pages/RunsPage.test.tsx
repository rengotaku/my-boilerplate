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

describe("RunsPage interactions", () => {
  it("opens a detail drawer when a row is clicked", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    render(<RunsPage />);

    await waitFor(() => {
      expect(screen.getByText("nightly-export")).toBeInTheDocument();
    });
    await user.click(screen.getByText("nightly-export"));

    // RunDetailContent loads inside the drawer → its section headings appear.
    await waitFor(() => {
      expect(screen.getByText("Phases")).toBeInTheDocument();
    });
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    // The drawer bar names the panel; the body heading carries the run identity,
    // status and duration. There is no second bare "Run #1" heading.
    expect(screen.getByRole("heading", { name: "Run detail" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Run #1 · nightly-export" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Run #1" })).not.toBeInTheDocument();
  });

  it("filters rows by the job name column filter", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    render(<RunsPage />);

    await waitFor(() => {
      expect(screen.getByText("cleanup")).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText("job…"), "cleanup");

    expect(screen.getByText("cleanup")).toBeInTheDocument();
    expect(screen.queryByText("nightly-export")).not.toBeInTheDocument();
    expect(screen.queryByText("sync-users")).not.toBeInTheDocument();
  });
});
