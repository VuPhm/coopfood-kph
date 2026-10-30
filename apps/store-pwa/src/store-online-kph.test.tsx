import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { StoreOnlineKph } from "./store-online-kph";
import { OnlineApiError, type OnlineHistoryPage } from "./online-kph";
import type { RecordView } from "./record-view";

const record: RecordView = { id: "record-a", kind: "TPTS", detectedDate: "09/09/2026", detectedBy: "Nhân viên tổng hợp", sku: "000042", barcode: "001234", productName: "Sản phẩm A", supplier: "NCC A", quantity: "2 kg", quantityValue: 2, unit: "kg", condition: "Dập úng", resolution: "HỦY", treatmentDate: "", approvalStatus: "PENDING", photos: [{ id: "photo", src: "/api/private/photo", alt: "Ảnh tổng hợp" }] };
const page: OnlineHistoryPage = { records: [record], page: 1, pageSize: 25, totalItems: 31, totalPages: 2, typeTotals: { TPCN: 9, TPTS: 31 } };
function setup(load = vi.fn().mockResolvedValue(page), expired = vi.fn()) {
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><StoreOnlineKph key="user/store-a" userId="user" storeId="store-a" loadHistory={load} onSessionExpired={expired} /></QueryClientProvider>);
  return { load, expired };
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
    setup(load); await screen.findByText("31 phiếu"); fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await screen.findByText("Không có quyền xem phiếu tại cửa hàng này.");
    expect(screen.queryByRole("button", { name: "Mở phiếu Sản phẩm A" })).not.toBeInTheDocument();
  });
  it("returns an expired session to the parent boundary", async () => {
    const { expired } = setup(vi.fn().mockRejectedValue(new OnlineApiError("expired", 401)));
    await waitFor(() => expect(expired).toHaveBeenCalledOnce());
  });
});
