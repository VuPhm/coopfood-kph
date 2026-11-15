import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { StoreOnlineKph } from "./store-online-kph";
import { OnlineApiError, type OnlineHistoryPage } from "./online-kph";
import type { RecordView } from "./record-view";

const record: RecordView = { id: "record-a", kind: "TPTS", detectedDate: "09/09/2026", detectedBy: "Nhân viên tổng hợp", sku: "000042", barcode: "001234", productName: "Sản phẩm A", supplier: "NCC A", quantity: "2 kg", quantityValue: 2, unit: "kg", condition: "Dập úng", resolution: "HỦY", treatmentDate: "", approvalStatus: "PENDING", photos: [{ id: "photo", src: "/api/private/photo", alt: "Ảnh tổng hợp" }] };
const page: OnlineHistoryPage = { records: [record], page: 1, pageSize: 25, totalItems: 31, totalPages: 2, typeTotals: { TPCN: 9, TPTS: 31 } };
function setup(load = vi.fn().mockResolvedValue(page), expired = vi.fn(), actions: Partial<React.ComponentProps<typeof StoreOnlineKph>> = {}) {
  const client = new QueryClient();
  const view = render(<QueryClientProvider client={client}><StoreOnlineKph key="user/store-a" userId="user" storeId="store-a" loadHistory={load} onSessionExpired={expired} {...actions} /></QueryClientProvider>);
  return { load, expired, client, ...view };
}
describe("online KPH history", () => {
  it("requests one server page, uses server totals and opens full detail without write actions", async () => {
    const { load } = setup(); fireEvent.click(await screen.findByRole("button", { name: "Mở phiếu Sản phẩm A" }));
    const detail = await screen.findByRole("dialog", { name: "Phiếu KPH" });
    expect(detail).toHaveTextContent("001234"); expect(detail).toHaveTextContent("Nhân viên tổng hợp");
    expect(screen.getByRole("button", { name: "Xem ảnh 1" }).querySelector("img")).toHaveAttribute("src", "/api/private/photo");
    expect(screen.queryByRole("button", { name: "Duyệt phiếu" })).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledWith("store-a", { type: "TPTS", page: 1, pageSize: 25 }, expect.any(AbortSignal));
  });
  it("paginates server-side, disables old rows while loading, and replaces rather than appends", async () => {
    let release!: (value: OnlineHistoryPage) => void;
    const load = vi.fn().mockResolvedValueOnce(page).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    setup(load); await screen.findByText("31 phiếu"); fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeDisabled();
    expect(document.querySelector('.store-kph-row-open, .store-ticket-open')).toBeDisabled();
    await act(async () => release({ ...page, page: 2, records: [{ ...record, id: "record-b", productName: "Sản phẩm B" }] }));
    await screen.findByRole("button", { name: "Mở phiếu Sản phẩm B" });
    expect(screen.queryByRole("button", { name: "Mở phiếu Sản phẩm A" })).not.toBeInTheDocument();
    expect(screen.getByText("Trang 2/2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /TP khô/ }));
    await waitFor(() => expect(load).toHaveBeenLastCalledWith("store-a", expect.objectContaining({ type: "TPCN", page: 1 }), expect.any(AbortSignal)));
  });
  it("sends validated Vietnamese dates, approval, sort and direction to the backend", async () => {
    const { load } = setup(); await screen.findByText("31 phiếu");
    fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "09/09/2026" } });
    await waitFor(() => expect(load).toHaveBeenLastCalledWith("store-a", expect.objectContaining({ detectedFrom: "2026-09-09", page: 1 }), expect.any(AbortSignal)));
    fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "APPROVED" } });
    fireEvent.change(screen.getByLabelText("Sắp xếp"), { target: { value: "product" } });
    fireEvent.change(screen.getByLabelText("Thứ tự"), { target: { value: "ascending" } });
    await waitFor(() => expect(load).toHaveBeenLastCalledWith("store-a", expect.objectContaining({ approvalStatus: "APPROVED", sort: "product", direction: "ascending", page: 1 }), expect.any(AbortSignal)));
    const before = load.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "01/01/2026" } });
    await screen.findByRole("alert"); expect(load).toHaveBeenCalledTimes(before);
    expect(screen.queryByRole("button", { name: "Mở phiếu Sản phẩm A" })).not.toBeInTheDocument();
  });
  it("does not show old records after a denied page request", async () => {
    const load = vi.fn().mockResolvedValueOnce(page).mockRejectedValue(new OnlineApiError("denied", 403));
    const { expired } = setup(load); await screen.findByText("31 phiếu"); fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await screen.findByText("Không có quyền xem phiếu tại cửa hàng này.");
    expect(screen.queryByRole("button", { name: "Mở phiếu Sản phẩm A" })).not.toBeInTheDocument();
    await waitFor(() => expect(expired).toHaveBeenCalledOnce());
  });
  it("returns an expired session to the parent boundary", async () => {
    const { expired } = setup(vi.fn().mockRejectedValue(new OnlineApiError("expired", 401)));
    await waitFor(() => expect(expired).toHaveBeenCalledOnce());
  });
});

describe("online KPH privileged actions", () => {
  it("persists review through the gateway, blocks duplicate/close while pending and refreshes D01", async () => {
    let release!: (value: RecordView) => void;
    const reviewRecord = vi.fn().mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const load = vi.fn().mockResolvedValueOnce(page).mockResolvedValue({ ...page, records: [{ ...record, approvalStatus: "APPROVED", reviewedBy: "Quản lý" }] });
    setup(load, vi.fn(), { canReview: true, reviewRecord });
    fireEvent.click(await screen.findByRole("button", { name: "Mở phiếu Sản phẩm A" }));
    fireEvent.click(screen.getByRole("button", { name: "Duyệt phiếu" }));
    expect(screen.getByRole("button", { name: "Đang cập nhật…" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Không duyệt" }));
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(screen.getByRole("dialog", { name: "Phiếu KPH" })).toBeInTheDocument();
    expect(reviewRecord).toHaveBeenCalledExactlyOnceWith("store-a", "record-a", "APPROVED");
    await act(async () => release({ ...record, approvalStatus: "APPROVED" }));
    await screen.findByText("Đã duyệt phiếu");
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    fireEvent.click(await screen.findByRole("button", { name: "Mở phiếu Sản phẩm A" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Quản lý");
    expect(screen.getByRole("button", { name: "Duyệt phiếu" })).toBeDisabled();
  });
  it("uses only approved selected records from the current page and resets on page/filter/type", async () => {
    const approved = { ...record, approvalStatus: "APPROVED" as const };
    const load = vi.fn().mockResolvedValue({ ...page, records: [approved, { ...record, id: "pending", productName: "Chờ" }] });
    const prepareExport = vi.fn().mockRejectedValue(new Error("offline"));
    setup(load, vi.fn(), { canExport: true, prepareExport });
    await waitFor(() => expect(screen.getByRole("button", { name: "Chọn" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Chọn Sản phẩm A" })).toBeEnabled());
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn Sản phẩm A" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn Chờ" }));
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("1 phiếu đã duyệt");
    expect(screen.getByRole("dialog")).toHaveTextContent("Không đưa vào file1 phiếu");
    fireEvent.click(screen.getByRole("button", { name: "Tải xuống" }));
    await screen.findByRole("alert");
    expect(prepareExport).toHaveBeenCalledExactlyOnceWith("store-a", "TPTS", ["record-a"]);
    expect(screen.queryByText("Đã tạo file Excel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(screen.getByText("0 đã chọn")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Chọn Sản phẩm A" })).toBeEnabled());
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn Sản phẩm A" }));
    fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
    fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "APPROVED" } });
    await waitFor(() => expect(load).toHaveBeenCalledTimes(3));
    expect(screen.getByText("0 đã chọn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Chọn Sản phẩm A" })).toBeEnabled());
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn Sản phẩm A" }));
    fireEvent.click(screen.getByRole("button", { name: /TP khô/ }));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(4));
    expect(screen.getByText("0 đã chọn")).toBeInTheDocument();
  });
  it("revalidates authority on denied review without a false success", async () => {
    const expired = vi.fn();
    setup(undefined, expired, { canReview: true, reviewRecord: vi.fn().mockRejectedValue(new OnlineApiError("denied", 403)) });
    fireEvent.click(await screen.findByRole("button", { name: "Mở phiếu Sản phẩm A" }));
    fireEvent.click(screen.getByRole("button", { name: "Không duyệt" }));
    await waitFor(() => expect(expired).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Đã ghi nhận không duyệt")).not.toBeInTheDocument();
  });
  it("discards an in-flight export after scope suspension even if the old response succeeds", async () => {
    let release!: (value: unknown) => void;
    const prepareExport = vi.fn().mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const load = vi.fn().mockResolvedValue({ ...page, records: [{ ...record, approvalStatus: "APPROVED" }] });
    const client = new QueryClient();
    const props = { userId: "user", storeId: "store-a", loadHistory: load, onSessionExpired: vi.fn(), canExport: true, prepareExport };
    const view = render(<QueryClientProvider client={client}><StoreOnlineKph {...props} /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Chọn" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Chọn Sản phẩm A" })).toBeEnabled());
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn Sản phẩm A" }));
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
    fireEvent.click(screen.getByRole("button", { name: "Tải xuống" }));
    view.rerender(<QueryClientProvider client={client}><StoreOnlineKph {...props} suspended /></QueryClientProvider>);
    view.rerender(<QueryClientProvider client={client}><StoreOnlineKph {...props} canExport={false} /></QueryClientProvider>);
    await act(async () => release({}));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Đã tạo file Excel")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Chọn" })).not.toBeInTheDocument();
  });
});

it("refreshes committed reviews even when a benign scope recheck supersedes the response", async () => {
  let release!: (value: RecordView) => void;
  const reviewRecord = vi.fn().mockImplementation(() => new Promise(resolve => { release = resolve; }));
  const load = vi.fn().mockResolvedValueOnce(page).mockResolvedValue({ ...page, records: [{ ...record, approvalStatus: "APPROVED", reviewedBy: "Quản lý" }] });
  const client = new QueryClient();
  const props = { userId: "user", storeId: "store-a", loadHistory: load, onSessionExpired: vi.fn(), canReview: true, reviewRecord };
  const view = render(<QueryClientProvider client={client}><StoreOnlineKph {...props} /></QueryClientProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Mở phiếu Sản phẩm A" }));
  fireEvent.click(screen.getByRole("button", { name: "Duyệt phiếu" }));
  view.rerender(<QueryClientProvider client={client}><StoreOnlineKph {...props} suspended /></QueryClientProvider>);
  view.rerender(<QueryClientProvider client={client}><StoreOnlineKph {...props} /></QueryClientProvider>);
  await act(async () => release({ ...record, approvalStatus: "APPROVED" }));
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  expect(screen.queryByText("Đã duyệt phiếu")).not.toBeInTheDocument();
  expect(screen.getByRole("dialog")).toHaveTextContent("Quản lý");
  expect(screen.getByRole("button", { name: "Duyệt phiếu" })).toBeDisabled();
});
