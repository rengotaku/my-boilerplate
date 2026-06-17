import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router-dom";
import { render, screen, waitFor } from "@/test/test-utils";
import { JobDetailPage } from "./JobDetailPage";

function renderDetail(id: number) {
  return render(
    <Routes>
      <Route path="/jobs/:id" element={<JobDetailPage />} />
    </Routes>,
    { initialEntries: [`/jobs/${id}`] }
  );
}

describe("JobDetailPage", () => {
  it("shows job info and its run history", async () => {
    renderDetail(10);

    await waitFor(() => {
      expect(screen.getByText("nightly-export")).toBeInTheDocument();
    });
    expect(screen.getByText("0 2 * * *")).toBeInTheDocument();
    expect(screen.getByText("enabled")).toBeInTheDocument();
    expect(screen.getByText("Run history")).toBeInTheDocument();

    // Run #1 belongs to job 10 (jobId 10).
    await waitFor(() => {
      expect(screen.getByText("succeeded")).toBeInTheDocument();
    });
  });

  it("shows an error for an unknown job id", async () => {
    renderDetail(404);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load job/)).toBeInTheDocument();
    });
  });
});
