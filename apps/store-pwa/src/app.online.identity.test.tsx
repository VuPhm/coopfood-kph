import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import sessionFixture from "../../../contracts/fixtures/api/session.json";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  loadHistory: vi.fn(),
  loadWorkspace: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  createRecord: vi.fn(),
  lookupBarcode: vi.fn(),
}));

vi.mock("./online-kph", () => ({
  onlineModeEnabled: () => true,
  createOnlineGateway: () => ({
    getSession: mocks.getSession,
    loadHistory: mocks.loadHistory,
    loadWorkspace: mocks.loadWorkspace,
    login: mocks.login,
    logout: mocks.logout,
    createRecord: mocks.createRecord,
    lookupBarcode: mocks.lookupBarcode,
  }),
}));

import { App } from "./app";

const storeA = { ...sessionFixture.user.stores[0]!, id: "20000000-0000-4000-8000-000000000001" };
const storeB = { ...sessionFixture.user.stores[0]!, id: "20000000-0000-4000-8000-000000000002", code: "CF-DEMO-002", name: "Lý Thường Kiệt" };
const session = { ...sessionFixture, user: { ...sessionFixture.user, stores: [storeA, storeB] } };

function record(id: string, productName: string) {
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

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue(session);
  mocks.loadHistory.mockImplementation((storeId: string) => Promise.resolve([record(storeId, storeId === storeA.id ? "Phiếu cửa hàng A" : "Phiếu cửa hàng B")]));
  mocks.login.mockResolvedValue(session);
  mocks.logout.mockResolvedValue(undefined);
});

describe("online identity and scoped query state", () => {
  it("shows login after session expiry, logs in, and logs out through the API", async () => {
    const expired = Object.assign(new Error("Phiên đăng nhập đã hết hạn."), { status: 401 });
    mocks.getSession.mockRejectedValueOnce(expired);
    render(<App />);

    expect(await screen.findByText("Đăng nhập Store PWA")).toBeVisible();
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

  it("keys history by user and store and clears the previous store records immediately", async () => {
    render(<App />);
    expect(await screen.findAllByText("Phiếu cửa hàng A")).toHaveLength(2);
    const context = screen.getByRole("group", { name: /Cửa hàng hiện tại/ });
    const switcher = within(context).getByRole("combobox", { name: "Chọn cửa hàng" });
    fireEvent.change(switcher, { target: { value: storeB.id } });
    await waitFor(() => expect(mocks.loadHistory).toHaveBeenCalledWith(storeB.id, expect.anything()));
    expect(await screen.findAllByText("Phiếu cửa hàng B")).toHaveLength(2);
    expect(screen.queryByText("Phiếu cửa hàng A")).not.toBeInTheDocument();
  });
});
