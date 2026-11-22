import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreOnlineApp } from "./store-online-app";
import { OnlineApiError } from "./online-kph";
import type { StoreSessionGateway } from "./store-session-api";

const employee = { id: "store-a", code: "0001", name: "Cửa hàng A", capabilities: ["VIEW", "CREATE"] as ("VIEW" | "CREATE" | "REVIEW" | "EXPORT")[] };
const manager = { ...employee, id: "store-b", code: "0002", name: "Cửa hàng B", capabilities: ["VIEW", "CREATE", "REVIEW", "EXPORT"] as ("VIEW" | "CREATE" | "REVIEW" | "EXPORT")[] };
const session = { user: { id: "user", username: "test", displayName: "Người kiểm thử", globalRoles: [], stores: [] }, csrfToken: "synthetic" };
function gateway(): StoreSessionGateway {
  return { reviewRecord: vi.fn(), prepareExport: vi.fn(), createRecord: vi.fn(), lookupBarcode: vi.fn(), loadHistory: vi.fn(), getSession: vi.fn().mockResolvedValue(session), listStoreAccess: vi.fn().mockResolvedValue([employee, manager]), login: vi.fn().mockResolvedValue(session), logout: vi.fn().mockResolvedValue(undefined), changePassword: vi.fn().mockResolvedValue(undefined) };
}
async function selectA() { fireEvent.click(await screen.findByRole("button", { name: "0001 · Cửa hàng A" })); await screen.findByRole("heading", { name: "Công việc cửa hàng" }); }
beforeEach(() => { window.history.replaceState(null, "", "#home"); });
describe("Store online session", () => {
  it("keeps the same login draft through a pending background check and network failure", async () => {
    const api = gateway();
    vi.mocked(api.getSession).mockRejectedValue(new OnlineApiError("expired", 401));
    render(<StoreOnlineApp gateway={api} />);
    const username = await screen.findByLabelText("Tên đăng nhập");
    const password = screen.getByLabelText("Mật khẩu");
    fireEvent.change(username, { target: { value: "draft-user" } });
    fireEvent.change(password, { target: { value: " synthetic draft " } });
    let reject!: (error: Error) => void;
    vi.mocked(api.getSession).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    const before = vi.mocked(api.getSession).mock.calls.length;
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(api.getSession).toHaveBeenCalledTimes(before + 1));
    expect(screen.getByLabelText("Mật khẩu")).toBe(password);
    await act(async () => reject(new Error("offline")));
    expect(screen.getByLabelText("Tên đăng nhập")).toBe(username);
    expect(password).toHaveValue(" synthetic draft ");
    expect(username).toHaveValue("draft-user");
  });


  it("switches to an inherited store with export capability and no review capability", async () => {
    const api = gateway();
    const assigned = { id: employee.id, code: employee.code, name: employee.name, role: "EMPLOYEE" as const };
    vi.mocked(api.getSession).mockResolvedValue({ ...session, user: { ...session.user, stores: [assigned] } });
    vi.mocked(api.listStoreAccess).mockResolvedValue([employee, { ...manager, capabilities: ["VIEW", "CREATE", "EXPORT"] }]);
    render(<StoreOnlineApp gateway={api} />); await selectA();
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    expect(screen.getByText("Xem phiếu")).toBeInTheDocument(); expect(screen.queryByText("Duyệt phiếu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đổi cửa hàng" }));
    fireEvent.click(await screen.findByRole("button", { name: "0002 · Cửa hàng B" }));
    await screen.findByRole("heading", { name: "Công việc cửa hàng" }); fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    expect(await screen.findByText("Xuất phiếu")).toBeVisible();
    expect(screen.queryByText("Duyệt phiếu")).not.toBeInTheDocument();
    expect(screen.queryByText("Mã cửa hàng · 0001")).not.toBeInTheDocument();
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
  it("updates a manager downgrade in place and hides old capabilities while revalidating", async () => {
    const api = gateway();
    vi.mocked(api.listStoreAccess).mockResolvedValue([{ ...employee, capabilities: manager.capabilities }]);
    render(<StoreOnlineApp gateway={api} />); await selectA();
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    expect(screen.getByText("Duyệt phiếu")).toBeInTheDocument();
    let resolve!: (value: Awaited<ReturnType<StoreSessionGateway["listStoreAccess"]>>) => void;
    const pending = new Promise<Awaited<ReturnType<StoreSessionGateway["listStoreAccess"]>>>(done => { resolve = done; });
    vi.mocked(api.listStoreAccess).mockReturnValueOnce(pending);
    fireEvent(window, new Event("focus"));
    await screen.findByText("Đang xác minh phiên và quyền cửa hàng…");
    expect(screen.getByRole("navigation", { name: "Điều hướng chính trên mobile", hidden: true })).toBeVisible();
    expect(screen.queryByText("Duyệt phiếu")).not.toBeInTheDocument();
    resolve([employee]);
    expect(await screen.findByRole("heading", { name: "Người kiểm thử" })).toBeInTheDocument();
    expect(screen.getByText("Xem phiếu")).toBeVisible();
    expect(screen.queryByText("Duyệt phiếu")).not.toBeInTheDocument();
  });
  it("shows explicit unavailable states on unwired routes instead of mock operational data", async () => {
    render(<StoreOnlineApp gateway={gateway()} />); await selectA();
    window.history.replaceState(null, "", "#reports"); fireEvent(window, new Event("hashchange"));
    await screen.findByText(/chưa được kết nối trong phiên online/);
    expect(screen.queryByText("Vào bản dùng thử")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo lô" })).not.toBeInTheDocument();
    window.history.replaceState(null, "", "#home");
  });
  it("opens the compact DATE workspace with real lookup and manual session intake", async () => {
    const api = gateway();
    render(<StoreOnlineApp gateway={api} />); await selectA();
    fireEvent.click(screen.getByRole("button", { name: "Quản lý DATE" }));
    await screen.findByRole("heading", { name: "Lô DATE" });
    expect(screen.getByRole("region", { name: "Danh sách lô DATE" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm theo dõi DATE" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Lọc DATE" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Quét / tra mã hàng" })).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(0);
    expect(screen.queryByText("Cải thìa VietGAP 500 g")).not.toBeInTheDocument();
    expect(api.lookupBarcode).not.toHaveBeenCalled();
    expect(api.createRecord).not.toHaveBeenCalled();
    window.history.replaceState(null, "", "#home");
  });
  it("keeps manually added DATE lots in the selected store session only", async () => {
    const api = gateway(); render(<StoreOnlineApp gateway={api} />); await selectA();
    fireEvent.click(screen.getByRole("button", { name: "Quản lý DATE" }));
    fireEvent.click(await screen.findByRole("button", { name: "Thêm theo dõi DATE" }));
    await screen.findByRole("heading", { name: "Thêm theo dõi DATE" });
    fireEvent.change(await screen.findByLabelText(/SKU/), { target: { value: "000045" } });
    fireEvent.change(await screen.findByLabelText(/Tên hàng/), { target: { value: "Lô kiểm thử cửa hàng A" } });
    fireEvent.change(await screen.findByLabelText(/Số lô/), { target: { value: "LOT-A-ONLY" } });
    fireEvent.change(await screen.findByLabelText(/NSX/), { target: { value: "01/11/2026" } });
    fireEvent.change(await screen.findByLabelText(/HSD/), { target: { value: "30/11/2026" } });
    let release!: (stores: typeof employee[]) => void;
    vi.mocked(api.listStoreAccess).mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
    fireEvent(window, new Event("focus"));
    await screen.findByText("Đang xác minh phiên và quyền cửa hàng…");
    expect(screen.queryByDisplayValue("Lô kiểm thử cửa hàng A")).not.toBeInTheDocument();
    release([employee, manager]);
    expect(await screen.findByDisplayValue("Lô kiểm thử cửa hàng A")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Lưu lô trong phiên" }));
    expect(await screen.findByRole("button", { name: /Lô kiểm thử cửa hàng A/ })).toBeVisible();
    expect(document.querySelectorAll('[data-date-lot-id="LOT-A-ONLY"]')).toHaveLength(1);
    expect(api.createRecord).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    fireEvent.click(screen.getByRole("button", { name: "Đổi cửa hàng" }));
    fireEvent.click(await screen.findByRole("button", { name: "0002 · Cửa hàng B" }));
    await screen.findByRole("heading", { name: "Lô DATE" });
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(0);
    expect(screen.queryByText("Lô kiểm thử cửa hàng A")).not.toBeInTheDocument();
    window.history.replaceState(null, "", "#home");
  });
  it("handles no effective stores and logs out through the gateway", async () => {
    const api = gateway(); vi.mocked(api.listStoreAccess).mockResolvedValue([]); render(<StoreOnlineApp gateway={api} />);
    await screen.findByText("Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.");
    vi.mocked(api.getSession).mockRejectedValue(new OnlineApiError("expired", 401));
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await screen.findByLabelText("Tên đăng nhập"); await waitFor(() => expect(api.logout).toHaveBeenCalledOnce());
  });
  it("retains manual input through a masked scope refresh and closes it on revoke", async () => {
    const api = gateway();
    vi.mocked(api.lookupBarcode).mockResolvedValue({ status: "NOT_FOUND", barcode: "000123" });
    render(<StoreOnlineApp gateway={api} />); await selectA();
    fireEvent.click(screen.getByRole("button", { name: "Quản lý DATE" }));
    fireEvent.click(await screen.findByRole("button", { name: "Quét / tra mã hàng" }));
    fireEvent.change(await screen.findByLabelText("Barcode"), { target: { value: "000123" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    fireEvent.click(await screen.findByRole("button", { name: "Nhập tay" }));
    const input = screen.getByLabelText("Tên sản phẩm");
    fireEvent.change(input, { target: { value: "Bản nháp chưa lưu" } });
    let release!: (value: typeof employee[]) => void;
    vi.mocked(api.listStoreAccess).mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
    fireEvent(window, new Event("focus"));
    await screen.findByText("Đang xác minh phiên và quyền cửa hàng…");
    expect(input.closest("[inert]")).toHaveAttribute("aria-hidden", "true");
    release([employee]);
    await waitFor(() => expect(input).toBeVisible());
    expect(input).toHaveValue("Bản nháp chưa lưu");
    vi.mocked(api.listStoreAccess).mockResolvedValue([]);
    fireEvent(window, new Event("hashchange"));
    await screen.findByRole("heading", { name: "Chọn cửa hàng" });
    expect(input).not.toBeInTheDocument();
    window.history.replaceState(null, "", "#home");
  });

  it("requires explicit selection when the session actor changes in the same store", async () => {
    const api = gateway(); render(<StoreOnlineApp gateway={api} />); await selectA();
    vi.mocked(api.getSession).mockResolvedValue({ ...session, user: { ...session.user, id: "other-user", displayName: "Người khác" } });
    fireEvent(window, new Event("hashchange"));
    await screen.findByRole("heading", { name: "Chọn cửa hàng" });
    expect(screen.queryByRole("heading", { name: "Quyền hàng không phù hợp" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "0001 · Cửa hàng A" }));
    await screen.findByRole("heading", { name: "Công việc cửa hàng" });
    expect(screen.getByRole("heading", { name: "Người khác" })).toBeInTheDocument();
  });

});
