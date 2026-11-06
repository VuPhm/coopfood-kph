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
const barcode = () => screen.getByRole("combobox", { name: "Mã SKU / UPC" });
const product = () => screen.getByRole("textbox", { name: "Tên hàng hóa" });
const supplier = () => screen.getByRole("textbox", { name: "Nhà cung cấp" });
function complete(code: string) {
  fireEvent.change(barcode(), { target: { value: code } });
  fireEvent.blur(barcode());
  chooseSuggestion();
}
function chooseSuggestion() {
  const button = screen.queryByRole("option");
  if (button) fireEvent.click(button);
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
    expect(product()).toHaveValue("");
    chooseSuggestion();
    expect(product()).toHaveValue("Hàng tổng hợp A");
    expect(supplier()).toHaveValue("NCC tổng hợp A");
    expect(screen.queryByText(/Đã điền/)).not.toBeInTheDocument();
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
    expect(product()).toHaveValue("");
    chooseSuggestion();
    chooseSuggestion();
    expect(product()).toHaveValue("Tươi sống tổng hợp");
    expect(supplier()).toHaveValue("NCC tươi sống");
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("1.234");
    expect(screen.getByRole("radio", { name: "kg" })).toBeChecked();
  });

  it("fills remembered values only when explicitly chosen, including manually entered fields", () => {
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(product(), { target: { value: "Tên nhập tay" } });
    complete("000123");
    expect(product()).toHaveValue("Hàng tổng hợp A");
    expect(supplier()).toHaveValue("NCC tổng hợp A");
    expect(screen.queryByText(/Đã điền/)).not.toBeInTheDocument();
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
    chooseSuggestion();
    expect(product()).toHaveValue("Hàng tổng hợp B");
    expect(supplier()).toHaveValue("NCC tổng hợp B");
    complete("unknown-code");
    expect(product()).toHaveValue("");
    expect(supplier()).toHaveValue("");
    expect(screen.queryByText(/từ phiếu đã lưu có mã này/)).not.toBeInTheDocument();
  });

  it("applies a newly chosen suggestion when switching codes", () => {
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    complete("000123");
    fireEvent.change(supplier(), { target: { value: "NCC đã sửa tay" } });
    complete("000456");
    expect(product()).toHaveValue("Hàng tổng hợp B");
    expect(supplier()).toHaveValue("NCC tổng hợp B");
  });

  it.each(["999", "NHẬP TAY", "", "2912345612345"])("does not infer a TPCN product for unmatched code %s", (code) => {
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
    chooseSuggestion();
    expect(product()).toHaveValue("Tươi sống tổng hợp");
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("7");
    expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();
  });

  it.each(["pending", "completed"])("preserves manual quantity and unit through repeated blur after %s completion", async (timing) => {
    vi.useFakeTimers();
    render(<CreateRecordDialog kind="TPTS" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(barcode(), { target: { value: "2912345612345" } });
    if (timing === "completed") await act(async () => { vi.advanceTimersByTime(500); });
    fireEvent.change(screen.getByRole("textbox", { name: "Số lượng" }), { target: { value: "7,5" } });
    fireEvent.click(screen.getByRole("radio", { name: "EA" }));
    fireEvent.blur(barcode());
    fireEvent.blur(barcode());
    await act(async () => { vi.advanceTimersByTime(500); });
    chooseSuggestion();
    expect(product()).toHaveValue("Tươi sống tổng hợp");
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("7,5");
    expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();
    expect(screen.queryByText("Trọng lượng đã được trích xuất từ mã barcode.")).not.toBeInTheDocument();
  });

  it.each(["new code", "scanner"])("starts a new weight extraction after a manual edit followed by %s", (interaction) => {
    render(<CreateRecordDialog kind="TPTS" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    complete("2912345612345");
    fireEvent.change(screen.getByRole("textbox", { name: "Số lượng" }), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("radio", { name: "EA" }));
    if (interaction === "new code") complete("2912345602505");
    else {
      fireEvent.click(screen.getByRole("button", { name: "Quét mã barcode" }));
      fireEvent.click(screen.getByText("Trả mã scanner tổng hợp"));
    }
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue(interaction === "new code" ? "0.25" : "1.234");
    expect(screen.getByRole("radio", { name: "kg" })).toBeChecked();
    expect(screen.getByText("Trọng lượng đã được trích xuất từ mã barcode.")).toBeVisible();
  });

  it("keeps a manual unit-only change when the same barcode blurs again", () => {
    render(<CreateRecordDialog kind="TPTS" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    complete("2912345612345");
    fireEvent.click(screen.getByRole("radio", { name: "EA" }));
    fireEvent.blur(barcode());
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("1.234");
    expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();
  });

  it("does not publish a stale known code while typing a different code", async () => {
    vi.useFakeTimers();
    render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(barcode(), { target: { value: "000123" } });
    await act(async () => { vi.advanceTimersByTime(499); });
    fireEvent.change(barcode(), { target: { value: "000456" } });
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(product()).toHaveValue("");
    expect(supplier()).toHaveValue("");
    await act(async () => { vi.advanceTimersByTime(499); });
    expect(product()).toHaveValue("");
    chooseSuggestion();
    expect(product()).toHaveValue("Hàng tổng hợp B");
    expect(supplier()).toHaveValue("NCC tổng hợp B");
  });

  it("preserves a corrected draft and a deliberately cleared field across close/reopen", () => {
    const props = { kind: "TPCN" as const, open: true, skuMemory, onOpenChange: vi.fn(), onSaved: vi.fn() };
    const view = render(<CreateRecordDialog {...props} />);
    complete("000123");
    fireEvent.change(product(), { target: { value: "Tên sửa tay" } });
    fireEvent.change(supplier(), { target: { value: "" } });
    view.rerender(<CreateRecordDialog {...props} open={false} />);
    view.rerender(<CreateRecordDialog {...props} />);
    fireEvent.blur(barcode());
    expect(product()).toHaveValue("Tên sửa tay");
    expect(supplier()).toHaveValue("");
    expect(screen.queryByText(/từ phiếu đã lưu có mã này/)).not.toBeInTheDocument();
  });

  it("does not look up memory after unmount", async () => {
    vi.useFakeTimers();
    const lookup = vi.spyOn(skuMemory, "get");
    const view = render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(barcode(), { target: { value: "000123" } });
    lookup.mockClear();
    view.unmount();
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(lookup).not.toHaveBeenCalled();
  });
});

it.each(["TPCN", "TPTS"] as const)("prefills %s similar records including custom choices, without stale weight extraction", (kind) => {
  const template = { id: "copy-source", kind, detectedDate: "01/01/2020", detectedBy: "Người cũ", sku: "2912345612345", supplier: "NCC nguồn", productName: "Hàng nguồn", quantity: "7.5 EA", quantityValue: 7.5, unit: "EA" as const, condition: "Chi tiết tình trạng riêng", resolution: "Chi tiết biện pháp riêng", treatmentDate: "02/01/2020", approvalStatus: "APPROVED" as const, photos: [], note: "Ghi chú nguồn" };
  render(<CreateRecordDialog kind={kind} template={template} open onOpenChange={vi.fn()} onSaved={vi.fn()} />);
  expect(barcode()).toHaveValue(template.sku);
  expect(product()).toHaveValue(template.productName);
  expect(supplier()).toHaveValue(template.supplier);
  expect(screen.getByLabelText("Nội dung tình trạng khác")).toHaveValue(template.condition);
  expect(screen.getByLabelText("Nội dung biện pháp khác")).toHaveValue(template.resolution);
  expect(screen.getByLabelText("Ghi chú")).toHaveValue(template.note);
  fireEvent.blur(barcode());
  expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("7.5");
  expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();
});

it("waits for a typing pause, lists partial matching SKUs, and fills the selected code and metadata", async () => {
  vi.useFakeTimers();
  render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.change(barcode(), { target: { value: "000" } });
  expect(screen.queryByRole("listbox", { name: "Đề xuất SKU" })).not.toBeInTheDocument();
  await act(async () => { vi.advanceTimersByTime(499); });
  expect(screen.queryByRole("listbox", { name: "Đề xuất SKU" })).not.toBeInTheDocument();
  await act(async () => { vi.advanceTimersByTime(1); });
  const list = screen.getByRole("listbox", { name: "Đề xuất SKU" });
  expect(within(list).getAllByRole("option")).toHaveLength(2);
  fireEvent.click(within(list).getByRole("option", { name: /000456/ }));
  expect(barcode()).toHaveValue("000456");
  expect(product()).toHaveValue("Hàng tổng hợp B");
  expect(supplier()).toHaveValue("NCC tổng hợp B");
  expect(screen.queryByRole("listbox", { name: "Đề xuất SKU" })).not.toBeInTheDocument();
  fireEvent.change(barcode(), { target: { value: "000" } });
  await act(async () => { vi.advanceTimersByTime(499); });
  fireEvent.change(barcode(), { target: { value: "unknown" } });
  await act(async () => { vi.advanceTimersByTime(500); });
  expect(screen.queryByRole("listbox", { name: "Đề xuất SKU" })).not.toBeInTheDocument();
});

it("reopens suggestions for an unchanged code after dismissal and supports keyboard selection", async () => {
  vi.useFakeTimers();
  const onOpenChange = vi.fn();
  render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={onOpenChange} onSaved={vi.fn()} />);
  fireEvent.focus(barcode());
  fireEvent.change(barcode(), { target: { value: "000" } });
  await act(async () => { vi.advanceTimersByTime(500); });
  expect(screen.getAllByRole("option")).toHaveLength(2);
  fireEvent.keyDown(barcode(), { key: "Escape" });
  expect(onOpenChange).not.toHaveBeenCalled();
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  fireEvent.blur(barcode());
  fireEvent.focus(barcode());
  await act(async () => { vi.advanceTimersByTime(500); });
  expect(screen.getAllByRole("option")).toHaveLength(2);
  fireEvent.keyDown(barcode(), { key: "ArrowDown" });
  fireEvent.keyDown(barcode(), { key: "ArrowDown" });
  fireEvent.keyDown(barcode(), { key: "Enter" });
  expect(barcode()).toHaveValue("000456");
  expect(product()).toHaveValue("Hàng tổng hợp B");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(screen.queryByText(/Điền thông tin SKU đã lưu|Đã điền|Chọn mẫu/)).not.toBeInTheDocument();
});

it("finds saved products by an unaccented product name after typing pauses", async () => {
  vi.useFakeTimers();
  render(<CreateRecordDialog kind="TPCN" open skuMemory={skuMemory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.change(barcode(), { target: { value: "hang tong hop b" } });
  await act(async () => { vi.advanceTimersByTime(500); });
  fireEvent.click(screen.getByRole("option", { name: /000456/ }));
  expect(barcode()).toHaveValue("000456");
  expect(product()).toHaveValue("Hàng tổng hợp B");
});

it("shows and selects a code-only saved SKU after typing 89", async () => {
  vi.useFakeTimers();
  const memory: SkuMemory = new Map([["TPCN:890001", { productName: "", supplier: "" }]]);
  render(<CreateRecordDialog kind="TPCN" open skuMemory={memory} onOpenChange={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.change(barcode(), { target: { value: "89" } });
  await act(async () => { vi.advanceTimersByTime(500); });
  fireEvent.click(screen.getByRole("option", { name: "890001" }));
  expect(barcode()).toHaveValue("890001");
  expect(product()).toHaveValue("");
  expect(supplier()).toHaveValue("");
});
