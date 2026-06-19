import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router-dom";
import { render, screen, waitFor } from "@/test/test-utils";
import { RunDetailPage } from "./RunDetailPage";

function renderAt(id: number) {
  return render(
    <Routes>
      <Route path="/runs/:id" element={<RunDetailPage />} />
    </Routes>,
    { initialEntries: [`/runs/${id}`] }
  );
}

describe("RunDetailPage", () => {
  it("renders run summary, phases, events and logs", async () => {
    renderAt(1);

    await waitFor(() => {
      expect(screen.getByText(/Run #1/)).toBeInTheDocument();
    });
    // phases
    expect(screen.getByText("extract")).toBeInTheDocument();
    expect(screen.getByText("load")).toBeInTheDocument();
    // event timeline title
    expect(screen.getByText(/phase_started/)).toBeInTheDocument();
    // log message
    expect(screen.getByText("transient read error, retrying")).toBeInTheDocument();
  });
});
