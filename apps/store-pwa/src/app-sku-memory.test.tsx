import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";

import { App } from "./app";
import { DEMO_RECORDS } from "./demo-records";
import { processEvidencePhoto } from "./image-processing";
import { loadPilotRecords, resetPilotDatabaseForTests, savePilotRecord } from "./record-store";

vi.hoisted(() => vi.stubEnv("MODE", "production"));
vi.mock("./image-processing", () => ({ processEvidencePhoto: vi.fn() }));
vi.mock("./record-store", async (original) => {
  const module = await original<typeof import("./record-store")>();
  return { ...module, savePilotRecord: vi.fn(module.savePilotRecord) };
});
vi.mock("./storage-health", async (original) => ({
  ...await original<typeof import("./storage-health")>(),
  readStorageHealth: vi.fn().mockResolvedValue({ persistent: false, quota: null, usage: null }),
  requestPersistentStorage: vi.fn().mockResolvedValue({ persistent: false, quota: null, usage: null }),
}));
const originalCreateUrl = URL.createObjectURL;
const originalRevokeUrl = URL.revokeObjectURL;

beforeEach(async () => {
  vi.clearAllMocks();
  await resetPilotDatabaseForTests();
  URL.createObjectURL = vi.fn(() => "blob:synthetic-sku-memory");
  URL.revokeObjectURL = vi.fn();
  vi.mocked(processEvidencePhoto).mockResolvedValue({ blob: new Blob(["synthetic stamped JPEG"], { type: "image/jpeg" }), capturedAt: new Date(), width: 640, height: 480 });
  await savePilotRecord({ ...DEMO_RECORDS[0]!, id: "synthetic-old", sku: "000123", productName: "Tên tổng hợp cũ", supplier: "NCC tổng hợp cũ", createdAt: "2000-01-01T00:00:00Z", photos: [] });
});
afterEach(() => { cleanup(); URL.createObjectURL = originalCreateUrl; URL.revokeObjectURL = originalRevokeUrl; });
afterAll(() => vi.unstubAllEnvs());

async function openForm(kind: "TPCN" | "TPTS" = "TPCN") {
  const button = screen.getByRole("button", { name: kind === "TPCN" ? "Tạo phiếu TP khô & khác" : "Tạo phiếu TP tươi sống" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}
function complete(code: string) {
  const barcode = screen.getByRole("textbox", { name: "Mã SKU / UPC" });
  fireEvent.change(barcode, { target: { value: code } });
  fireEvent.blur(barcode);
}
async function prepareEvidence() {
  fireEvent.change(screen.getByRole("textbox", { name: "Tên người nhập" }), { target: { value: "Người kiểm thử" } });
  const picker = screen.getByText("Chọn ảnh").closest("label")!.querySelector("input")!;
  fireEvent.change(picker, { target: { files: [new File(["synthetic"], "sku-test.jpg", { type: "image/jpeg" })] } });
  await screen.findByText(/Đã xử lý 1\/3 ảnh/);
}

it("learns a correction only after a successful save and reuses it after real IndexedDB rehydration", async () => {
  const view = render(<App />);
  await openForm();
  complete("000123");
  expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("Tên tổng hợp cũ");
  fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Tên tổng hợp đã sửa" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Nhà cung cấp" }), { target: { value: "NCC tổng hợp đã sửa" } });
  await prepareEvidence();
  fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(await loadPilotRecords()).toHaveLength(2);
  view.unmount();
  render(<App />);
  await openForm();
  complete("000123");
  expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("Tên tổng hợp đã sửa");
  expect(screen.getByRole("textbox", { name: "Nhà cung cấp" })).toHaveValue("NCC tổng hợp đã sửa");
});

it.each(["cancel", "failure"])("does not learn an unsaved new code after %s", async (outcome) => {
  const view = render(<App />);
  await openForm();
  complete("NEW-123");
  fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Tên chưa lưu" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Nhà cung cấp" }), { target: { value: "NCC chưa lưu" } });
  if (outcome === "cancel") fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
  else {
    await prepareEvidence();
    vi.mocked(savePilotRecord).mockRejectedValueOnce(new Error("Synthetic write failed"));
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));
    expect(await screen.findByText("Synthetic write failed")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("Tên chưa lưu");
  }
  view.unmount();
  expect(await loadPilotRecords()).toHaveLength(1);
  render(<App />);
  await openForm();
  complete("NEW-123");
  expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("");
  expect(screen.getByRole("textbox", { name: "Nhà cung cấp" })).toHaveValue("");
});

it.each(["TPCN", "TPTS"] as const)("flushes %s completion when Enter submits before blur or the typing pause", async (kind) => {
  const code = kind === "TPCN" ? "000123" : "2912345612345";
  if (kind === "TPTS") await savePilotRecord({ ...DEMO_RECORDS[0]!, id: "synthetic-tpts", kind, sku: code, productName: "Tên tổng hợp cũ", supplier: "NCC tổng hợp cũ", createdAt: "2000-01-01T00:00:00Z", photos: [] });
  render(<App />);
  await openForm(kind);
  await prepareEvidence();
  fireEvent.change(screen.getByRole("textbox", { name: "Mã SKU / UPC" }), { target: { value: code } });
  expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("");
  fireEvent.submit(screen.getByRole("button", { name: "Lưu phiếu" }).closest("form")!);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  const saved = (await loadPilotRecords()).find((record) => !record.id.startsWith("synthetic-"));
  expect(saved).toMatchObject({ kind, sku: code, productName: "Tên tổng hợp cũ", supplier: "NCC tổng hợp cũ", quantityValue: kind === "TPTS" ? 1.234 : 1, unit: kind === "TPTS" ? "kg" : "EA" });
});
