import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { WorkspaceLoader } from "./workspace-loader";

vi.mock("./workspace", () => { throw new Error("Failed to fetch dynamically imported module"); });

it("offers reload when the workspace chunk fails instead of leaving a blank app", async () => {
  const location = Object.getOwnPropertyDescriptor(window, "location")!;
  const reload = vi.fn();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  Object.defineProperty(window, "location", { configurable: true, value: { reload } });
  try {
    render(<WorkspaceLoader />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Vui lòng tải lại");
    fireEvent.click(screen.getByRole("button", { name: "Tải lại" }));
    expect(reload).toHaveBeenCalledTimes(1);
  } finally {
    Object.defineProperty(window, "location", location);
    consoleError.mockRestore();
  }
});
