import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";

import { App } from "./app";
import { DEMO_RECORDS } from "./demo-records";
import { downloadKphWorkbook } from "./excel-export";
import { loadPilotRecords, toPilotRecord } from "./record-store";

vi.hoisted(() => vi.stubEnv("MODE", "production"));
vi.mock("./record-store", async (original) => ({ ...await original<typeof import("./record-store")>(), loadPilotRecords: vi.fn() }));
vi.mock("./store-profile", async (original) => {
  const module = await original<typeof import("./store-profile")>();
  return { ...module, loadPilotStoreProfile: vi.fn().mockResolvedValue(module.DEFAULT_STORE_PROFILE) };
});
vi.mock("./storage-health", async (original) => ({
  ...await original<typeof import("./storage-health")>(),
  readStorageHealth: vi.fn().mockResolvedValue({ persistent: false, quota: null, usage: null }),
}));
vi.mock("./excel-export", () => ({ downloadKphWorkbook: vi.fn().mockRejectedValue(new Error("Synthetic export ends here")) }));

const records = Array.from({ length: 1_000 }, (_, index) => toPilotRecord({
  ...DEMO_RECORDS[0]!, id: `SYNTHETIC-${index}`, productName: `Sản phẩm thử ${index}`,
  photos: Array.from({ length: 3 }, (_, photoIndex) => ({
    id: `photo-${photoIndex}`, src: "", alt: `Ảnh thử ${photoIndex + 1}`, fileName: `test-${photoIndex + 1}.jpg`,
    blob: new Blob([new Uint8Array([index % 256, photoIndex])], { type: "image/jpeg" }),
  })),
}, "active"));
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadPilotRecords).mockResolvedValue(records);
  let sequence = 0;
  URL.createObjectURL = vi.fn(() => `blob:synthetic-${sequence++}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => { cleanup(); URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; });
afterAll(() => vi.unstubAllEnvs());

it("creates photo URLs only for mounted history and releases them when its view closes", async () => {
  const view = render(<App />);
  await screen.findByText("Đang hiển thị 50/1000 phiếu");
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(150));
  fireEvent.click(within(screen.getByRole("table")).getByRole("checkbox", { name: "Chọn phiếu SYNTHETIC-0" }));
  expect(URL.createObjectURL).toHaveBeenCalledTimes(150);
  fireEvent.click(screen.getByRole("button", { name: "Hiển thị thêm 50 phiếu" }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(300));
  fireEvent.click(screen.getByRole("tab", { name: /TP Tươi sống/ }));
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(300);
  fireEvent.click(screen.getByRole("tab", { name: /TP Khô & khác/ }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(450));
  view.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(450);
}, 30_000);

it("opens the right stamped photo and exports unrendered photos from their stored bytes", async () => {
  render(<App />);
  await screen.findByText("Đang hiển thị 50/1000 phiếu");
  fireEvent.click(screen.getByRole("button", { name: "Xem ảnh minh chứng 2 của phiếu SYNTHETIC-0" }));
  const image = within(screen.getByRole("dialog", { name: "Xem ảnh minh chứng" })).getByAltText("Ảnh thử 2");
  expect(image).toHaveAttribute("src", "blob:synthetic-1");
  fireEvent.keyDown(image, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
  fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
  fireEvent.click(screen.getByRole("button", { name: "Xuất 1000 dòng" }));
  await waitFor(() => expect(downloadKphWorkbook).toHaveBeenCalled());
  const exported = vi.mocked(downloadKphWorkbook).mock.calls[0]![1];
  expect(exported).toHaveLength(1_000);
  expect(exported[999]!.photos.map((photo) => photo.blob)).toEqual(records[999]!.photos.map((photo) => photo.blob));
  expect(exported[999]!.photos.map((photo) => photo.fileName)).toEqual(["test-1.jpg", "test-2.jpg", "test-3.jpg"]);
  expect(URL.createObjectURL).toHaveBeenCalledTimes(150);
}, 30_000);
