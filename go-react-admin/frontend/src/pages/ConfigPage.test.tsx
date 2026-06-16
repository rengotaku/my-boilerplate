import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { ConfigPage } from "./ConfigPage";

describe("ConfigPage", () => {
  it("renders config as key/value rows", async () => {
    render(<ConfigPage />);

    await waitFor(() => {
      expect(screen.getByText("file:admin.db")).toBeInTheDocument();
    });
    expect(screen.getByText("/var/log/admin")).toBeInTheDocument();
    expect(screen.getByText("Worker interval (s)")).toBeInTheDocument();
  });
});
