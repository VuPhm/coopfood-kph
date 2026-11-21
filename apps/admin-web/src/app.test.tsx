import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import kphPage from "../../../contracts/fixtures/api/kph-page.json";
import schedulesFixture from "../../../contracts/fixtures/api/lifecycle-schedules.json";
import targetsFixture from "../../../contracts/fixtures/api/lifecycle-targets.json";
import catalogImportsFixture from "../../../contracts/fixtures/api/catalog-imports.json";
import catalogDetailFixture from "../../../contracts/fixtures/api/catalog-import-detail.json";
import catalogUploadFixture from "../../../contracts/fixtures/api/catalog-import-upload.json";
import sessionFixture from "../../../contracts/fixtures/api/session.json";
import adminUsersFixture from "../../../contracts/fixtures/api/admin-users.json";
import { App } from "./app";
import type { LifecycleAdminGateway } from "./lifecycle-admin";

const session = {
  ...sessionFixture,
  user: { ...sessionFixture.user, globalRoles: ["CHAIN_ADMIN" as const] },
};
const catalogSession = {
  ...sessionFixture,
  user: { ...sessionFixture.user, globalRoles: ["CATALOG_ADMIN" as const] },
};
const targets = targetsFixture as Awaited<ReturnType<LifecycleAdminGateway["listTargets"]>>;
const futureDate = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);
const schedules = schedulesFixture.map((schedule) => ({ ...schedule, effectiveDate: futureDate })) as Awaited<ReturnType<LifecycleAdminGateway["listSchedules"]>>;
const adminUsers = adminUsersFixture as Awaited<ReturnType<LifecycleAdminGateway["listUsers"]>>;

function gateway(overrides: Partial<LifecycleAdminGateway> = {}): LifecycleAdminGateway {
  return {
    getSession: vi.fn().mockResolvedValue(session),
    login: vi.fn().mockResolvedValue(session),
    logout: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue(undefined),
    listChainKphRecords: vi.fn().mockResolvedValue(kphPage),
    listKphStores: vi.fn().mockResolvedValue([]),
    reviewKphRecord: vi.fn().mockResolvedValue({ ...kphPage.items[0], approvalStatus: "APPROVED" }),
    listTargets: vi.fn().mockResolvedValue(targets),
    listSchedules: vi.fn().mockResolvedValue(schedules),
    createSchedule: vi.fn().mockResolvedValue(schedules[0]),
    reschedule: vi.fn().mockResolvedValue(schedules[0]),
    cancel: vi.fn().mockResolvedValue({ ...schedules[0], status: "CANCELLED" }),
    execute: vi.fn().mockResolvedValue({ ...schedules[0], status: "EXECUTED" }),
    listCatalogImports: vi.fn().mockResolvedValue([]),
    getCatalogImport: vi.fn().mockRejectedValue(new Error("Không có batch catalog")),
    uploadCatalogImport: vi.fn().mockRejectedValue(new Error("Chưa cấu hình catalog")),
    listMembershipStores: vi.fn().mockResolvedValue([]),
    listStoreMemberships: vi.fn().mockResolvedValue([]),
    lookupMembershipUser: vi.fn().mockRejectedValue(new Error("Không tìm thấy")),
    upsertMembership: vi.fn().mockRejectedValue(new Error("Chưa cấu hình")),
    revokeMembership: vi.fn().mockRejectedValue(new Error("Chưa cấu hình")),
    listUsers: vi.fn().mockResolvedValue(adminUsers),
    deactivateUser: vi.fn().mockImplementation(async (id: string) => ({ ...adminUsers.find((user) => user.id === id)!, active: false })),
    ...overrides,
  };
}

function renderApp(api: LifecycleAdminGateway, workspace = "lifecycle") {
  window.history.replaceState(null, "", `#${workspace}`);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><App gateway={api} /></QueryClientProvider>);
}

describe("Admin lifecycle workspace", () => {
  it("keeps an anonymous login draft during focus rechecks, including network failure", async () => {
    const unauthorized = Object.assign(new Error("Hết phiên"), { status: 401 });
    const api = gateway({ getSession: vi.fn().mockRejectedValue(unauthorized) });
    renderApp(api);
    const password = await screen.findByLabelText(/Mật khẩu/);
    const username = screen.getByLabelText(/Tên đăng nhập/);
    fireEvent.change(username, { target: { value: "typing-user" } });
    fireEvent.change(password, { target: { value: "typing-password" } });
    let reject!: (error: Error) => void;
    vi.mocked(api.getSession).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    const calls = vi.mocked(api.getSession).mock.calls.length;
    act(() => { focusManager.setFocused(false); focusManager.setFocused(true); });
    await waitFor(() => expect(api.getSession).toHaveBeenCalledTimes(calls + 1));
    expect(screen.getByLabelText(/Mật khẩu/)).toBe(password);
    await act(async () => reject(new Error("Network unavailable")));
    expect(screen.getByLabelText(/Mật khẩu/)).toBe(password);
    expect(password).toHaveValue("typing-password");
    expect(username).toHaveValue("typing-user");
    focusManager.setFocused(undefined);
  });

  it("shows a retry screen when the initial session check fails", async () => {
    renderApp(gateway({ getSession: vi.fn().mockRejectedValue(new Error("Network unavailable")) }));
    expect(await screen.findByRole("heading", { name: "Chưa thể mở Admin Web" })).toBeVisible();
  });
  it("logs out and removes the previous account's data before another login", async () => {
    const api = gateway();
    renderApp(api);
    await screen.findByText("CF-0012 · Nguyễn Kiệm");
    fireEvent.keyDown(screen.getByRole("button", { name: "Menu tài khoản" }), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Đăng xuất" }));
    await screen.findByRole("heading", { name: "Đăng nhập quản trị" });
    expect(screen.queryByText("CF-0012 · Nguyễn Kiệm")).not.toBeInTheDocument();
    vi.mocked(api.listTargets).mockResolvedValue([]);
    vi.mocked(api.listSchedules).mockResolvedValue([]);
    fireEvent.change(screen.getByLabelText(/Tên đăng nhập/), { target: { value: "another.admin" } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/), { target: { value: "synthetic-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await screen.findByRole("heading", { name: "Tổng quan vận hành" });
    fireEvent.click(await screen.findByRole("button", { name: "Lifecycle" }));
    await screen.findByText("Chưa có lịch ngừng hoạt động");
    expect(screen.queryByText("CF-0012 · Nguyễn Kiệm")).not.toBeInTheDocument();
  });

  it("returns to login when a lifecycle request reports an expired session", async () => {
    const api = gateway();
    renderApp(api);
    await screen.findByText("CF-0012 · Nguyễn Kiệm");
    vi.mocked(api.listSchedules).mockRejectedValue(Object.assign(new Error("Hết phiên"), { status: 401 }));
    fireEvent.click(screen.getByRole("button", { name: "Tải lại lịch ngừng hoạt động" }));
    await screen.findByRole("heading", { name: "Đăng nhập quản trị" });
    expect(screen.queryByText("CF-0012 · Nguyễn Kiệm")).not.toBeInTheDocument();
  });

  it.each(["lifecycle", "identity", "catalog"] as const)("changes password from %s and requires a fresh login", async (workspace) => {
    const api = gateway(workspace === "catalog" ? { getSession: vi.fn().mockResolvedValue(catalogSession) } : {});
    renderApp(api, workspace);
    if (workspace === "catalog") await screen.findByRole("heading", { name: "Kiểm tra catalog CSV" });
    else if (workspace === "identity") await screen.findByRole("heading", { name: "Tài khoản người dùng" });
    else await screen.findByText("CF-0012 · Nguyễn Kiệm");

    fireEvent.keyDown(screen.getByRole("button", { name: "Menu tài khoản" }), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Đổi mật khẩu" }));
    const dialog = screen.getByRole("dialog", { name: "Đổi mật khẩu" });
    fireEvent.change(within(dialog).getByLabelText(/Mật khẩu hiện tại/), { target: { value: "correct-password" } });
    fireEvent.change(within(dialog).getByLabelText(/Mật khẩu mới/), { target: { value: "Một mật khẩu rất riêng 2026!" } });
    fireEvent.change(within(dialog).getByLabelText(/Nhập lại mật khẩu mới/), { target: { value: "Một mật khẩu rất riêng 2026!" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Đổi mật khẩu" }));

    await waitFor(() => expect(api.changePassword).toHaveBeenCalledWith(
      "correct-password",
      "Một mật khẩu rất riêng 2026!",
    ));
    expect(await screen.findByText("Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
  });

  it("resets a dismissed action draft and allows clearing an invalid date", async () => {
    const api = gateway();
    renderApp(api);
    await screen.findByText("CF-0012 · Nguyễn Kiệm");
    fireEvent.click(screen.getByRole("button", { name: "Đổi lịch" }));
    let dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Lý do/), { target: { value: "Nháp không lưu" } });
    fireEvent.change(within(dialog).getByLabelText(/Ngày hiệu lực mới/), { target: { value: "" } });
    expect(within(dialog).getByLabelText(/Ngày hiệu lực mới/)).toHaveValue("");
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu ngày mới" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("dd/mm/yyyy");
    expect(api.reschedule).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    fireEvent.click(screen.getByRole("button", { name: "Hủy lịch" }));
    dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/Lý do/)).toHaveValue("");
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("recovers an expired session through the accessible login form", async () => {
    const expired = Object.assign(new Error("Phiên đăng nhập đã hết hạn."), { status: 401 });
    const api = gateway({ getSession: vi.fn().mockRejectedValue(expired) });
    renderApp(api);

    expect(await screen.findByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: /Tên đăng nhập/ }), { target: { value: "chain.admin" } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => expect(api.login).toHaveBeenCalledWith("chain.admin", "correct-password"));
    expect(await screen.findByRole("heading", { name: "Tổng quan vận hành" })).toBeVisible();
  });

  it("creates a schedule with display date converted to the ISO contract", async () => {
    const api = gateway();
    renderApp(api);
    expect(await screen.findByText("CF-0012 · Nguyễn Kiệm")).toBeVisible();

    fireEvent.change(screen.getByRole("combobox", { name: /Vùng hoặc cửa hàng/ }), {
      target: { value: `STORE:${targets[1]!.id}` },
    });
    const dateInput = screen.getByRole("textbox", { name: /Ngày hiệu lực/ }) as HTMLInputElement;
    const [day, month, year] = dateInput.value.split("/");
    const expectedIso = `${year}-${month}-${day}`;
    fireEvent.change(screen.getByRole("textbox", { name: /^Lý do/ }), { target: { value: "Kết thúc địa điểm thuê" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo lịch ngừng hoạt động" }));

    await waitFor(() => expect(api.createSchedule).toHaveBeenCalledWith({
      targetType: "STORE",
      targetId: targets[1]!.id,
      effectiveDate: expectedIso,
      reason: "Kết thúc địa điểm thuê",
    }));
    expect(await screen.findByText(/Đã đặt lịch ngừng hoạt động CF-0012/)).toBeVisible();
  });

  it("confirms cancellation with a required reason and keeps execution disabled before due date", async () => {
    const api = gateway();
    renderApp(api);
    await screen.findByText("CF-0012 · Nguyễn Kiệm");
    expect(screen.getByRole("button", { name: /Chờ đến/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Hủy lịch" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Hủy lịch ngừng hoạt động" })).toBeVisible();
    fireEvent.change(within(dialog).getByRole("textbox", { name: /Lý do/ }), { target: { value: "Kế hoạch thay đổi" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Xác nhận hủy lịch" }));

    await waitFor(() => expect(api.cancel).toHaveBeenCalledWith(schedules[0]!.id, "Kế hoạch thay đổi"));
    expect(await screen.findByText("Đã hủy lịch CF-0012.")).toBeVisible();
  });
});

describe("Admin catalog staging workspace", () => {
  it("opens catalog for CATALOG_ADMIN without requesting lifecycle schedules", async () => {
    const api = gateway({
      getSession: vi.fn().mockResolvedValue(catalogSession),
      listCatalogImports: vi.fn().mockResolvedValue(catalogImportsFixture as Awaited<ReturnType<LifecycleAdminGateway["listCatalogImports"]>>),
      getCatalogImport: vi.fn().mockResolvedValue(catalogDetailFixture as Awaited<ReturnType<LifecycleAdminGateway["getCatalogImport"]>>),
    });
    renderApp(api, "catalog");

    expect(await screen.findByRole("heading", { name: "Kiểm tra catalog CSV" })).toBeVisible();
    expect(await screen.findByText("catalog-conflict.csv")).toBeVisible();
    expect((await screen.findAllByText("UPC bị lặp trong cùng file."))[0]).toBeVisible();
    // Scoped targets are probed for navigation because session lacks region assignments.
    expect(api.listSchedules).not.toHaveBeenCalled();
  });

  it("uploads a CSV, announces the result and opens the returned batch", async () => {
    const api = gateway({
      getSession: vi.fn().mockResolvedValue(catalogSession),
      listCatalogImports: vi.fn().mockResolvedValue([]),
      getCatalogImport: vi.fn().mockResolvedValue({
        ...(catalogDetailFixture as Awaited<ReturnType<LifecycleAdminGateway["getCatalogImport"]>>),
        batch: (catalogUploadFixture as Awaited<ReturnType<LifecycleAdminGateway["uploadCatalogImport"]>>).batch,
      }),
      uploadCatalogImport: vi.fn().mockResolvedValue(catalogUploadFixture as Awaited<ReturnType<LifecycleAdminGateway["uploadCatalogImport"]>>),
    });
    renderApp(api, "catalog");
    const input = await screen.findByLabelText(/File UTF-8 CSV/);
    const file = new File(["NCC,Tên NCC,UPC,SKU,Tên sản phẩm\n0007,NCC Demo,00123,SKU-1,Sản phẩm\n"], "catalog.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Tải lên và kiểm tra" }));

    await waitFor(() => expect(api.uploadCatalogImport).toHaveBeenCalledWith(file));
    expect(await screen.findByRole("status")).toHaveTextContent("không có lỗi");
    await waitFor(() => expect(api.getCatalogImport).toHaveBeenCalledWith(
      (catalogUploadFixture as Awaited<ReturnType<LifecycleAdminGateway["uploadCatalogImport"]>>).batch.id,
      0,
      expect.any(AbortSignal),
    ));
  });

  it("puts upload errors in a focusable alert near the file field", async () => {
    const api = gateway({
      getSession: vi.fn().mockResolvedValue(catalogSession),
      listCatalogImports: vi.fn().mockResolvedValue([]),
      uploadCatalogImport: vi.fn().mockRejectedValue(new Error("Header catalog không hợp lệ.")),
    });
    renderApp(api, "catalog");
    const input = await screen.findByLabelText(/File UTF-8 CSV/);
    fireEvent.change(input, { target: { files: [new File(["bad"], "bad.csv", { type: "text/csv" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Tải lên và kiểm tra" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Header catalog không hợp lệ.");
    expect(alert).toHaveFocus();
  });
});

describe("Admin identity workspace", () => {
  it("requires a reason, confirms deactivation and announces request-next session effect", async () => {
    const api = gateway();
    renderApp(api);
    await screen.findByText("CF-0012 · Nguyễn Kiệm");
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));

    expect(await screen.findByRole("heading", { name: "Tài khoản người dùng" })).toBeVisible();
    expect(await screen.findByText("Quản lý cửa hàng Demo")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Vô hiệu hóa" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Xác nhận vô hiệu hóa" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Hãy nhập lý do");
    fireEvent.change(within(dialog).getByLabelText(/Lý do/), { target: { value: "Nhân sự đã nghỉ việc" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Xác nhận vô hiệu hóa" }));

    await waitFor(() => expect(api.deactivateUser).toHaveBeenCalledWith(adminUsers[1]!.id, "Nhân sự đã nghỉ việc"));
    expect(await screen.findByRole("status")).toHaveTextContent(/mất quyền ở lần thao tác tiếp theo/);
  });

  it("does not offer self-deactivation and surfaces backend guard failures", async () => {
    const api = gateway({
      deactivateUser: vi.fn().mockRejectedValue(new Error("Không thể vô hiệu hóa quản trị chuỗi cuối cùng đang hoạt động.")),
    });
    renderApp(api);
    await screen.findByText("CF-0012 · Nguyễn Kiệm");
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    await screen.findByRole("heading", { name: "Tài khoản người dùng" });

    expect(await screen.findByText("Tài khoản đang đăng nhập")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Vô hiệu hóa" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Lý do/), { target: { value: "Kiểm tra guard" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Xác nhận vô hiệu hóa" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("quản trị chuỗi cuối cùng");
  });
});


describe("Phiếu KPH toàn chuỗi", () => {
  it("filters before paging and distinguishes a failed load from an empty result", async () => {
    const record = kphPage.items[0]!;
    const api = gateway({
      listKphStores: vi.fn().mockResolvedValue([{ ...record.store, capabilities: ["REVIEW"] }]),
      listChainKphRecords: vi.fn()
        .mockResolvedValueOnce({ ...kphPage, totalPages: 2, totalItems: 26 })
        .mockResolvedValueOnce({ ...kphPage, page: 2, totalPages: 2, totalItems: 26 })
        .mockRejectedValueOnce(new Error("Mất kết nối"))
        .mockResolvedValue({ ...kphPage, items: [], totalItems: 0, totalPages: 0 }),
    });
    renderApp(api, "kph");
    await screen.findByText("26 phiếu");
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await screen.findByText("Trang 2 / 2");
    fireEvent.change(screen.getByLabelText("Cửa hàng"), { target: { value: record.store.id } });
    fireEvent.change(screen.getByLabelText("Từ ngày phát hiện"), { target: { value: "16/01/2026" } });
    fireEvent.change(screen.getByLabelText("Trạng thái duyệt"), { target: { value: "PENDING" } });
    fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mất kết nối");
    expect(api.listChainKphRecords).toHaveBeenLastCalledWith(
      { storeId: record.store.id, page: 1, detectedFrom: "2026-01-16", approvalStatus: "PENDING" }, expect.anything(),
    );
    expect(screen.queryByText("Không có phiếu phù hợp.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Không có phiếu phù hợp.")).toBeVisible();
  });
  it("opens the chain list and reviews the selected store and record", async () => {
    const api = gateway();
    renderApp(api, "overview");
    fireEvent.click(await screen.findByRole("button", { name: "Phiếu KPH" }));
    const record = kphPage.items[0]!;
    fireEvent.click(await screen.findByRole("button", { name: record.catalogSnapshot.productName }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(record.id)).toBeVisible();
    expect(within(dialog).getByText(record.store.name, { exact: false })).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Duyệt phiếu" }));
    await waitFor(() => expect(api.reviewKphRecord).toHaveBeenCalledWith(record.store.id, record.id, "APPROVED"));
    await waitFor(() => expect(api.listChainKphRecords).toHaveBeenCalledTimes(2));
  });
});

describe("Admin Fresh shell and overview", () => {
  it("keeps mock overview separate from API data and filters its sample table", async () => {
    const api = gateway();
    renderApp(api, "overview");
    expect(await screen.findByRole("heading", { name: "Tổng quan vận hành" })).toBeVisible();
    expect(screen.getByText("Chưa kết nối realtime")).toBeVisible();
    expect(api.listUsers).not.toHaveBeenCalled();
    expect(api.listSchedules).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Khoảng thời gian"), { target: { value: "30" } });
    expect(screen.getByText("Trong 30 ngày được chọn")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Tìm cửa hàng mẫu"), { target: { value: "DEMO-003" } });
    const table = screen.getByRole("region", { name: "Bảng cửa hàng minh họa" });
    expect(within(table).getByText("Cửa hàng Tân Phong")).toBeVisible();
    expect(within(table).queryByText("Cửa hàng An Phú")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chờ duyệt" }));
    expect(within(table).getByText(/Không có cửa hàng mẫu phù hợp/)).toBeVisible();
  });

  it("does not expose chain or catalog navigation to a region actor", async () => {
    const api = gateway({ getSession: vi.fn().mockResolvedValue(sessionFixture) });
    renderApp(api, "identity");
    expect(await screen.findByRole("heading", { name: "Tổng quan vận hành" })).toBeVisible();
    expect(await screen.findByRole("button", { name: "Lifecycle" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Tài khoản" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Catalog" })).not.toBeInTheDocument();
    expect(api.listUsers).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Phiếu KPH" })).not.toBeInTheDocument();
    expect(api.listChainKphRecords).not.toHaveBeenCalled();
  });

  it("hides lifecycle on server scope denial and allows catalog via navigation", async () => {
    const api = gateway({ getSession: vi.fn().mockResolvedValue(catalogSession), listTargets: vi.fn().mockRejectedValue(Object.assign(new Error("No scope"), { status: 403 })) });
    renderApp(api, "overview");
    await screen.findByRole("heading", { name: "Tổng quan vận hành" });
    await waitFor(() => expect(api.listTargets).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Lifecycle" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Catalog" }));
    expect(await screen.findByRole("heading", { name: "Kiểm tra catalog CSV" })).toBeVisible();
  });
});
