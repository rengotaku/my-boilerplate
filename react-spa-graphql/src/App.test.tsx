import { render, screen, waitFor } from "@testing-library/react";
import { ApolloProvider } from "@apollo/client";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { createTestApolloClient } from "@/test/test-utils";
import App from "./App";

function renderApp() {
  const client = createTestApolloClient();
  return render(
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}

describe("App", () => {
  it("renders home page by default", () => {
    renderApp();
    expect(screen.getByText("React SPA Boilerplate")).toBeInTheDocument();
  });

  it("navigates to users page", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole("link", { name: "Users" })[0]);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    });
  });

  it("navigates back to home page", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getAllByRole("link", { name: "Users" })[0]);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("link", { name: "Home" }));
    await waitFor(() => {
      expect(screen.getByText("React SPA Boilerplate")).toBeInTheDocument();
    });
  });

  it("shows navigation links", () => {
    renderApp();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Users" }).length).toBeGreaterThan(0);
  });
});
