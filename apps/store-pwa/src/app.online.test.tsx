import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    loadHistory: mocks.loadHistory,
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
    expect(screen.queryByRole("button", { name: /Tạo phiếu TP khô/i })).not.toBeInTheDocument();
    expect(mocks.loadPilotRecords).not.toHaveBeenCalled();
  });

  it("keeps failed session data unavailable and allows retry into a genuine empty result", async () => {
    mocks.getSession.mockRejectedValueOnce(new Error("Phiên đăng nhập đã hết hạn."));
    render(<App />);

    expect(await screen.findByText("Phiên đăng nhập đã hết hạn.")).toBeVisible();
    expect(screen.queryByText("Chưa có phiếu nào trên máy chủ.")).not.toBeInTheDocument();
    expect(screen.queryByText(DEMO_RECORDS[0]!.productName)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tạo phiếu TP khô/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thiết lập cửa hàng/ })).not.toBeInTheDocument();

    const emptyWorkspace = { ...workspace(), records: [] };
    mocks.login.mockResolvedValueOnce(emptyWorkspace.session);
    mocks.loadHistory.mockResolvedValueOnce([]);
    fireEvent.change(screen.getByRole("textbox", { name: "Tên đăng nhập" }), { target: { value: "demo" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findAllByText("Chưa có phiếu nào trên máy chủ.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Tạo phiếu TP khô/i })).toBeEnabled();
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

    fireEvent.click(screen.getByRole("button", { name: /Tạo phiếu TP khô/i }));
    const actor = screen.getByRole("textbox", { name: /Tên người nhập/ });
    expect(actor).toHaveValue(sessionFixture.user.displayName);
    expect(actor).toHaveAttribute("readonly");
    expect(mocks.loadPilotRecords).not.toHaveBeenCalled();
    expect(mocks.patchPilotRecords).not.toHaveBeenCalled();
    expect(mocks.recordPilotExport).not.toHaveBeenCalled();
    expect(mocks.savePilotRecord).not.toHaveBeenCalled();
    expect(mocks.downloadKphWorkbook).not.toHaveBeenCalled();
  });

  it("lets an online STORE_MANAGER review and export an approved server snapshot without delete", async () => {
    const managerWorkspace = workspace("STORE_MANAGER");
    const approved = { ...managerWorkspace.records[0]!, approvalStatus: "APPROVED" as const, reviewedBy: managerWorkspace.session.user.displayName };
    const exportStore = { ...managerWorkspace.store, code: "0456", name: "Snapshot từ máy chủ" };
    resolveWorkspace(managerWorkspace);
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
    resolveWorkspace({
      ...base,
      records: [
        { ...base.records[0]!, id: "in-range", detectedDate: "10/09/2026", productName: "Trong khoảng" },
        { ...base.records[0]!, id: "out-range", detectedDate: "09/09/2026", productName: "Ngoài khoảng" },
      ],
    });
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
