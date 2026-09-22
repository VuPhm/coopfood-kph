import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import schedulesFixture from "../../../contracts/fixtures/api/lifecycle-schedules.json";
import targetsFixture from "../../../contracts/fixtures/api/lifecycle-targets.json";
import catalogImportsFixture from "../../../contracts/fixtures/api/catalog-imports.json";
import catalogDetailFixture from "../../../contracts/fixtures/api/catalog-import-detail.json";
import catalogUploadFixture from "../../../contracts/fixtures/api/catalog-import-upload.json";
import sessionFixture from "../../../contracts/fixtures/api/session.json";
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

function gateway(overrides: Partial<LifecycleAdminGateway> = {}): LifecycleAdminGateway {
  return {
    getSession: vi.fn().mockResolvedValue(session),
    login: vi.fn().mockResolvedValue(session),
    logout: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue(undefined),
    listTargets: vi.fn().mockResolvedValue(targets),
    listSchedules: vi.fn().mockResolvedValue(schedules),
    createSchedule: vi.fn().mockResolvedValue(schedules[0]),
    reschedule: vi.fn().mockResolvedValue(schedules[0]),
    cancel: vi.fn().mockResolvedValue({ ...schedules[0], status: "CANCELLED" }),
    execute: vi.fn().mockResolvedValue({ ...schedules[0], status: "EXECUTED" }),
    listCatalogImports: vi.fn().mockResolvedValue([]),
    getCatalogImport: vi.fn().mockRejectedValue(new Error("Không có batch catalog")),
    uploadCatalogImport: vi.fn().mockRejectedValue(new Error("Chưa cấu hình catalog")),
    ...overrides,
  };
}

function renderApp(api: LifecycleAdminGateway) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><App gateway={api} /></QueryClientProvider>);
}

describe("Admin lifecycle workspace", () => {
  it("logs out and removes the previous account's data before another login", async () => {
    const api = gateway();
    renderApp(api);
    await screen.findByText("CF-0012 · Nguyễn Kiệm");
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await screen.findByRole("heading", { name: "Đăng nhập quản trị" });
    expect(screen.queryByText("CF-0012 · Nguyễn Kiệm")).not.toBeInTheDocument();
    vi.mocked(api.listTargets).mockResolvedValue([]);
    vi.mocked(api.listSchedules).mockResolvedValue([]);
    fireEvent.change(screen.getByLabelText(/Tên đăng nhập/), { target: { value: "another.admin" } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/), { target: { value: "synthetic-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
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

  it("changes the current password and requires a fresh login", async () => {
    const api = gateway();
    renderApp(api);
    await screen.findByText("CF-0012 · Nguyễn Kiệm");

    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    const dialog = screen.getByRole("dialog", { name: "Đổi mật khẩu" });
    fireEvent.change(within(dialog).getByLabelText("Mật khẩu hiện tại"), { target: { value: "correct-password" } });
    fireEvent.change(within(dialog).getByLabelText("Mật khẩu mới"), { target: { value: "Một mật khẩu rất riêng 2026!" } });
    fireEvent.change(within(dialog).getByLabelText("Nhập lại mật khẩu mới"), { target: { value: "Một mật khẩu rất riêng 2026!" } });
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
    expect(await screen.findByRole("heading", { name: "Đặt lịch ngừng hoạt động" })).toBeVisible();
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
  it("opens catalog for CATALOG_ADMIN without requesting lifecycle scope", async () => {
    const api = gateway({
      getSession: vi.fn().mockResolvedValue(catalogSession),
      listCatalogImports: vi.fn().mockResolvedValue(catalogImportsFixture as Awaited<ReturnType<LifecycleAdminGateway["listCatalogImports"]>>),
      getCatalogImport: vi.fn().mockResolvedValue(catalogDetailFixture as Awaited<ReturnType<LifecycleAdminGateway["getCatalogImport"]>>),
    });
    renderApp(api);

    expect(await screen.findByRole("heading", { name: "Kiểm tra catalog CSV" })).toBeVisible();
    expect(await screen.findByText("catalog-conflict.csv")).toBeVisible();
    expect((await screen.findAllByText("UPC bị lặp trong cùng file."))[0]).toBeVisible();
    expect(api.listTargets).not.toHaveBeenCalled();
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
    renderApp(api);
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
    renderApp(api);
    const input = await screen.findByLabelText(/File UTF-8 CSV/);
    fireEvent.change(input, { target: { files: [new File(["bad"], "bad.csv", { type: "text/csv" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Tải lên và kiểm tra" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Header catalog không hợp lệ.");
    expect(alert).toHaveFocus();
  });
});
