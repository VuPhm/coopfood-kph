import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { StoreBarcodeLookup } from "./store-barcode-lookup";
import { OnlineApiError } from "./online-kph";
import type { components } from "@coopfood-kph/api";

vi.mock("./barcode-scanner-dialog", () => ({ BarcodeScannerDialog: ({ open, onScan, onOpenChange }: { open: boolean; onScan: (code: string) => void; onOpenChange: (open: boolean) => void }) => open ? <button onClick={() => { onScan("001234"); onOpenChange(false); }}>Simulate scan</button> : null }));
type Result = components["schemas"]["BarcodeLookupResponse"];
const found: Result = { status: "FOUND", barcode: "001234", product: { id: "product", barcode: "001234", skuCode: "000042", name: "Hàng tổng hợp", primarySupplier: { code: "0007", name: "NCC tổng hợp" } } };
const missing: Result = { status: "NOT_FOUND", barcode: "000000" };
function setup(lookup = vi.fn().mockResolvedValue(found), expired = vi.fn()) {
  const client = new QueryClient();
  const view = render(<QueryClientProvider client={client}><StoreBarcodeLookup storeId="store-a" lookupBarcode={lookup} onSessionExpired={expired} /></QueryClientProvider>);
  return { lookup, expired, ...view };
}
function search(code: string) { fireEvent.change(screen.getByLabelText("Barcode", { exact: true }), { target: { value: code } }); fireEvent.click(screen.getByRole("button", { name: "Tra cứu" })); }

describe("Store barcode API flow", () => {
  it("shows one found product with string identifiers and the requested store", async () => {
    const { lookup } = setup(); search("001234"); await screen.findByText("Hàng tổng hợp");
    expect(screen.getByText("000042")).toBeInTheDocument(); expect(screen.getByText("0007")).toBeInTheDocument();
    expect(lookup).toHaveBeenCalledWith("store-a", "001234", expect.any(AbortSignal));
    expect(screen.queryByRole("button", { name: "Nhập tay" })).not.toBeInTheDocument();
  });
  it("routes a scan into the same real gateway callback", async () => {
    const { lookup } = setup(); fireEvent.click(screen.getByRole("button", { name: "Quét barcode" }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate scan" })); await screen.findByText("Hàng tổng hợp");
    expect(lookup).toHaveBeenCalledWith("store-a", "001234", expect.any(AbortSignal));
  });
  it("allows rescan/manual on NOT_FOUND and retains barcode/status without guessing", async () => {
    setup(vi.fn().mockResolvedValue(missing)); search("000000"); await screen.findByText("Không tìm thấy barcode 000000.");
    expect(screen.getByRole("button", { name: "Quét lại" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nhập tay" }));
    expect(screen.getByRole("group", { name: "Thông tin nhập tay" })).toHaveAttribute("data-lookup-status", "NOT_FOUND");
    expect(screen.getByRole("group", { name: "Thông tin nhập tay" })).toHaveAttribute("data-barcode", "000000");
    expect(screen.getByLabelText("Tên sản phẩm")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Tên sản phẩm"), { target: { value: "Nhập tay" } });
    fireEvent.change(screen.getByLabelText("Barcode", { exact: true }), { target: { value: "new" } });
    expect(screen.queryByText("Thông tin nhập tay")).not.toBeInTheDocument(); expect(screen.queryByText("Hàng tổng hợp")).not.toBeInTheDocument();
  });
  it.each([403, 503, undefined])("does not turn error %s into NOT_FOUND/manual", async status => {
    setup(vi.fn().mockRejectedValue(status ? new OnlineApiError("error", status) : new TypeError("offline")));
    search("001234"); await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "Nhập tay" })).not.toBeInTheDocument();
    expect(screen.queryByText("Hàng tổng hợp")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Barcode", { exact: true })).toHaveValue("001234");
  });
  it("returns 401 to the session boundary", async () => {
    const { expired } = setup(vi.fn().mockRejectedValue(new OnlineApiError("expired", 401)));
    search("001234"); await waitFor(() => expect(expired).toHaveBeenCalledOnce());
  });
  it("retries a temporary failure without inventing catalog data", async () => {
    const lookup = vi.fn().mockRejectedValueOnce(new OnlineApiError("not ready", 503)).mockResolvedValue(found);
    setup(lookup); search("001234"); await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Thử tra cứu lại" })); await screen.findByText("Hàng tổng hợp");
    expect(lookup).toHaveBeenCalledTimes(2);
  });
  it("aborts obsolete requests and ignores late results after another barcode", async () => {
    let resolveFirst!: (result: Result) => void;
    const lookup = vi.fn().mockImplementationOnce(() => new Promise<Result>(resolve => { resolveFirst = resolve; })).mockResolvedValue(missing);
    setup(lookup); search("001234"); await waitFor(() => expect(lookup).toHaveBeenCalledOnce());
    const signal = lookup.mock.calls[0]?.[2] as AbortSignal;
    search("000000"); await screen.findByText("Không tìm thấy barcode 000000.");
    expect(signal.aborted).toBe(true);
    await act(async () => resolveFirst(found)); expect(screen.queryByText("Hàng tổng hợp")).not.toBeInTheDocument();
  });
});
