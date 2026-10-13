import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { PinGate } from "./pin-gate";
import { resetPilotDatabaseForTests } from "./record-store";
import { WorkspaceLoader } from "./workspace-loader";

const boot = vi.hoisted(() => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  return { requested: vi.fn(), ready, release: () => release() };
});

vi.mock("./workspace", async () => {
  boot.requested();
  await boot.ready;
  return { default: () => <div>Workspace đã tải</div> };
});

afterEach(() => vi.restoreAllMocks());

it("loads the workspace only after a valid PIN and shows feedback while the chunk is pending", async () => {
  await resetPilotDatabaseForTests();
  render(<PinGate><WorkspaceLoader /></PinGate>);
  expect(boot.requested).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Mã truy cập"), { target: { value: "9999" } });
  expect(await screen.findByRole("alert")).toHaveTextContent("Mã truy cập chưa đúng");
  expect(boot.requested).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText("Mã truy cập"), { target: { value: "0000" } });
  expect(await screen.findByRole("status")).toHaveTextContent("Đang mở ứng dụng…");
  await waitFor(() => expect(boot.requested).toHaveBeenCalledTimes(1));
  await act(async () => boot.release());
  expect(await screen.findByText("Workspace đã tải")).toBeVisible();
  expect(screen.queryByLabelText("Mã truy cập")).not.toBeInTheDocument();
});
