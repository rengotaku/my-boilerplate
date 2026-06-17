import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/test-utils";
import { ConfigPage } from "./ConfigPage";

describe("ConfigPage", () => {
  it("shows env values read-only and toml values as editable inputs", async () => {
    render(<ConfigPage />);

    // env value is rendered as static text (read-only)
    await waitFor(() => {
      expect(screen.getByText("file:admin.db")).toBeInTheDocument();
    });

    // both env and toml source badges are present
    expect(screen.getAllByText("env").length).toBeGreaterThan(0);
    expect(screen.getAllByText("toml").length).toBeGreaterThan(0);

    // editable toml value is rendered as an input seeded with the server value
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.some((el) => (el as HTMLInputElement).value === "30s")).toBe(true);
  });

  it("saves edited toml and reveals the restart banner", async () => {
    const user = userEvent.setup();
    render(<ConfigPage />);

    const input = await screen.findByDisplayValue("30s");
    await user.clear(input);
    await user.type(input, "45s");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Restart/ })).toBeInTheDocument();
    });
  });
});

describe("ConfigPage time zone", () => {
  it("shows Time zone as an editable field seeded from config", async () => {
    render(<ConfigPage />);
    const input = await screen.findByDisplayValue("Asia/Tokyo");
    expect(input).toBeInTheDocument();
  });
});
