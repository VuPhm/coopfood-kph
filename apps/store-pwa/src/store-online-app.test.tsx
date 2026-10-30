import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreOnlineApp } from "./store-online-app";
import { OnlineApiError } from "./online-kph";
import type { StoreSessionGateway } from "./store-session-api";

const employee = { id: "store-a", code: "0001", name: "Cửa hàng A", kph: { view: true, create: true, review: false, export: false } };
const manager = { ...employee, id: "store-b", code: "0002", name: "Cửa hàng B", kph: { view: true, create: true, review: true, export: true } };
const session = { user: { id: "user", username: "test", displayName: "Người kiểm thử", globalRoles: [], stores: [] }, csrfToken: "synthetic" };
function gateway(): StoreSessionGateway {
  return { getSession: vi.fn().mockResolvedValue(session), listStoreAccess: vi.fn().mockResolvedValue([employee, manager]), login: vi.fn().mockResolvedValue(session), logout: vi.fn().mockResolvedValue(undefined), changePassword: vi.fn().mockResolvedValue(undefined), lookupBarcode: vi.fn() };
}
async function selectA() { fireEvent.click(await screen.findByRole("button", { name: "0001 · Cửa hàng A" })); await screen.findByRole("heading", { name: "Quyền hàng không phù hợp" }); }
describe("Store online session", () => {
  it("uses effective stores with no synthetic membership and switches scope without old content", async () => {
    render(<StoreOnlineApp gateway={gateway()} />); await selectA();
    expect(screen.getByText("Xem phiếu")).toBeInTheDocument(); expect(screen.queryByText("Duyệt phiếu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    fireEvent.click(screen.getByRole("button", { name: "Đổi cửa hàng" }));
    fireEvent.click(await screen.findByRole("button", { name: "0002 · Cửa hàng B" }));
    await screen.findByText("Duyệt phiếu"); expect(screen.queryByText("Mã cửa hàng · 0001")).not.toBeInTheDocument();
  });
  it("removes revoked store at the next refresh and does not select another store automatically", async () => {
    const api = gateway(); render(<StoreOnlineApp gateway={api} />); await selectA();
    vi.mocked(api.listStoreAccess).mockResolvedValue([manager]);
    fireEvent(window, new Event("hashchange"));
    await screen.findByRole("heading", { name: "Chọn cửa hàng" });
    expect(screen.queryByText("Mã cửa hàng · 0001")).not.toBeInTheDocument(); expect(screen.queryByText("Duyệt phiếu")).not.toBeInTheDocument();
  });
  it("hides all previous scope on network failure, retries, and clears selection", async () => {
    const api = gateway(); render(<StoreOnlineApp gateway={api} />); await selectA();
    vi.mocked(api.listStoreAccess).mockRejectedValue(new TypeError("offline")); fireEvent(window, new Event("hashchange"));
    await screen.findByRole("alert"); expect(screen.queryByText("Mã cửa hàng · 0001")).not.toBeInTheDocument();
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
});
