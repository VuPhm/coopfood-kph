import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import sessionFixture from "../../../contracts/fixtures/api/session.json";
import type { RecordView } from "./record-view";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  listStores: vi.fn(),
  loadHistory: vi.fn(),
  loadWorkspace: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
  createRecord: vi.fn(),
  reviewRecord: vi.fn(),
  prepareExport: vi.fn(),
  lookupBarcode: vi.fn(),
}));

vi.mock("./online-kph", () => ({
  onlineModeEnabled: () => true,
  onlineExportSelectionError: () => null,
  createOnlineGateway: () => ({
    getSession: mocks.getSession,
    listStores: mocks.listStores,
    loadHistory: async (...args: unknown[]) => {
      const value = await mocks.loadHistory(...args);
      if (!Array.isArray(value)) return value;
      return {
        records: value,
        page: 1,
        pageSize: 25,
        totalItems: value.length,
        totalPages: value.length === 0 ? 0 : 1,
        typeTotals: {
          TPCN: value.filter((record) => record.kind === "TPCN").length,
          TPTS: value.filter((record) => record.kind === "TPTS").length,
        },
      };
    },
    loadWorkspace: mocks.loadWorkspace,
    login: mocks.login,
    logout: mocks.logout,
    changePassword: mocks.changePassword,
    createRecord: mocks.createRecord,
    reviewRecord: mocks.reviewRecord,
    prepareExport: mocks.prepareExport,
    lookupBarcode: mocks.lookupBarcode,
  }),
}));

import { App } from "./app";

const storeA = { ...sessionFixture.user.stores[0]!, id: "20000000-0000-4000-8000-000000000001" };
const storeB = { ...sessionFixture.user.stores[0]!, id: "20000000-0000-4000-8000-000000000002", code: "CF-DEMO-002", name: "Lý Thường Kiệt" };
const session = { ...sessionFixture, user: { ...sessionFixture.user, stores: [storeA, storeB] } };

function record(id: string, productName: string): RecordView {
  return {
    id,
    kind: "TPCN" as const,
    detectedDate: "09/09/2026",
    detectedBy: "Nguyễn Văn Demo",
    sku: id,
    productName,
    supplier: "NCC Demo",
    quantity: "1 EA",
    quantityValue: 1,
    unit: "EA" as const,
    condition: "Cận date",
    resolution: "HỦY",
    treatmentDate: "",
    approvalStatus: "PENDING" as const,
    photos: [],
    note: "",
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function submitOnlineRecord(productName: string) {
  fireEvent.click(await screen.findByRole("button", { name: "Tạo phiếu" }));
  fireEvent.click(screen.getByRole("button", { name: "Thực phẩm khô & khác" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: productName } });
  const picker = screen.getByText("Chọn ảnh").closest("label")?.querySelector("input");
  fireEvent.change(picker!, { target: { files: [new File(["evidence"], "evidence.jpg", { type: "image/jpeg" })] } });
  expect(await screen.findByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Xem lại trước khi gửi" }));
  fireEvent.click(await screen.findByRole("button", { name: "Gửi phiếu" }));
  await waitFor(() => expect(mocks.createRecord).toHaveBeenCalledOnce());
}

function expectSelectedCount(count: number) {
  if (count === 0) {
    expect(screen.getByText((_, element) => element?.classList.contains("selection-count") === true))
      .toHaveTextContent("Đã chọn 0");
    return;
  }
  expect(screen.getByRole("button", { name: `Duyệt ${count} phiếu` })).toBeVisible();
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue(session);
  mocks.loadHistory.mockImplementation((storeId: string) => Promise.resolve([record(storeId, storeId === storeA.id ? "Phiếu cửa hàng A" : "Phiếu cửa hàng B")]));
  mocks.login.mockResolvedValue(session);
  mocks.logout.mockResolvedValue(undefined);
  mocks.changePassword.mockResolvedValue(undefined);
});

describe("online identity and scoped query state", () => {
  it("exposes direct KPH tasks in the authenticated Store App shell", async () => {
    render(<App />);
    const shell = await screen.findByRole("region", { name: "Store App" });
    expect(within(shell).getByText("Store App")).toBeVisible();
    expect(within(shell).getByText("Nghiệp vụ đang hoạt động · KPH")).toBeVisible();
    expect(within(shell).getByText("Tài khoản: Nguyễn Văn Demo · manager.demo")).toBeVisible();
    expect(within(shell).getByText("Co.op Food Nguyễn Kiệm · CF-DEMO-001")).toBeVisible();
    expect(within(shell).getByRole("link", { name: /Lịch sử/ })).toHaveAttribute("href", "#history-title");

    await waitFor(() => expect(within(shell).getByRole("button", { name: "Tạo phiếu" })).toBeEnabled());
    fireEvent.click(within(shell).getByRole("button", { name: "Tạo phiếu" }));
    fireEvent.click(screen.getByRole("button", { name: "Thực phẩm khô & khác" }));
    expect(await screen.findByRole("dialog", { name: /Tạo phiếu KPH.*Thực phẩm khô/i })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    fireEvent.click(within(shell).getByRole("button", { name: "Tạo phiếu" }));
    fireEvent.click(screen.getByRole("button", { name: "Thực phẩm tươi sống" }));
    expect(await screen.findByRole("dialog", { name: /Tạo phiếu KPH.*Thực phẩm tươi/i })).toBeVisible();
  });

  it("shows only session context when an inherited-scope actor has no listed stores", async () => {
    mocks.getSession.mockResolvedValueOnce({
      ...session,
      user: { ...session.user, globalRoles: ["CHAIN_ADMIN"], stores: [] },
    });
    render(<App />);
    const shell = await screen.findByRole("region", { name: "Store App" });
    expect(within(shell).getByText("Chưa có cửa hàng trong phiên")).toBeVisible();
    expect(within(shell).getByText("Tài khoản: Nguyễn Văn Demo · manager.demo")).toBeVisible();
    expect(within(shell).queryByRole("combobox", { name: "Chọn cửa hàng" })).not.toBeInTheDocument();
    expect(within(shell).getByRole("button", { name: "Tạo phiếu" })).toBeDisabled();
    expect(within(shell).getByRole("link", { name: /Lịch sử/ })).toBeVisible();
    expect(mocks.loadHistory).not.toHaveBeenCalled();
  });

  it("shows login after session expiry, logs in, and logs out through the API", async () => {
    const expired = Object.assign(new Error("Phiên đăng nhập đã hết hạn."), { status: 401 });
    mocks.getSession.mockRejectedValueOnce(expired);
    render(<App />);

    expect(await screen.findByText("Đăng nhập Store PWA")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Tạo phiếu.*TP khô/i })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Tên đăng nhập" }), { target: { value: "demo" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith("demo", "password"));
    expect(await screen.findByRole("button", { name: "Đăng xuất" })).toBeVisible();
    expect(screen.getByRole("group", { name: /Cửa hàng hiện tại/ })).toHaveTextContent("Nguyễn Kiệm");
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await waitFor(() => expect(mocks.logout).toHaveBeenCalledOnce());
    expect(await screen.findByText("Đăng nhập Store PWA")).toBeVisible();
  });

  it("keeps logout retry available when the server response fails", async () => {
    let finishHistory!: (records: ReturnType<typeof record>[]) => void;
    mocks.loadHistory.mockReturnValueOnce(new Promise(resolve => { finishHistory = resolve; }));
    mocks.logout.mockRejectedValueOnce(new Error("network error"));
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Đăng xuất" }));
    expect(await screen.findByText("Chưa xác nhận được đăng xuất. Hãy thử đăng xuất lại.")).toBeVisible();
    finishHistory([record(storeA.id, "Phiếu đến sau lỗi đăng xuất")]);
    await screen.findAllByText("Phiếu đến sau lỗi đăng xuất");
    expect(screen.getByText("Chưa xác nhận được đăng xuất. Hãy thử đăng xuất lại.")).toBeVisible();
    expect(screen.queryByText("Đăng nhập Store PWA")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(await screen.findByText("Đăng nhập Store PWA")).toBeVisible();
    expect(mocks.logout).toHaveBeenCalledTimes(2);
  });

  it("changes the current password and clears the authenticated workspace", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Đổi mật khẩu" }));
    const dialog = screen.getByRole("dialog", { name: "Đổi mật khẩu" });
    fireEvent.change(within(dialog).getByLabelText("Mật khẩu hiện tại"), { target: { value: "correct-password" } });
    fireEvent.change(within(dialog).getByLabelText("Mật khẩu mới"), { target: { value: "Một mật khẩu rất riêng 2026!" } });
    fireEvent.change(within(dialog).getByLabelText("Nhập lại mật khẩu mới"), { target: { value: "Một mật khẩu rất riêng 2026!" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Đổi mật khẩu" }));

    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith(
      "correct-password",
      "Một mật khẩu rất riêng 2026!",
    ));
    expect(await screen.findByText("Đăng nhập Store PWA")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.");
  });

  it("keys history by user and store and clears the previous store records immediately", async () => {
    const storeBHistory = deferred<ReturnType<typeof record>[]>();
    mocks.loadHistory.mockImplementation((storeId: string) => storeId === storeA.id
      ? Promise.resolve([record(storeA.id, "Phiếu cửa hàng A")])
      : storeBHistory.promise);
    render(<App />);
    expect(await screen.findAllByText("Phiếu cửa hàng A")).toHaveLength(2);
    const context = screen.getByRole("group", { name: /Cửa hàng hiện tại/ });
    const switcher = within(context).getByRole("combobox", { name: "Chọn cửa hàng" });
    fireEvent.change(switcher, { target: { value: storeB.id } });
    await waitFor(() => expect(mocks.loadHistory).toHaveBeenCalledWith(storeB.id, {
      type: "TPCN",
      page: 1,
      pageSize: 25,
    }, expect.anything()));
    expect(screen.queryByText("Phiếu cửa hàng A")).not.toBeInTheDocument();
    await act(async () => storeBHistory.resolve([record(storeB.id, "Phiếu cửa hàng B")]));
    expect(await screen.findAllByText("Phiếu cửa hàng B")).toHaveLength(2);
    expect(screen.queryByText("Phiếu cửa hàng A")).not.toBeInTheDocument();
  });

  it("ignores a create response after the user switches stores", async () => {
    const pendingCreate = deferred<ReturnType<typeof record>>();
    mocks.createRecord.mockReturnValueOnce(pendingCreate.promise);
    render(<App />);
    await screen.findAllByText("Phiếu cửa hàng A");
    await submitOnlineRecord("Phiếu tạo muộn ở A");

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    const switcher = within(screen.getByRole("group", { name: /Cửa hàng hiện tại/ }))
      .getByRole("combobox", { name: "Chọn cửa hàng" });
    fireEvent.change(switcher, { target: { value: storeB.id } });
    expect(await screen.findAllByText("Phiếu cửa hàng B")).toHaveLength(2);

    await act(async () => pendingCreate.resolve(record("created-at-a", "Phiếu tạo muộn ở A")));
    expect(screen.queryByText("Phiếu tạo muộn ở A")).not.toBeInTheDocument();
    expectSelectedCount(0);
    expect(screen.queryByText(/Đã tạo phiếu created-at-a/)).not.toBeInTheDocument();
  });

  it("ignores a create response from an earlier login generation", async () => {
    const pendingCreate = deferred<ReturnType<typeof record>>();
    mocks.createRecord.mockReturnValueOnce(pendingCreate.promise);
    render(<App />);
    await screen.findAllByText("Phiếu cửa hàng A");
    await submitOnlineRecord("Phiếu từ phiên cũ");

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(await screen.findByText("Đăng nhập Store PWA")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Tên đăng nhập" }), { target: { value: "demo" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await screen.findAllByText("Phiếu cửa hàng A");

    await act(async () => pendingCreate.resolve(record("created-before-logout", "Phiếu từ phiên cũ")));
    expect(screen.queryByText("Phiếu từ phiên cũ")).not.toBeInTheDocument();
    expectSelectedCount(0);
    expect(screen.queryByText(/Đã tạo phiếu created-before-logout/)).not.toBeInTheDocument();
  });

  it("applies a create response while the original session and store are still current", async () => {
    const pendingCreate = deferred<ReturnType<typeof record>>();
    const created = record("created-in-current-scope", "Phiếu đúng scope");
    let history = [record(storeA.id, "Phiếu cửa hàng A")];
    mocks.loadHistory.mockImplementation((storeId: string) => Promise.resolve(storeId === storeA.id
      ? history
      : [record(storeB.id, "Phiếu cửa hàng B")]));
    mocks.createRecord.mockReturnValueOnce(pendingCreate.promise);
    render(<App />);
    await screen.findAllByText("Phiếu cửa hàng A");
    await submitOnlineRecord("Phiếu đúng scope");

    history = [created, ...history];
    await act(async () => pendingCreate.resolve(created));
    expect(await screen.findAllByText("Phiếu đúng scope")).toHaveLength(2);
    expectSelectedCount(1);
    expect(screen.getByText(/Đã tạo phiếu created-in-current-scope/)).toBeVisible();
  });

  it("refetches the active date scope without selecting a created record outside that filter", async () => {
    const existing = record("existing-before-filter", "Phiếu trước khoảng lọc");
    const createdOutsideFilter = record("created-outside-filter", "Phiếu ngoài khoảng lọc");
    mocks.loadHistory.mockImplementation((_storeId: string, filter: { detectedFrom?: string } = {}) => Promise.resolve(
      filter.detectedFrom ? [] : [existing],
    ));
    mocks.createRecord.mockResolvedValue(createdOutsideFilter);
    render(<App />);
    await screen.findAllByText(existing.productName);

    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "10/09/2026" } });
    expect(await screen.findAllByText("Chưa có phiếu nào trên máy chủ.")).toHaveLength(2);
    await submitOnlineRecord(createdOutsideFilter.productName);

    expect(await screen.findByText(/Đã tạo phiếu created-outside-filter/)).toBeVisible();
    expect(screen.queryByText(createdOutsideFilter.productName)).not.toBeInTheDocument();
    expectSelectedCount(0);
    expect(mocks.loadHistory).toHaveBeenLastCalledWith(storeA.id, {
      type: "TPCN",
      detectedFrom: "2026-09-10",
      page: 1,
      pageSize: 25,
    }, expect.anything());
    expect(mocks.loadHistory.mock.calls.filter(([, filter]) => filter?.detectedFrom === "2026-09-10")).toHaveLength(2);
  });

  it("waits for the whole review batch, reports partial failure, and retries only failed records", async () => {
    const failedRecord = record("review-fails", "Phiếu duyệt lỗi");
    const successfulRecord = record("review-succeeds", "Phiếu duyệt thành công");
    const reviewedRecord = { ...successfulRecord, approvalStatus: "APPROVED" as const };
    let history = [failedRecord, successfulRecord];
    const slowSuccess = deferred<ReturnType<typeof record>>();
    mocks.loadHistory.mockImplementation(() => Promise.resolve(history));
    mocks.reviewRecord.mockImplementation((_storeId: string, recordId: string) => recordId === failedRecord.id
      ? Promise.reject(new Error("review failed"))
      : slowSuccess.promise);
    render(<App />);
    await screen.findAllByText("Phiếu duyệt lỗi");

    fireEvent.click(screen.getAllByRole("checkbox", { name: `Chọn phiếu ${failedRecord.id}` })[0]!);
    fireEvent.click(screen.getAllByRole("checkbox", { name: `Chọn phiếu ${successfulRecord.id}` })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Duyệt 2 phiếu" }));
    await waitFor(() => expect(mocks.reviewRecord).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("button", { name: "Đang duyệt…" })).toBeDisabled();

    history = [failedRecord, reviewedRecord];
    await act(async () => slowSuccess.resolve(reviewedRecord));
    expect(await screen.findByText("Đã duyệt 1 phiếu; 1 phiếu chưa duyệt được và vẫn được chọn để thử lại.")).toBeVisible();
    expect(mocks.loadHistory).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Duyệt 1 phiếu" })).toBeEnabled();
    expect(screen.getAllByRole("checkbox", { name: `Chọn phiếu ${failedRecord.id}` })[0]).toBeChecked();
    expect(screen.getAllByRole("checkbox", { name: `Chọn phiếu ${successfulRecord.id}` })[0]).not.toBeChecked();

    const retriedRecord = { ...failedRecord, approvalStatus: "APPROVED" as const };
    history = [retriedRecord, reviewedRecord];
    mocks.reviewRecord.mockResolvedValueOnce(retriedRecord);
    fireEvent.click(screen.getByRole("button", { name: "Duyệt 1 phiếu" }));
    expect(await screen.findByText("Đã duyệt 1 phiếu trên máy chủ.")).toBeVisible();
    expect(mocks.reviewRecord).toHaveBeenLastCalledWith(storeA.id, failedRecord.id, "APPROVED");
    expectSelectedCount(0);
  });

  it("limits an online review batch to four concurrent requests", async () => {
    const batch = Array.from({ length: 5 }, (_, index) => record(`review-${index + 1}`, `Phiếu ${index + 1}`));
    const pending = new Map(batch.map((item) => [item.id, deferred<ReturnType<typeof record>>()] as const));
    mocks.loadHistory.mockResolvedValue(batch);
    mocks.reviewRecord.mockImplementation((_storeId: string, recordId: string) => pending.get(recordId)!.promise);
    render(<App />);
    await screen.findAllByText("Phiếu 1");

    for (const item of batch) {
      fireEvent.click(screen.getAllByRole("checkbox", { name: `Chọn phiếu ${item.id}` })[0]!);
    }
    fireEvent.click(screen.getByRole("button", { name: "Duyệt 5 phiếu" }));
    await waitFor(() => expect(mocks.reviewRecord).toHaveBeenCalledTimes(4));
    expect(mocks.reviewRecord).toHaveBeenCalledTimes(4);

    const first = batch[0]!;
    await act(async () => pending.get(first.id)!.resolve({ ...first, approvalStatus: "APPROVED" as const }));
    await waitFor(() => expect(mocks.reviewRecord).toHaveBeenCalledTimes(5));
    await act(async () => {
      for (const item of batch.slice(1)) {
        pending.get(item.id)!.resolve({ ...item, approvalStatus: "APPROVED" as const });
      }
    });
    expect(await screen.findByText("Đã duyệt 5 phiếu trên máy chủ.")).toBeVisible();
  });
});
