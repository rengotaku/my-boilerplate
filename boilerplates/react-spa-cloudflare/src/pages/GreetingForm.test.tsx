import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { GreetingForm } from "./GreetingForm";

describe("GreetingForm", () => {
  it("renders the heading", () => {
    render(<GreetingForm />);
    expect(screen.getByRole("heading", { name: /Greeting Demo/i })).toBeInTheDocument();
  });

  it("renders name input field", () => {
    render(<GreetingForm />);
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<GreetingForm />);
    expect(screen.getByRole("button", { name: /Say Hello/i })).toBeInTheDocument();
  });

  it("shows validation error for empty name", async () => {
    const user = userEvent.setup();
    render(<GreetingForm />);

    const submitButton = screen.getByRole("button", { name: /Say Hello/i });
    await user.click(submitButton);

    expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
  });

  it("moves focus to the invalid field on submit", async () => {
    const user = userEvent.setup();
    render(<GreetingForm />);

    await user.click(screen.getByRole("button", { name: /Say Hello/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Your Name/i)).toHaveFocus();
    });
  });
});
