import { describe, it, expect, vi } from "vitest";
import { Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/mocks/server";
import { JobFormPage } from "./JobFormPage";

function renderForm(entry: string) {
  return render(
    <Routes>
      <Route path="/jobs/new" element={<JobFormPage />} />
      <Route path="/jobs/:id/edit" element={<JobFormPage />} />
      <Route path="/jobs" element={<div>jobs list</div>} />
    </Routes>,
    { initialEntries: [entry] }
  );
}

// Give a rejected submit a beat to reach the network before asserting it did not.
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("JobFormPage (create)", () => {
  it("submits a new job and navigates to the jobs list", async () => {
    const user = userEvent.setup();
    renderForm("/jobs/new");

    expect(screen.getByText("New job")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /Name/ }), "new-job");
    await user.type(screen.getByRole("textbox", { name: /Schedule/ }), "@hourly");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("jobs list")).toBeInTheDocument();
    });
  });

  it("requires Name and Schedule natively", () => {
    renderForm("/jobs/new");

    expect(screen.getByRole("textbox", { name: /Name/ })).toHaveAttribute("required");
    expect(screen.getByRole("textbox", { name: /Schedule/ })).toHaveAttribute("required");
  });

  it("does not call the create API when Name is empty", async () => {
    const user = userEvent.setup();
    const createApi = vi.fn();
    server.use(
      http.post("*/api/jobs", () => {
        createApi();
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderForm("/jobs/new");
    await user.type(screen.getByRole("textbox", { name: /Schedule/ }), "@hourly");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await settle();

    expect(createApi).not.toHaveBeenCalled();
    expect(screen.getByText("New job")).toBeInTheDocument();
  });

  it("does not call the create API when Schedule is empty", async () => {
    const user = userEvent.setup();
    const createApi = vi.fn();
    server.use(
      http.post("*/api/jobs", () => {
        createApi();
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderForm("/jobs/new");
    await user.type(screen.getByRole("textbox", { name: /Name/ }), "new-job");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await settle();

    expect(createApi).not.toHaveBeenCalled();
    expect(screen.getByText("New job")).toBeInTheDocument();
  });
});

describe("JobFormPage (edit)", () => {
  it("does not call the update API when Name is empty", async () => {
    const user = userEvent.setup();
    const updateApi = vi.fn();
    server.use(
      http.put("*/api/jobs/:id", () => {
        updateApi();
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderForm("/jobs/10/edit");
    const nameInput = await screen.findByDisplayValue("nightly-export");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await settle();

    expect(updateApi).not.toHaveBeenCalled();
  });

  it("does not call the update API when Schedule is empty", async () => {
    const user = userEvent.setup();
    const updateApi = vi.fn();
    server.use(
      http.put("*/api/jobs/:id", () => {
        updateApi();
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderForm("/jobs/10/edit");
    const scheduleInput = await screen.findByDisplayValue("0 2 * * *");
    await user.clear(scheduleInput);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await settle();

    expect(updateApi).not.toHaveBeenCalled();
  });
});
