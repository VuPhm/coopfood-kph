import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreOnlineApp } from "./store-online-app";
import { OnlineApiError } from "./online-kph";
import type { StoreSessionGateway } from "./store-session-api";
import type { RecordView } from "./record-view";
const session = { user: { id: "actor-real", username: "region", displayName: "Người dùng thật", globalRoles: [], stores: [] }, csrfToken: "synthetic" };
const store = { id: "scope-real", code: "001", name: "Cửa hàng thật", capabilities: ["VIEW", "CREATE"] as ("VIEW" | "CREATE")[] };
function gateway(): StoreSessionGateway {
  return { date: { listStores: vi.fn().mockResolvedValue([]), list: vi.fn(), detail: vi.fn(), create: vi.fn(), update: vi.fn(), scheduleReminder: vi.fn(), process: vi.fn(), suggest: vi.fn().mockResolvedValue([]) }, reviewRecord: vi.fn(), prepareExport: vi.fn(), getSession: vi.fn().mockResolvedValue(session), listStoreAccess: vi.fn().mockResolvedValue([store]), login: vi.fn(), logout: vi.fn(), changePassword: vi.fn(), lookupBarcode: vi.fn().mockResolvedValue({ status: "NOT_FOUND", barcode: "000123" }), createRecord: vi.fn().mockResolvedValue({ id: "saved" } as RecordView), loadHistory: vi.fn().mockResolvedValue({ records: [], page: 1, pageSize: 25, totalItems: 0, totalPages: 0, typeTotals: { TPCN: 0, TPTS: 0 } }) };
}
async function open(api: StoreSessionGateway) {
  window.history.replaceState(null, "", "#kph"); render(<StoreOnlineApp gateway={api} />);
  fireEvent.click(await screen.findByRole("button", { name: "001 · Cửa hàng thật" }));
  fireEvent.click(await screen.findByRole("button", { name: "Tạo phiếu TP tươi sống" }));
  return screen.findByRole("textbox", { name: "Tên hàng hóa" });
}
async function attach() {
  const input = screen.getByText("Chọn ảnh").closest("label")!.querySelector("input")!;
  fireEvent.change(input, { target: { files: [new File(["synthetic"], "evidence.png", { type: "image/png", lastModified: 1788922800000 })] } });
  await screen.findByText(/Đã xử lý 1\/3 ảnh/);
}
describe("Fresh online create", () => {
  beforeEach(() => { Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:synthetic") }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() }); });
  it("retains the real form, original files and actor through scope verification; closes draft on revoke", async () => {
    const api = gateway(); const name = await open(api);
    fireEvent.change(name, { target: { value: "Bản nháp thật" } }); await attach();
    expect(screen.getByRole("textbox", { name: "Người phát hiện" })).toHaveValue("Người dùng thật");
    expect(screen.getByRole("textbox", { name: "Người phát hiện" })).toHaveAttribute("readonly");
    let release!: (stores: typeof store[]) => void;
    vi.mocked(api.listStoreAccess).mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(document.querySelector('[data-suspended="true"]')).toBeInTheDocument());
    release([store]);
    await waitFor(() => expect(document.querySelector('[data-suspended="true"]')).not.toBeInTheDocument());
    expect(name).toHaveValue("Bản nháp thật"); expect(screen.getByLabelText("Ảnh đã chọn")).toBeInTheDocument();
    vi.mocked(api.listStoreAccess).mockResolvedValue([]); fireEvent(window, new Event("hashchange"));
    await screen.findByRole("heading", { name: "Chọn cửa hàng" }); expect(name).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:synthetic"); expect(api.createRecord).not.toHaveBeenCalled();
  });
  it("reviews before send, retries failure with the same key and refreshes history only after success", async () => {
    const api = gateway(); vi.mocked(api.createRecord).mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValue({ id: "saved" } as RecordView);
    const name = await open(api); fireEvent.change(name, { target: { value: "Hàng nhập tay" } }); await attach();
    fireEvent.click(screen.getByRole("button", { name: "Xem lại" })); await screen.findByRole("button", { name: "Gửi phiếu" }); expect(api.createRecord).not.toHaveBeenCalled();
    const loaded = vi.mocked(api.loadHistory).mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Gửi phiếu" })); await waitFor(() => expect(screen.getByRole("alert", { hidden: false })).toHaveTextContent("Kiểm tra kết nối rồi bấm “Gửi phiếu” để thử lại"));
    await waitFor(() => expect(screen.getByRole("alert", { hidden: false })).toHaveFocus());
    expect(api.loadHistory).toHaveBeenCalledTimes(loaded);
    fireEvent.click(screen.getByRole("button", { name: "Gửi phiếu" })); await screen.findByText("Đã gửi phiếu");
    expect(api.createRecord).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(api.createRecord).mock.calls;
    expect(calls[0]![0]).toBe("scope-real"); expect(calls[1]![1].idempotencyKey).toBe(calls[0]![1].idempotencyKey);
    expect(calls[0]![1].detectedBy).toBe("Người dùng thật"); expect(calls[0]![1].photos[0]!.originalFile.name).toBe("evidence.png");
    await waitFor(() => expect(api.loadHistory).toHaveBeenCalledTimes(loaded + 1));
  });
  it("does not report success on403 and returns to the scope boundary", async () => {
    const api = gateway(); vi.mocked(api.createRecord).mockRejectedValue(new OnlineApiError("denied", 403));
    const name = await open(api); fireEvent.change(name, { target: { value: "Hàng mẫu" } }); await attach();
    fireEvent.click(screen.getByRole("button", { name: "Xem lại" }));
    vi.mocked(api.listStoreAccess).mockResolvedValue([]);
    fireEvent.click(await screen.findByRole("button", { name: "Gửi phiếu" }));
    await screen.findByRole("heading", { name: "Chọn cửa hàng" }); expect(screen.queryByText("Đã gửi phiếu")).not.toBeInTheDocument();
  });
});
