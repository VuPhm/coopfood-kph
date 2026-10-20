import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateRecordDialog } from "./create-record-dialog";
import { type SkuMemory } from "./sku-memory";

vi.mock("./barcode-scanner-dialog", () => ({ BarcodeScannerDialog: ({ open, onScan, onOpenChange }: { open: boolean; onScan: (code: string) => void; onOpenChange: (open: boolean) => void }) => open ? <button onClick={() => { onScan("2912345612345"); onOpenChange(false); }}>Trả mã scanner tổng hợp</button> : null }));

const skuMemory: SkuMemory = new Map([
  ["TPCN:000123", { productName: "Hàng tổng hợp A", supplier: "NCC tổng hợp A" }],
  ["TPCN:000456", { productName: "Hàng tổng hợp B", supplier: "NCC tổng hợp B" }],
  ["TPTS:2912345612345", { productName: "Tươi sống tổng hợp", supplier: "NCC tươi sống" }],
]);
const barcode = () => screen.getByRole("textbox", { name: "Mã SKU / UPC" });
const product = () => screen.getByRole("textbox", { name: "Tên hàng hóa" });
const supplier = () => screen.getByRole("textbox", { name: "Nhà cung cấp" });
function complete(code: string) {
  fireEvent.change(barcode(), { target: { value: code } });
  fireEvent.blur(barcode());
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("SKU memory completion", () => {
  it.each(["blur", "pause"])("fills only the remembered fields after manual %s", async (interaction) => {
    vi.useFakeTimers();
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    const date = screen.getByRole("textbox", { name: "Ngày phát hiện" }).getAttribute("value");
    fireEvent.change(barcode(), { target: { value: "000123" } });
    expect(product()).toHaveValue("");
    if (interaction === "blur") fireEvent.blur(barcode());
    else {
      await act(async () => { vi.advanceTimersByTime(499); });
      expect(product()).toHaveValue("");
      await act(async () => { vi.advanceTimersByTime(1); });
    }
    expect(product()).toHaveValue("Hàng tổng hợp A");
    expect(supplier()).toHaveValue("NCC tổng hợp A");
    expect(screen.getByText(/Đã điền tên hàng và nhà cung cấp từ phiếu đã lưu/)).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("1");
    expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Ngày phát hiện" })).toHaveAttribute("value", date);
    expect(screen.getByRole("textbox", { name: "Ngày xử lý (nếu có)" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Tên người nhập" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Ghi chú" })).toHaveValue("");
    expect(screen.queryByLabelText("Ảnh đã chọn")).not.toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Biện pháp xử lý" })).getByRole("radio", { name: "HỦY" })).toBeChecked();
  });

  it("uses the same completion for scanner metadata and TPTS weight", () => {
    render(<CreateRecordDialog kind="TPTS" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Quét mã barcode" }));
    fireEvent.click(screen.getByText("Trả mã scanner tổng hợp"));
    expect(barcode()).toHaveValue("2912345612345");
    expect(product()).toHaveValue("Tươi sống tổng hợp");
    expect(supplier()).toHaveValue("NCC tươi sống");
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("1.234");
    expect(screen.getByRole("radio", { name: "kg" })).toBeChecked();
  });

  it("keeps manual fields and fills only the empty field", () => {
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(product(), { target: { value: "Tên nhập tay" } });
    complete("000123");
    expect(product()).toHaveValue("Tên nhập tay");
    expect(supplier()).toHaveValue("NCC tổng hợp A");
    expect(screen.getByText(/Đã điền nhà cung cấp từ phiếu đã lưu/)).toBeVisible();
  });

  it("does not restore a deliberately cleared field on repeated completion of the same code", () => {
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    complete("000123");
    fireEvent.change(product(), { target: { value: "" } });
    fireEvent.blur(barcode());
    expect(product()).toHaveValue("");
    expect(supplier()).toHaveValue("NCC tổng hợp A");
  });

  it("replaces auto-filled fields for a new known code and clears them for an unknown code", () => {
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    complete("000123");
    fireEvent.change(barcode(), { target: { value: "000456" } });
    expect(product()).toHaveValue("");
    expect(supplier()).toHaveValue("");
    fireEvent.blur(barcode());
    expect(product()).toHaveValue("Hàng tổng hợp B");
    expect(supplier()).toHaveValue("NCC tổng hợp B");
    complete("unknown-code");
    expect(product()).toHaveValue("");
    expect(supplier()).toHaveValue("");
    expect(screen.queryByText(/từ phiếu đã lưu có mã này/)).not.toBeInTheDocument();
  });

  it("preserves manually corrected values when switching codes", () => {
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    complete("000123");
    fireEvent.change(supplier(), { target: { value: "NCC đã sửa tay" } });
    complete("000456");
    expect(product()).toHaveValue("Hàng tổng hợp B");
    expect(supplier()).toHaveValue("NCC đã sửa tay");
  });

  it.each(["123", "NHẬP TAY", "", "2912345612345"])("does not infer a TPCN product for unmatched code %s", (code) => {
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    complete(code);
    expect(product()).toHaveValue("");
    expect(supplier()).toHaveValue("");
  });

  it("does not reuse product memory for a different weight barcode, while weight parsing still works", () => {
    render(<CreateRecordDialog kind="TPTS" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    complete("2912345602505");
    expect(product()).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("0.25");
  });

  it("cancels delayed completion on close and kind change", async () => {
    vi.useFakeTimers();
    const props = { kind: "TPCN" as const, open: true, skuMemory, onOpenChange: vi.fn(), onSaved: vi.fn() };
    const view = render(<CreateRecordDialog {...props} />);
    fireEvent.change(barcode(), { target: { value: "000123" } });
    view.rerender(<CreateRecordDialog {...props} open={false} />);
    await act(async () => { vi.advanceTimersByTime(500); });
    view.rerender(<CreateRecordDialog {...props} />);
    expect(product()).toHaveValue("");
    fireEvent.change(barcode(), { target: { value: "000456" } });
    view.rerender(<CreateRecordDialog {...props} kind="TPTS" />);
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(product()).toHaveValue("");
    expect(supplier()).toHaveValue("");
  });

  it("keeps a manual quantity edit while still completing remembered product fields", async () => {
    vi.useFakeTimers();
    render(<CreateRecordDialog kind="TPTS" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(barcode(), { target: { value: "2912345612345" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Số lượng" }), { target: { value: "7" } });
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(product()).toHaveValue("Tươi sống tổng hợp");
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("7");
    expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();
  });

  it("does not look up memory after unmount", async () => {
    vi.useFakeTimers();
    const lookup = vi.spyOn(skuMemory, "get");
    const view = render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(barcode(), { target: { value: "000123" } });
    view.unmount();
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(lookup).not.toHaveBeenCalled();
  });
});
