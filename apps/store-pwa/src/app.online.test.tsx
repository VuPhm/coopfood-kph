import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import sessionFixture from "../../../contracts/fixtures/api/session.json";
import { DEMO_RECORDS } from "./demo-records";
import type { OnlineWorkspace } from "./online-kph";

const mocks = vi.hoisted(() => ({
  loadWorkspace: vi.fn(),
  createRecord: vi.fn(),
  reviewRecord: vi.fn(),
  prepareExport: vi.fn(),
  lookupBarcode: vi.fn(),
  loadPilotRecords: vi.fn(),
  patchPilotRecords: vi.fn(),
  recordPilotExport: vi.fn(),
  savePilotRecord: vi.fn(),
  downloadKphWorkbook: vi.fn(),
}));

vi.mock("./online-kph", () => ({
  onlineModeEnabled: () => true,
  createOnlineGateway: () => ({
    loadWorkspace: mocks.loadWorkspace,
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

beforeEach(() => vi.resetAllMocks());

describe("Online workspace boundary", () => {
  it("shows loading without demo records or a premature empty state", () => {
    mocks.loadWorkspace.mockReturnValue(new Promise<OnlineWorkspace>(() => {}));
    render(<App />);

    expect(screen.getAllByText("Đang tải lịch sử từ máy chủ…")).toHaveLength(2);
    expect(screen.queryByText("Chưa có phiếu nào trên máy chủ.")).not.toBeInTheDocument();
    expect(screen.queryByText(DEMO_RECORDS[0]!.productName)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tạo phiếu TP khô/i })).toBeDisabled();
    expect(mocks.loadPilotRecords).not.toHaveBeenCalled();
  });

  it("keeps failed session data unavailable and allows retry into a genuine empty result", async () => {
    mocks.loadWorkspace.mockRejectedValueOnce(new Error("Phiên đăng nhập đã hết hạn."));
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Phiên đăng nhập đã hết hạn.");
    expect(screen.queryByText("Chưa có phiếu nào trên máy chủ.")).not.toBeInTheDocument();
    expect(screen.queryByText(DEMO_RECORDS[0]!.productName)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tạo phiếu TP khô/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Thiết lập cửa hàng/ })).not.toBeInTheDocument();

    mocks.loadWorkspace.mockResolvedValueOnce({ ...workspace(), records: [] });
    fireEvent.click(screen.getByRole("button", { name: "Thử tải lại" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getAllByText("Chưa có phiếu nào trên máy chủ.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Tạo phiếu TP khô/i })).toBeEnabled();
    expect(mocks.loadWorkspace).toHaveBeenCalledTimes(2);
  });

  it("keeps review, export and Pilot delete unavailable for online EMPLOYEE", async () => {
    mocks.loadWorkspace.mockResolvedValue(workspace("EMPLOYEE"));
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
    mocks.loadWorkspace.mockResolvedValue(managerWorkspace);
    mocks.reviewRecord.mockResolvedValue(approved);
    mocks.prepareExport.mockResolvedValue({ exportId: "export-1", exportedAt: "2026-09-15T08:00:00Z", records: [approved] });
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
    expect(mocks.downloadKphWorkbook).toHaveBeenCalledWith("TPCN", [approved], expect.objectContaining({ storeCode: managerWorkspace.store.code }));
    expect(screen.queryByRole("button", { name: /Xóa phiếu/ })).not.toBeInTheDocument();
  });

  it("filters visible history by an inclusive detected-date range and reports an inverted range", async () => {
    const base = workspace();
    mocks.loadWorkspace.mockResolvedValue({
      ...base,
      records: [
        { ...base.records[0]!, id: "in-range", detectedDate: "10/09/2026", productName: "Trong khoảng" },
        { ...base.records[0]!, id: "out-range", detectedDate: "09/09/2026", productName: "Ngoài khoảng" },
      ],
    });
    render(<App />);
    await screen.findAllByText("Trong khoảng");

    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "10/09/2026" } });
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "10/09/2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Lọc ngày" }));
    expect(screen.getAllByText("Trong khoảng")).toHaveLength(2);
    expect(screen.queryByText("Ngoài khoảng")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "11/09/2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Lọc ngày" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Từ ngày không được sau đến ngày");
  });
});
