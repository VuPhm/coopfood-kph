import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";

import { App } from "./app";
import { loadPilotRecords, savePilotRecord, toPilotRecord } from "./record-store";
import { requestPersistentStorage } from "./storage-health";

vi.hoisted(() => vi.stubEnv("MODE", "production"));
vi.mock("./record-store", async (importOriginal) => ({
  ...await importOriginal<typeof import("./record-store")>(),
  loadPilotRecords: vi.fn(), savePilotRecord: vi.fn(),
}));
vi.mock("./store-profile", async (importOriginal) => {
  const original = await importOriginal<typeof import("./store-profile")>();
  return { ...original, loadPilotStoreProfile: vi.fn().mockResolvedValue(original.DEFAULT_STORE_PROFILE) };
});
vi.mock("./storage-health", async (importOriginal) => ({
  ...await importOriginal<typeof import("./storage-health")>(),
  readStorageHealth: vi.fn(() => new Promise(() => {})),
  requestPersistentStorage: vi.fn(() => new Promise(() => {})),
}));
vi.mock("./create-record-dialog", () => ({
  CreateRecordDialog: ({ kind, open, onSaved, onOpenChange }: import("react").ComponentProps<typeof import("./create-record-dialog").CreateRecordDialog>) =>
    open ? <button onClick={async () => {
      await onSaved({ kind: kind ?? "TPCN", detectedDate: "13/10/2026", barcode: "00012345", supplier: "NCC thử", productName: "Phiếu thử mới", quantity: 1, unit: "EA", condition: "Cận date", resolution: "HỦY", treatmentDate: "", detectedBy: "Người thử", note: "", photos: [] });
      onOpenChange(false);
    }}>Lưu phiếu thử</button> : null,
}));

beforeEach(() => {
  vi.mocked(loadPilotRecords).mockResolvedValue([]);
  vi.mocked(savePilotRecord).mockImplementation(async (record) => toPilotRecord(record, "active"));
});
afterEach(() => { vi.clearAllMocks(); });
afterAll(() => vi.unstubAllEnvs());

it("opens stored history while quota telemetry is still pending", async () => {
  render(<App />);
  await waitFor(() => expect(screen.queryAllByText("Đang mở dữ liệu trên thiết bị…")).toHaveLength(0));
  expect(screen.getAllByText("Chưa có phiếu nào được lưu trên thiết bị này.")).toHaveLength(2);
});

it.each(["pending", "failed"])("finishes a committed save when storage telemetry is %s", async (state) => {
  if (state === "failed") vi.mocked(requestPersistentStorage).mockRejectedValueOnce(new Error("quota API failed"));
  render(<App />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Tạo phiếu TP khô & khác" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Tạo phiếu TP khô & khác" }));
  fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu thử" }));
  await waitFor(() => expect(screen.getAllByText("Phiếu thử mới")).toHaveLength(2));
  expect(screen.queryByRole("button", { name: "Lưu phiếu thử" })).not.toBeInTheDocument();
  expect(savePilotRecord).toHaveBeenCalledTimes(1);
});
