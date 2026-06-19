import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/test-utils";
import { JobFormPage } from "./JobFormPage";

function renderForm(entry: string) {
  return render(
    <Routes>
      <Route path="/jobs/new" element={<JobFormPage />} />
      <Route path="/jobs" element={<div>jobs list</div>} />
    </Routes>,
    { initialEntries: [entry] }
  );
}

describe("JobFormPage (create)", () => {
  it("submits a new job and navigates to the jobs list", async () => {
    const user = userEvent.setup();
    renderForm("/jobs/new");

    expect(screen.getByText("New job")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Name" }), "new-job");
    await user.type(screen.getByRole("textbox", { name: "Schedule" }), "@hourly");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("jobs list")).toBeInTheDocument();
    });
  });
});
