import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { FormSample } from "./FormSample";

const renderFormSample = () => {
  return render(
    <BrowserRouter>
      <FormSample />
    </BrowserRouter>
  );
};

describe("FormSample", () => {
  it("renders the form heading", () => {
    renderFormSample();

    expect(screen.getByRole("heading", { name: /Contact Form/i })).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    renderFormSample();

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    renderFormSample();

    expect(screen.getByRole("button", { name: /Submit/i })).toBeInTheDocument();
  });

  it("shows validation error for empty name", async () => {
    const user = userEvent.setup();
    renderFormSample();

    const submitButton = screen.getByRole("button", { name: /Submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });

  it("does not show success message with invalid email", async () => {
    const user = userEvent.setup();
    renderFormSample();

    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const messageInput = screen.getByLabelText(/Message/i);

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "not-an-email");
    await user.type(messageInput, "This is a valid message.");

    const submitButton = screen.getByRole("button", { name: /Submit/i });
    await user.click(submitButton);

    // Wait a bit for form processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Success message should not appear with invalid data
    expect(screen.queryByText(/Thank you for your message/i)).not.toBeInTheDocument();
  });

  it("shows validation error for short message", async () => {
    const user = userEvent.setup();
    renderFormSample();

    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const messageInput = screen.getByLabelText(/Message/i);

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(messageInput, "Hi");

    const submitButton = screen.getByRole("button", { name: /Submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Message must be at least 10 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("shows success message on valid submission", async () => {
    const user = userEvent.setup();
    renderFormSample();

    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const messageInput = screen.getByLabelText(/Message/i);

    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(messageInput, "This is a valid test message.");

    const submitButton = screen.getByRole("button", { name: /Submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Thank you for your message/i)).toBeInTheDocument();
    });
  });
});
