import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateRecordDialog, type CreatedRecordDraft } from "./create-record-dialog";
import { DEFAULT_STORE_PROFILE } from "./store-profile";

type Lookup = NonNullable<ComponentProps<typeof CreateRecordDialog>["onBarcodeLookup"]>;
type LookupResult = Awaited<ReturnType<Lookup>>;

const found = (barcode: string): LookupResult => ({
  status: "FOUND",
  barcode,
  product: {
    id: "product-1",
    barcode,
    skuCode: "SKU-001",
    name: "Sản phẩm kiểm thử",
    primarySupplier: { code: "NCC-001", name: "Nhà cung cấp kiểm thử" },
  },
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function openDialog(onBarcodeLookup: Lookup, onSaved = vi.fn<(draft: CreatedRecordDraft) => void>()) {
  render(<CreateRecordDialog
    kind="TPCN"
    open
    onlineMode
    profile={{ ...DEFAULT_STORE_PROFILE, fullName: "Nhân viên kiểm thử" }}
    onOpenChange={vi.fn()}
    onBarcodeLookup={onBarcodeLookup}
    onSaved={onSaved}
  />);
  const barcode = screen.getByRole("textbox", { name: "Mã SKU / UPC" });
  return { barcode, onSaved };
}

function lookup(barcodeInput: HTMLElement, value: string) {
  fireEvent.change(barcodeInput, { target: { value } });
  fireEvent.blur(barcodeInput);
}

function addPhoto() {
  const picker = screen.getByText("Chọn ảnh").closest("label")!.querySelector("input")!;
  fireEvent.change(picker, { target: { files: [new File(["image"], "evidence.jpg", { type: "image/jpeg" })] } });
}

describe("online KPH lookup states", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the matching FOUND product and supplier for the scanned barcode", async () => {
    const onBarcodeLookup = vi.fn<Lookup>().mockResolvedValue(found("000123"));
    const { barcode } = openDialog(onBarcodeLookup);

    lookup(barcode, "000123");

    expect(await screen.findByText("FOUND · Sản phẩm trong danh mục")).toBeVisible();
    expect(onBarcodeLookup).toHaveBeenCalledWith("000123");
    expect(barcode).toHaveValue("000123");
    expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("Sản phẩm kiểm thử");
    expect(screen.getByRole("textbox", { name: "Nhà cung cấp" })).toHaveValue("Nhà cung cấp kiểm thử");
    expect(screen.getByText("Đã tìm thấy SKU-001.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: "Nhà cung cấp" })).toHaveAttribute("readonly");
  });

  it("keeps a missed barcode and permits rescan or manual entry through review", async () => {
    const onBarcodeLookup = vi.fn<Lookup>().mockResolvedValue({ status: "NOT_FOUND", barcode: "000456" });
    const { barcode, onSaved } = openDialog(onBarcodeLookup);

    lookup(barcode, "000456");

    expect(await screen.findByText("NOT_FOUND · Nhập thông tin hàng thủ công")).toBeVisible();
    expect(barcode).toHaveValue("000456");
    expect(screen.getByText(/mã đã quét sẽ được giữ lại/)).toBeVisible();
    const product = screen.getByRole("textbox", { name: "Tên hàng hóa" });
    const supplier = screen.getByRole("textbox", { name: "Nhà cung cấp" });
    expect(product).not.toHaveAttribute("readonly");
    expect(supplier).not.toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Quét lại" }));
    expect(screen.getByRole("dialog", { name: "Quét mã SKU / UPC" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Nhập mã thủ công" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Nhập mã thủ công" }));

    fireEvent.change(product, { target: { value: "Hàng nhập tay" } });
    fireEvent.change(supplier, { target: { value: "NCC nhập tay" } });
    addPhoto();
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    fireEvent.click(screen.getByRole("button", { name: "Xem lại trước khi gửi" }));
    const review = await screen.findByRole("region", { name: "Xem lại trước khi gửi" });
    expect(within(review).getByText("000456 · NOT_FOUND")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Gửi phiếu" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({
      barcode: "000456", productName: "Hàng nhập tay", supplier: "NCC nhập tay",
    })));
  });

  it("keeps catalog unavailability distinct from a miss and recovers on retry", async () => {
    const unavailable = Object.assign(new Error("catalog unavailable"), { code: "CATALOG_UNAVAILABLE", status: 503 });
    const onBarcodeLookup = vi.fn<Lookup>()
      .mockRejectedValueOnce(unavailable)
      .mockResolvedValueOnce(found("000789"));
    const { barcode, onSaved } = openDialog(onBarcodeLookup);
    fireEvent.change(screen.getByRole("textbox", { name: "Ghi chú" }), { target: { value: "Giữ ghi chú" } });
    addPhoto();
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);

    lookup(barcode, "000789");

    expect(await screen.findByRole("alert")).toHaveTextContent("CATALOG_UNAVAILABLE · Danh mục tạm không sẵn sàng");
    expect(screen.queryByText(/NOT_FOUND · Nhập/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quét lại" })).not.toBeInTheDocument();
    expect(barcode).toHaveValue("000789");
    expect(screen.getByRole("textbox", { name: "Ghi chú" })).toHaveValue("Giữ ghi chú");
    fireEvent.click(screen.getByRole("button", { name: "Xem lại trước khi gửi" }));
    expect(screen.queryByRole("region", { name: "Xem lại trước khi gửi" })).not.toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Thử tra cứu lại" }));
    expect(await screen.findByText("FOUND · Sản phẩm trong danh mục")).toBeVisible();
    expect(onBarcodeLookup).toHaveBeenNthCalledWith(2, "000789");
    expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("Sản phẩm kiểm thử");
    expect(screen.getByRole("textbox", { name: "Ghi chú" })).toHaveValue("Giữ ghi chú");
  });

  it("preserves manual draft fields across busy and generic error, then retries the same barcode", async () => {
    const pending = deferred<LookupResult>();
    const onBarcodeLookup = vi.fn<Lookup>()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ status: "NOT_FOUND", barcode: "000999" });
    const { barcode } = openDialog(onBarcodeLookup);
    const product = screen.getByRole("textbox", { name: "Tên hàng hóa" });
    const supplier = screen.getByRole("textbox", { name: "Nhà cung cấp" });
    fireEvent.change(product, { target: { value: "Hàng đang nhập" } });
    fireEvent.change(supplier, { target: { value: "NCC đang nhập" } });
    lookup(barcode, "000999");

    expect(screen.getByText("Đang tra cứu…")).toBeVisible();
    expect(product).toHaveValue("Hàng đang nhập");
    expect(supplier).toHaveValue("NCC đang nhập");
    pending.reject(new Error("network error"));
    expect(await screen.findByText("Chưa xác nhận mã")).toBeVisible();
    expect(screen.getByText(/Không thể tra cứu barcode lúc này/)).toBeVisible();
    expect(barcode).toHaveValue("000999");
    expect(product).toHaveValue("Hàng đang nhập");
    expect(supplier).toHaveValue("NCC đang nhập");

    fireEvent.click(screen.getByRole("button", { name: "Thử tra cứu lại" }));
    expect(await screen.findByText("NOT_FOUND · Nhập thông tin hàng thủ công")).toBeVisible();
    expect(onBarcodeLookup).toHaveBeenNthCalledWith(2, "000999");
    expect(product).toHaveValue("Hàng đang nhập");
    expect(supplier).toHaveValue("NCC đang nhập");
  });

  it("ignores an older lookup response after the barcode changes", async () => {
    const oldRequest = deferred<LookupResult>();
    const currentRequest = deferred<LookupResult>();
    const onBarcodeLookup = vi.fn<Lookup>()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(currentRequest.promise);
    const { barcode } = openDialog(onBarcodeLookup);

    lookup(barcode, "OLD");
    lookup(barcode, "NEW");
    currentRequest.resolve({ status: "NOT_FOUND", barcode: "NEW" });
    expect(await screen.findByText("NOT_FOUND · Nhập thông tin hàng thủ công")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Hàng mới nhập tay" } });
    await act(async () => oldRequest.resolve(found("OLD")));
    expect(onBarcodeLookup).toHaveBeenCalledTimes(2);

    expect(barcode).toHaveValue("NEW");
    expect(screen.getByText("NOT_FOUND · Nhập thông tin hàng thủ công")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("Hàng mới nhập tay");
    expect(screen.getByRole("textbox", { name: "Nhà cung cấp" })).toHaveValue("");
  });
});
