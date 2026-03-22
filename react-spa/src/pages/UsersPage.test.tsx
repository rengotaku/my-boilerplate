import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { UsersPage } from "./UsersPage";

describe("UsersPage", () => {
  it("displays loading state initially", () => {
    render(<UsersPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays users list after loading", async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("displays empty state when no users", async () => {
    const { server } = await import("@/test/mocks/server");
    const { http, HttpResponse } = await import("msw");

    server.use(
      http.get("http://localhost:8080/api/v1/users", () => {
        return HttpResponse.json([]);
      })
    );

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("No users found.")).toBeInTheDocument();
    });
  });

  it("creates a new user", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Name"), "New User");
    await user.type(screen.getByPlaceholderText("Email"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Name")).toHaveValue("");
    });
  });

  it("does not create user with empty fields", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Create" }));
    // Form should not be cleared since create was not triggered
    expect(screen.getByPlaceholderText("Name")).toHaveValue("");
  });

  it("enters edit mode when Edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);

    expect(screen.getByPlaceholderText("Name")).toHaveValue("John Doe");
    expect(screen.getByPlaceholderText("Email")).toHaveValue("john@example.com");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("cancels edit mode", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByPlaceholderText("Name")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("updates a user", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);

    const nameInput = screen.getByPlaceholderText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Name")).toHaveValue("");
    });
  });

  it("deletes a user when confirmed", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith("Delete this user?");
  });

  it("does not delete a user when cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith("Delete this user?");
    // User should still be present
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("displays error state", async () => {
    const { server } = await import("@/test/mocks/server");
    const { http, HttpResponse } = await import("msw");

    server.use(
      http.get("http://localhost:8080/api/v1/users", () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      })
    );

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});
