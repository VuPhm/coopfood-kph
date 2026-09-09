import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import sessionFixture from "../../../contracts/fixtures/api/session.json";
import { DEMO_RECORDS } from "./demo-records";
import type { OnlineWorkspace } from "./online-kph";

const mocks = vi.hoisted(() => ({
  loadWorkspace: vi.fn(),
  createRecord: vi.fn(),
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

  it.each(["EMPLOYEE", "STORE_MANAGER"] as const)("keeps Pilot actions unavailable for online %s in table and cards", async (role) => {
    mocks.loadWorkspace.mockResolvedValue(workspace(role));
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
});
