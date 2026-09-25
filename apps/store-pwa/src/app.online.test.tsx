import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import sessionFixture from "../../../contracts/fixtures/api/session.json";
import { DEMO_RECORDS } from "./demo-records";
import type { OnlineWorkspace } from "./online-kph";

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
  loadPilotRecords: vi.fn(),
  patchPilotRecords: vi.fn(),
  recordPilotExport: vi.fn(),
  savePilotRecord: vi.fn(),
  downloadKphWorkbook: vi.fn(),
  onlineExportSelectionError: vi.fn<(recordCount: number) => string | null>(),
}));

vi.mock("./online-kph", () => ({
  onlineModeEnabled: () => true,
  onlineExportSelectionError: mocks.onlineExportSelectionError,
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
vi.mock("./record-store", () => ({
  loadPilotRecords: mocks.loadPilotRecords,
  patchPilotRecords: mocks.patchPilotRecords,
  recordPilotExport: mocks.recordPilotExport,
  savePilotRecord: mocks.savePilotRecord,
}));
vi.mock("./excel-export", () => ({ downloadKphWorkbook: mocks.downloadKphWorkbook }));

import { App } from "./app";

function workspace(role: "EMPLOYEE" | "STORE_MANAGER" = "EMPLOYEE"): OnlineWorkspace {
  const store = { ...sessionFixture.user.stores[0]!, role };
  return {
    session: { ...sessionFixture, user: { ...sessionFixture.user, globalRoles: [], stores: [store] } },
    store,
    records: [{ ...DEMO_RECORDS[0]!, id: "online-record-1", productName: "Sản phẩm từ máy chủ" }],
  };
}

function resolveWorkspace(value: OnlineWorkspace) {
  mocks.getSession.mockResolvedValue(value.session);
  mocks.loadHistory.mockResolvedValue(value.records);
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.onlineExportSelectionError.mockImplementation((recordCount) => recordCount > 500
    ? "Chỉ có thể xuất tối đa 500 phiếu mỗi lần. Hãy giảm số phiếu đã chọn rồi thử lại."
    : null);
  mocks.logout.mockResolvedValue(undefined);
});

describe("Online workspace boundary", () => {
  it("shows loading without demo records or a premature empty state", () => {
    mocks.getSession.mockReturnValue(new Promise<OnlineWorkspace["session"]>(() => {}));
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Đang mở cửa hàng của bạn…");
    expect(screen.queryByText("Chưa có phiếu nào trên máy chủ.")).not.toBeInTheDocument();
    expect(screen.queryByText(DEMO_RECORDS[0]!.productName)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo phiếu" })).not.toBeInTheDocument();
    expect(mocks.loadPilotRecords).not.toHaveBeenCalled();
  });

  it("keeps failed session data unavailable and allows retry into a genuine empty result", async () => {
    mocks.getSession.mockRejectedValueOnce(new Error("Phiên đăng nhập đã hết hạn."));
    render(<App />);

    expect(await screen.findByText("Phiên đăng nhập đã hết hạn.")).toBeVisible();
    expect(screen.queryByText("Chưa có phiếu nào trên máy chủ.")).not.toBeInTheDocument();
    expect(screen.queryByText(DEMO_RECORDS[0]!.productName)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo phiếu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thiết lập cửa hàng/ })).not.toBeInTheDocument();

    const emptyWorkspace = { ...workspace(), records: [] };
    mocks.login.mockResolvedValueOnce(emptyWorkspace.session);
    mocks.loadHistory.mockResolvedValueOnce([]);
    fireEvent.change(screen.getByRole("textbox", { name: "Tên đăng nhập" }), { target: { value: "demo" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findAllByText("Chưa có phiếu nào trên máy chủ.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Tạo phiếu" })).toBeEnabled();
    expect(mocks.getSession).toHaveBeenCalledOnce();
    expect(mocks.login).toHaveBeenCalledWith("demo", "password");
    expect(mocks.loadHistory).toHaveBeenCalledOnce();
  });

  it("keeps review, export and Pilot delete unavailable for online EMPLOYEE", async () => {
    resolveWorkspace(workspace("EMPLOYEE"));
    render(<App />);
    await screen.findAllByText("Sản phẩm từ máy chủ");

    expect(screen.getByRole("group", { name: /Cửa hàng hiện tại:/ })).toHaveTextContent("Nguyễn Kiệm");
    expect(screen.queryByRole("button", { name: /Thiết lập cửa hàng/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mở thùng rác/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn phiếu online-record-1" })[0]!);
    expect(screen.getByText("Đã chọn", { exact: false })).toHaveTextContent("Đã chọn 1");
    fireEvent.click(screen.getByRole("button", { name: "Mở rộng phiếu online-record-1" }));
    expect(screen.queryByRole("button", { name: /Xuất Excel/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xóa phiếu/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Duyệt.*phiếu/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Trạng thái duyệt phiếu/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tạo phiếu" }));
    fireEvent.click(screen.getByRole("button", { name: "Thực phẩm khô & khác" }));
    const actor = screen.getByRole("textbox", { name: /Tên người nhập/ });
    expect(actor).toHaveValue(sessionFixture.user.displayName);
    expect(actor).toHaveAttribute("readonly");
    expect(mocks.loadPilotRecords).not.toHaveBeenCalled();
    expect(mocks.patchPilotRecords).not.toHaveBeenCalled();
    expect(mocks.recordPilotExport).not.toHaveBeenCalled();
    expect(mocks.savePilotRecord).not.toHaveBeenCalled();
    expect(mocks.downloadKphWorkbook).not.toHaveBeenCalled();
  });

  it("navigates server pages and clears page-local selection", async () => {
    const managerWorkspace = workspace("STORE_MANAGER");
    const first = { ...managerWorkspace.records[0]!, id: "page-1", productName: "Phiếu trang một" };
    const second = { ...managerWorkspace.records[0]!, id: "page-2", productName: "Phiếu trang hai" };
    let resolveSecondPage!: (page: {
      records: typeof managerWorkspace.records;
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      typeTotals: { TPCN: number; TPTS: number };
    }) => void;
    const secondPage = new Promise<Parameters<typeof resolveSecondPage>[0]>((resolve) => { resolveSecondPage = resolve; });
    mocks.getSession.mockResolvedValue(managerWorkspace.session);
    mocks.loadHistory.mockImplementation((_storeId: string, filter: { page?: number }) => filter.page === 2 ? secondPage : Promise.resolve({
      records: [first],
      page: filter.page ?? 1,
      pageSize: 25,
      totalItems: 2,
      totalPages: 2,
      typeTotals: { TPCN: 2, TPTS: 0 },
    }));
    render(<App />);

    await screen.findAllByText("Phiếu trang một");
    expect(screen.getByText("Trang 1 / 2")).toBeVisible();
    expect(screen.getAllByLabelText("2 phiếu")[0]).toHaveTextContent("2");
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn phiếu page-1" })[0]!);
    expect(screen.getByRole("button", { name: "Duyệt 1 phiếu" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(screen.getAllByText("Phiếu trang một")).toHaveLength(2);
    expect(screen.getByRole("navigation", { name: "Phân trang lịch sử phiếu" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
    expect(screen.getAllByRole("checkbox", { name: "Chọn phiếu page-1" }).every((checkbox) => (checkbox as HTMLInputElement).disabled)).toBe(true);
    expect((screen.getByRole("checkbox", { name: "Chọn tất cả phiếu" }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getAllByRole("combobox", { name: "Trạng thái duyệt phiếu page-1" }).every((control) => (control as HTMLSelectElement).disabled)).toBe(true);
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn phiếu page-1" })[0]!);
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả phiếu" }));
    expect(screen.getByText("Đã chọn", { exact: false })).toHaveTextContent("Đã chọn 0");
    expect(screen.queryByRole("button", { name: "Duyệt 1 phiếu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xuất Excel" })).not.toBeInTheDocument();
    expect(mocks.reviewRecord).not.toHaveBeenCalled();
    expect(mocks.prepareExport).not.toHaveBeenCalled();
    await act(async () => resolveSecondPage({
      records: [second],
      page: 2,
      pageSize: 25,
      totalItems: 2,
      totalPages: 2,
      typeTotals: { TPCN: 2, TPTS: 0 },
    }));
    expect(await screen.findAllByText("Phiếu trang hai")).toHaveLength(2);
    expect(screen.getByText("Trang 2 / 2")).toBeVisible();
    expect(screen.getByText("Đã chọn", { exact: false })).toHaveTextContent("Đã chọn 0");
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeDisabled();
    expect(mocks.loadHistory).toHaveBeenLastCalledWith(managerWorkspace.store.id, {
      type: "TPCN",
      page: 2,
      pageSize: 25,
    }, expect.anything());
  });

  it("lets an online STORE_MANAGER review and export an approved server snapshot without delete", async () => {
    const managerWorkspace = workspace("STORE_MANAGER");
    const approved = { ...managerWorkspace.records[0]!, approvalStatus: "APPROVED" as const, reviewedBy: managerWorkspace.session.user.displayName };
    const exportStore = { ...managerWorkspace.store, code: "0456", name: "Snapshot từ máy chủ" };
    mocks.getSession.mockResolvedValue(managerWorkspace.session);
    mocks.loadHistory.mockResolvedValueOnce(managerWorkspace.records).mockResolvedValue([approved]);
    mocks.reviewRecord.mockResolvedValue(approved);
    mocks.prepareExport.mockResolvedValue({ exportId: "export-1", exportedAt: "2026-09-15T08:00:00Z", store: exportStore, records: [approved] });
    mocks.downloadKphWorkbook.mockResolvedValue("KPH.xlsx");
    render(<App />);
    await screen.findAllByText("Sản phẩm từ máy chủ");

    const reviewSelect = screen.getAllByRole("combobox", { name: /Trạng thái duyệt phiếu online-record-1/ })[0]!;
    fireEvent.change(reviewSelect, { target: { value: "APPROVED" } });
    await waitFor(() => expect(mocks.reviewRecord).toHaveBeenCalledWith(managerWorkspace.store.id, "online-record-1", "APPROVED"));

    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn phiếu online-record-1" })[0]!);
    const exportButton = screen.getByRole("button", { name: "Xuất Excel" });
    expect(exportButton).toBeEnabled();
    fireEvent.click(exportButton);
    fireEvent.click(screen.getByRole("button", { name: "Xuất 1 dòng" }));
    await waitFor(() => expect(mocks.prepareExport).toHaveBeenCalledWith(managerWorkspace.store.id, "TPCN", ["online-record-1"]));
    expect(mocks.downloadKphWorkbook).toHaveBeenCalledWith("TPCN", [approved], {
      storeCode: exportStore.code,
      storeName: exportStore.name,
    });
    expect(screen.queryByRole("button", { name: /Xóa phiếu/ })).not.toBeInTheDocument();
  });

  it("surfaces the online export selection limit before sending a request", async () => {
    const managerWorkspace = workspace("STORE_MANAGER");
    const approved = { ...managerWorkspace.records[0]!, approvalStatus: "APPROVED" as const };
    resolveWorkspace({
      ...managerWorkspace,
      records: [approved],
    });
    mocks.onlineExportSelectionError.mockReturnValueOnce("Chỉ có thể xuất tối đa 500 phiếu mỗi lần. Hãy giảm số phiếu đã chọn rồi thử lại.");
    render(<App />);
    await screen.findAllByText("Sản phẩm từ máy chủ");

    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn phiếu online-record-1" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));

    expect(screen.getByText("Chỉ có thể xuất tối đa 500 phiếu mỗi lần. Hãy giảm số phiếu đã chọn rồi thử lại.")).toBeInTheDocument();
    expect(mocks.onlineExportSelectionError).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: "Xuất 1 dòng" })).not.toBeInTheDocument();
    expect(mocks.prepareExport).not.toHaveBeenCalled();
  });

  it("auto-filters inclusive detected dates with either bound and reports an inverted range", async () => {
    const base = workspace();
    const history = [
      { ...base.records[0]!, id: "in-range", detectedDate: "10/09/2026", productName: "Trong khoảng" },
      { ...base.records[0]!, id: "out-range", detectedDate: "09/09/2026", productName: "Ngoài khoảng" },
    ];
    mocks.getSession.mockResolvedValue(base.session);
    mocks.loadHistory.mockImplementation((_storeId: string, filter: { detectedFrom?: string; detectedTo?: string } = {}) => Promise.resolve(
      history.filter((record) => {
        const iso = record.detectedDate.split("/").reverse().join("-");
        return (!filter.detectedFrom || iso >= filter.detectedFrom)
          && (!filter.detectedTo || iso <= filter.detectedTo);
      }),
    ));
    render(<App />);
    await screen.findAllByText("Trong khoảng");

    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "10/09/2026" } });
    expect(await screen.findAllByText("Trong khoảng")).toHaveLength(2);
    expect(screen.queryByText("Ngoài khoảng")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Xóa lọc ngày" }));
    expect(await screen.findAllByText("Trong khoảng")).toHaveLength(2);
    expect(screen.getAllByText("Ngoài khoảng")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "09/09/2026" } });
    await waitFor(() => expect(screen.queryByText("Trong khoảng")).not.toBeInTheDocument());
    expect(await screen.findAllByText("Ngoài khoảng")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "11/09/2026" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Từ ngày không được sau đến ngày");
  });
});
