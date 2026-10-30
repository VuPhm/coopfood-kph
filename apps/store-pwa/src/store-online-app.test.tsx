import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreOnlineApp } from "./store-online-app";
import { OnlineApiError } from "./online-kph";
import type { StoreSessionGateway } from "./store-session-api";

const employee = { id: "store-a", code: "0001", name: "Cửa hàng A", kph: { view: true, create: true, review: false, export: false } };
const manager = { ...employee, id: "store-b", code: "0002", name: "Cửa hàng B", kph: { view: true, create: true, review: true, export: true } };
const session = { user: { id: "user", username: "test", displayName: "Người kiểm thử", globalRoles: [], stores: [] }, csrfToken: "synthetic" };
function gateway(): StoreSessionGateway {
  return { getSession: vi.fn().mockResolvedValue(session), listStoreAccess: vi.fn().mockResolvedValue([employee, manager]), login: vi.fn().mockResolvedValue(session), logout: vi.fn().mockResolvedValue(undefined), changePassword: vi.fn().mockResolvedValue(undefined), lookupBarcode: vi.fn(), loadHistory: vi.fn().mockResolvedValue({ records: [], page: 1, pageSize: 25, totalItems: 0, totalPages: 0, typeTotals: { TPCN: 0, TPTS: 0 } }) };
}
async function selectA() { fireEvent.click(await screen.findByRole("button", { name: "0001 · Cửa hàng A" })); await screen.findByRole("button", { name: "KPH" }); }
describe("Store online session", () => {
  it("uses effective stores with no synthetic membership and switches scope without old content", async () => {
    render(<StoreOnlineApp gateway={gateway()} />); await selectA();
    expect(screen.queryByRole("button", { name: "Duyệt phiếu" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    fireEvent.click(screen.getByRole("button", { name: "Đổi cửa hàng" }));
    fireEvent.click(await screen.findByRole("button", { name: "0002 · Cửa hàng B" }));
    await screen.findByRole("heading", { name: "Cửa hàng B" }); expect(screen.queryByRole("heading", { name: "Cửa hàng A" })).not.toBeInTheDocument();
  });
  it("removes revoked store at the next refresh and does not select another store automatically", async () => {
    const api = gateway(); render(<StoreOnlineApp gateway={api} />); await selectA();
    vi.mocked(api.listStoreAccess).mockResolvedValue([manager]);
    fireEvent(window, new Event("hashchange"));
    await screen.findByRole("heading", { name: "Chọn cửa hàng" });
    expect(document.querySelector(".store-app")).not.toBeInTheDocument();
  });
  it("hides all previous scope on network failure, retries, and clears selection", async () => {
    const api = gateway(); render(<StoreOnlineApp gateway={api} />); await selectA();
    vi.mocked(api.listStoreAccess).mockRejectedValue(new TypeError("offline")); fireEvent(window, new Event("hashchange"));
    await screen.findByRole("alert"); expect(document.querySelector(".store-app")).not.toBeInTheDocument();
    vi.mocked(api.listStoreAccess).mockResolvedValue([employee]); fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await screen.findByRole("heading", { name: "Chọn cửa hàng" });
  });
  it("requires login after expiry and sends entered credentials without trimming password", async () => {
    const api = gateway(); vi.mocked(api.getSession).mockRejectedValue(new OnlineApiError("expired", 401));
    render(<StoreOnlineApp gateway={api} />);
    fireEvent.change(await screen.findByLabelText("Tên đăng nhập"), { target: { value: "test" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: " password with spaces " } });
    vi.mocked(api.getSession).mockResolvedValue(session);
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await screen.findByRole("heading", { name: "Chọn cửa hàng" });
    expect(api.login).toHaveBeenCalledWith("test", " password with spaces ");
    expect(screen.queryByText("Vào bản dùng thử")).not.toBeInTheDocument();
  });
  it("handles no effective stores and logs out through the gateway", async () => {
    const api = gateway(); vi.mocked(api.listStoreAccess).mockResolvedValue([]); render(<StoreOnlineApp gateway={api} />);
    await screen.findByText("Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.");
    vi.mocked(api.getSession).mockRejectedValue(new OnlineApiError("expired", 401));
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await screen.findByLabelText("Tên đăng nhập"); await waitFor(() => expect(api.logout).toHaveBeenCalledOnce());
  });
  it("keeps the workspace and draft mounted during coalesced background scope refresh", async () => {
    const api = gateway(); vi.mocked(api.lookupBarcode).mockResolvedValue({ status: "NOT_FOUND", barcode: "000000" });
    render(<StoreOnlineApp gateway={api} />); await selectA();
    fireEvent.click(screen.getByRole("button", { name: "Tra mã hàng" }));
    await screen.findByLabelText("Barcode", { exact: true });
    fireEvent.change(screen.getByLabelText("Barcode", { exact: true }), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    fireEvent.click(await screen.findByRole("button", { name: "Nhập tay" }));
    const input = screen.getByLabelText("Tên sản phẩm"); fireEvent.change(input, { target: { value: "Đang nhập" } });
    let release!: (value: typeof session) => void;
    vi.mocked(api.getSession).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const before = vi.mocked(api.getSession).mock.calls.length;
    fireEvent(window, new Event("focus")); fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(api.getSession).toHaveBeenCalledTimes(before + 1));
    expect(screen.getByLabelText("Tên sản phẩm")).toBe(input); expect(input).toHaveValue("Đang nhập");
    expect(document.querySelector(".store-app")).toHaveAttribute("aria-busy", "true");
    await act(async () => release(session));
    await waitFor(() => expect(document.querySelector(".store-app")).not.toHaveAttribute("aria-busy"));
    expect(screen.getByLabelText("Tên sản phẩm")).toBe(input); expect(input).toHaveValue("Đang nhập");
  });

});
