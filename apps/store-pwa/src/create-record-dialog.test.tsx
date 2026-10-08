import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BrowserMultiFormatReader, type Result } from "@zxing/library";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatBusinessDate } from "./business-date";
import { CreateRecordDialog, type CreatedRecordDraft } from "./create-record-dialog";
import { processEvidencePhoto } from "./image-processing";
import { DEFAULT_STORE_PROFILE, type StoreProfile } from "./store-profile";

vi.mock("./image-processing", () => ({ processEvidencePhoto: vi.fn() }));

function renderDialog(kind: "TPCN" | "TPTS" = "TPCN", onSaved = vi.fn<(draft: CreatedRecordDraft) => void>(), profile: StoreProfile = DEFAULT_STORE_PROFILE) {
  render(<CreateRecordDialog kind={kind} open onOpenChange={vi.fn()} onSaved={onSaved} profile={profile} />);
  return onSaved;
}

describe("Create KPH record", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the accepted section order and operational fields", () => {
    renderDialog();
    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual([
      "1. Thông tin phát hiện",
      "2. Số lượng & đơn vị",
      "3. Tình trạng hàng",
      "4. Biện pháp xử lý",
      "5. Người phát hiện & ảnh",
    ]);
    expect(screen.getByRole("textbox", { name: "Nhà cung cấp" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Ngày xử lý (nếu có)" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Ghi chú" })).toBeVisible();
  });

  it("shows optional detail only for Other and preserves the empty-detail policy", () => {
    renderDialog();
    const condition = screen.getByRole("group", { name: "Tình trạng" });
    fireEvent.click(within(condition).getByRole("radio", { name: "Khác" }));
    expect(screen.getByRole("textbox", { name: "Nội dung tình trạng khác" })).toHaveAttribute("placeholder", expect.stringContaining("Khác"));

    const resolution = screen.getByRole("group", { name: "Biện pháp xử lý" });
    fireEvent.click(within(resolution).getByRole("radio", { name: "KHÁC" }));
    expect(screen.getByRole("textbox", { name: "Nội dung biện pháp khác" })).toHaveAttribute("placeholder", expect.stringContaining("KHÁC"));
  });

  it("uses the reviewed TPCN condition matrix", () => {
    renderDialog("TPCN");
    const condition = screen.getByRole("group", { name: "Tình trạng" });
    expect(within(condition).getByRole("radio", { name: "Rách bao bì" }).closest("label")?.querySelector(".lucide-package-open")).not.toBeNull();
    expect(within(condition).getByRole("radio", { name: "Xì chân không" }).closest("label")?.querySelector(".lucide-wind")).not.toBeNull();
  });

  it("uses the reviewed TPTS option matrix", () => {
    renderDialog("TPTS");
    const condition = screen.getByRole("group", { name: "Tình trạng" });
    const resolution = screen.getByRole("group", { name: "Biện pháp xử lý" });
    expect(within(condition).getByRole("radio", { name: "Dập úng" })).toBeChecked();
    expect(within(condition).getByRole("radio", { name: "Dập úng" }).closest("label")?.querySelector(".lucide-apple")).not.toBeNull();
    expect(within(condition).getByRole("radio", { name: "Thối mốc" }).closest("label")?.querySelector(".lucide-biohazard")).not.toBeNull();
    expect(within(condition).queryByRole("radio", { name: "Hư hỏng" })).not.toBeInTheDocument();
    expect(within(resolution).getAllByRole("radio")).toHaveLength(2);
    expect(within(resolution).queryByRole("radio", { name: "ĐỔI" })).not.toBeInTheDocument();
  });

  it.each([
    ["2912345612345", "1.234"],
    ["2912345602505", "0.25"],
    ["2912345699995", "9.999"],
  ])("fills TPTS quantity and kg on blur for %s, without parsing during typing", (barcode, quantity) => {
    renderDialog("TPTS");
    const barcodeInput = screen.getByRole("textbox", { name: "Mã SKU / UPC" });
    fireEvent.change(screen.getByRole("textbox", { name: "Số lượng" }), { target: { value: "7" } });
    fireEvent.change(barcodeInput, { target: { value: barcode } });
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("7");
    expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();

    fireEvent.blur(barcodeInput);

    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue(quantity);
    expect(screen.getByRole("radio", { name: "kg" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Nhà cung cấp" })).toHaveValue("");
  });

  it("waits for a 500 ms typing pause, then fills weight and shows its source without blur", async () => {
    vi.useFakeTimers();
    try {
      renderDialog("TPTS");
      const barcodeInput = screen.getByRole("textbox", { name: "Mã SKU / UPC" });
      fireEvent.focus(barcodeInput);
      fireEvent.change(barcodeInput, { target: { value: "291234561234" } });
      await act(async () => { vi.advanceTimersByTime(300); });
      fireEvent.change(barcodeInput, { target: { value: "2912345612345" } });
      await act(async () => { vi.advanceTimersByTime(499); });
      expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("1");
      expect(screen.queryByText("Trọng lượng đã được trích xuất từ mã barcode.")).not.toBeInTheDocument();

      await act(async () => { vi.advanceTimersByTime(1); });

      const quantityInput = screen.getByRole("textbox", { name: "Số lượng" });
      expect(quantityInput).toHaveValue("1.234");
      expect(screen.getByRole("radio", { name: "kg" })).toBeChecked();
      expect(screen.getByText("Trọng lượng đã được trích xuất từ mã barcode.")).toHaveAttribute("role", "status");
      expect(quantityInput).toHaveAttribute("aria-describedby", "quantity-extraction-note");

      fireEvent.change(quantityInput, { target: { value: "2" } });
      expect(screen.queryByText("Trọng lượng đã được trích xuất từ mã barcode.")).not.toBeInTheDocument();
      expect(quantityInput).not.toHaveAttribute("aria-describedby");
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(quantityInput).toHaveValue("2");
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ["TPCN", "2912345612345"],
    ["TPTS", "2812345612345"],
    ["TPTS", "291234"],
    ["TPTS", "291234561234X"],
  ] as const)("does not fill after a typing pause for %s barcode %s", async (kind, barcode) => {
    vi.useFakeTimers();
    try {
      renderDialog(kind);
      fireEvent.change(screen.getByRole("textbox", { name: "Số lượng" }), { target: { value: "7" } });
      fireEvent.change(screen.getByRole("textbox", { name: "Mã SKU / UPC" }), { target: { value: barcode } });
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("7");
      expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();
      expect(screen.queryByText("Trọng lượng đã được trích xuất từ mã barcode.")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels pending extraction and clears the source note when the barcode changes or the dialog closes", async () => {
    vi.useFakeTimers();
    try {
      const props = { kind: "TPTS" as const, onOpenChange: vi.fn(), onSaved: vi.fn() };
      const { rerender } = render(<CreateRecordDialog {...props} open />);
      const barcodeInput = screen.getByRole("textbox", { name: "Mã SKU / UPC" });
      fireEvent.change(barcodeInput, { target: { value: "2912345612345" } });
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(screen.getByText("Trọng lượng đã được trích xuất từ mã barcode.")).toBeVisible();

      fireEvent.change(barcodeInput, { target: { value: "2912345602505" } });
      expect(screen.queryByText("Trọng lượng đã được trích xuất từ mã barcode.")).not.toBeInTheDocument();
      rerender(<CreateRecordDialog {...props} open={false} />);
      await act(async () => { vi.advanceTimersByTime(500); });
      rerender(<CreateRecordDialog {...props} open />);
      expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("1.234");
      expect(screen.queryByText("Trọng lượng đã được trích xuất từ mã barcode.")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ["TPCN", "2912345612345"],
    ["TPTS", "2812345612345"],
    ["TPTS", "29"],
    ["TPTS", "291234"],
    ["TPTS", "29ABCDEF12345"],
    ["TPTS", "291234561234X"],
  ] as const)("preserves entered quantity and unit for %s barcode %s", (kind, barcode) => {
    renderDialog(kind);
    fireEvent.change(screen.getByRole("textbox", { name: "Số lượng" }), { target: { value: "7" } });
    const barcodeInput = screen.getByRole("textbox", { name: "Mã SKU / UPC" });
    fireEvent.change(barcodeInput, { target: { value: barcode } });
    fireEvent.blur(barcodeInput);

    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("7");
    expect(screen.getByRole("radio", { name: "EA" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Lưu phiếu" })).toBeEnabled();
  });

  it("fills zero weight but still rejects it through the existing quantity validation", async () => {
    const onSaved = renderDialog("TPTS");
    const barcodeInput = screen.getByRole("textbox", { name: "Mã SKU / UPC" });
    fireEvent.change(barcodeInput, { target: { value: "2912345600005" } });
    fireEvent.blur(barcodeInput);
    expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue("0");
    expect(screen.getByRole("radio", { name: "kg" })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));

    expect(await screen.findByText("Số lượng phải lớn hơn 0")).toBeVisible();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each([
    ["TPTS", "2912345612345", "1.234", "kg"],
    ["TPTS", "2912345602505", "0.25", "kg"],
    ["TPCN", "2912345612345", "7", "EA"],
    ["TPTS", "2812345612345", "7", "EA"],
    ["TPTS", "29ABCDEF12345", "7", "EA"],
  ] as const)("applies the same weight rule immediately to scanned %s barcode %s", async (kind, barcode, quantity, unit) => {
    const originalMediaDevices = navigator.mediaDevices;
    const track = { stop: vi.fn(), getSettings: () => ({}) };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track], getVideoTracks: () => [track] }),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } });
    vi.stubGlobal("BarcodeDetector", undefined);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(BrowserMultiFormatReader.prototype, "decodeContinuously").mockImplementation((_source, callback) => {
      callback({ getText: () => barcode } as Result, undefined);
    });
    try {
      renderDialog(kind);
      fireEvent.change(screen.getByRole("textbox", { name: "Số lượng" }), { target: { value: "7" } });
      fireEvent.click(screen.getByRole("button", { name: "Quét mã barcode" }));

      await waitFor(() => expect(screen.getByRole("textbox", { name: "Mã SKU / UPC" })).toHaveValue(barcode), { timeout: 1_500 });

      expect(screen.getByRole("textbox", { name: "Số lượng" })).toHaveValue(quantity);
      expect(screen.getByRole("radio", { name: unit })).toBeChecked();
      if (unit === "kg") expect(screen.getByText("Trọng lượng đã được trích xuất từ mã barcode.")).toBeVisible();
      else expect(screen.queryByText("Trọng lượng đã được trích xuất từ mã barcode.")).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: originalMediaDevices });
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });

  it("keeps the three-photo cap without discarding the current draft", () => {
    renderDialog();
    const picker = screen.getByText("Chọn ảnh").closest("label")?.querySelector("input");
    expect(picker).toBeTruthy();
    const files = [1, 2, 3, 4].map((index) => new File(["image"], `photo-${index}.jpg`, { type: "image/jpeg" }));
    fireEvent.change(picker!, { target: { files } });
    expect(screen.getByRole("alert")).toHaveTextContent("tối đa 3 ảnh");
    expect(screen.queryByLabelText("Ảnh đã chọn")).not.toBeInTheDocument();
  });

  it("prepares a stamped JPEG before previewing and opens that result in the viewer", async () => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:stamped-photo") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.mocked(processEvidencePhoto).mockResolvedValue({
      blob: new Blob(["stamped"], { type: "image/jpeg" }),
      capturedAt: new Date("2026-08-15T02:18:00.000Z"),
      width: 1280,
      height: 720,
    });
    renderDialog("TPCN", undefined, {
      storeCode: "0123",
      storeName: "Cống Quỳnh",
      role: "STORE_MANAGER",
      fullName: "Trần An",
      employeeCode: "NV-08",
    });
    const picker = screen.getByText("Chọn ảnh").closest("label")?.querySelector("input");
    const file = new File(["original"], "evidence.jpg", { type: "image/jpeg", lastModified: 1_776_220_280_000 });

    fireEvent.change(picker!, { target: { files: [file] } });

    expect(await screen.findByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
    expect(processEvidencePhoto).toHaveBeenCalledWith(file, { storeCode: "0123", storeName: "Cống Quỳnh" });
    fireEvent.click(screen.getByRole("button", { name: "Xem ảnh minh chứng 1" }));
    expect(screen.getByAltText("Ảnh minh chứng evidence.jpg đã đóng tem")).toHaveAttribute("src", "blob:stamped-photo");
  });

  it("keeps a manual-entry escape hatch when the camera is unavailable", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Quét mã barcode" }));
    expect(screen.getByRole("dialog", { name: "Quét mã SKU / UPC" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Nhập mã thủ công" })).toBeVisible();
  });

  it("fills the barcode input when barcode is scanned", async () => {
    renderDialog();
    const barcodeInput = screen.getByRole("textbox", { name: "Mã SKU / UPC" }) as HTMLInputElement;
    expect(barcodeInput.value).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Quét mã barcode" }));
    expect(screen.getByRole("dialog", { name: "Quét mã SKU / UPC" })).toBeVisible();
  });

  it("locks the detected date, opens the treatment date calendar and allows date selection", () => {
    renderDialog();
    expect(screen.getByRole("textbox", { name: "Ngày phát hiện" })).toHaveValue(formatBusinessDate(new Date()).display);
    expect(screen.getByRole("textbox", { name: "Ngày phát hiện" })).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Chọn ngày phát hiện" })).toBeDisabled();
    const treatmentDateInput = screen.getByRole("textbox", { name: "Ngày xử lý (nếu có)" });
    const treatmentDateTrigger = screen.getByRole("button", { name: "Chọn ngày xử lý (nếu có)" });
    expect(treatmentDateTrigger).toBeEnabled();

    fireEvent.click(treatmentDateTrigger);

    const calendar = screen.getByRole("dialog", { name: "Lịch chọn ngày" });
    expect(calendar.parentElement).toBe(document.body);
    expect(calendar).toHaveClass("pointer-events-auto");

    const dayButton = within(calendar).getByRole("button", { name: /18/ });
    fireEvent.click(dayButton);

    expect(screen.queryByRole("dialog", { name: "Lịch chọn ngày" })).not.toBeInTheDocument();
    expect((treatmentDateInput as HTMLInputElement).value).toMatch(/^18\/\d{2}\/\d{4}$/);
  });

  it("saves the entered values and stamped evidence instead of a placeholder", async () => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:saved-photo") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const stampedBlob = new Blob(["stamped"], { type: "image/jpeg" });
    vi.mocked(processEvidencePhoto).mockResolvedValue({
      blob: stampedBlob,
      capturedAt: new Date(),
      width: 1280,
      height: 720,
    });
    const onSaved = renderDialog();
    fireEvent.change(screen.getByRole("textbox", { name: "Mã SKU / UPC" }), { target: { value: "000123" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Sản phẩm kiểm thử" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Tên người nhập" }), { target: { value: "Trần An" } });
    const picker = screen.getByText("Chọn ảnh").closest("label")?.querySelector("input");
    fireEvent.change(picker!, { target: { files: [new File(["original"], "evidence.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({
        kind: "TPCN",
        barcode: "000123",
        productName: "Sản phẩm kiểm thử",
        detectedBy: "Trần An",
        detectedDate: formatBusinessDate(new Date()).display,
        quantity: 1,
        unit: "EA",
        photos: [expect.objectContaining({ fileName: "evidence.jpg", blob: stampedBlob })],
      })));
  });

  it.each([
    ["TPTS", "0.25", 0.25, "kg"],
    ["TPTS", "0,25", 0.25, "kg"],
    ["TPTS", "1.234", 1.234, "kg"],
    ["TPTS", "1,234", 1.234, "kg"],
    ["TPTS", ",5", 0.5, "kg"],
    ["TPCN", "0,25", 0.25, "EA"],
  ] as const)("corrects a quantity error and saves %s input %s as number %s", async (kind, input, expected, unit) => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:decimal-photo") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.mocked(processEvidencePhoto).mockResolvedValue({
      blob: new Blob(["stamped"], { type: "image/jpeg" }),
      capturedAt: new Date(), width: 1280, height: 720,
    });
    const onSaved = renderDialog(kind);
    fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Sản phẩm kiểm thử thập phân" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Tên người nhập" }), { target: { value: "Nhân viên kiểm thử" } });
    const quantity = screen.getByRole("textbox", { name: "Số lượng" });
    fireEvent.change(quantity, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));
    expect(await screen.findByText("Số lượng phải lớn hơn 0")).toBeVisible();

    fireEvent.change(quantity, { target: { value: input } });
    fireEvent.click(screen.getByRole("radio", { name: unit }));
    const picker = screen.getByText("Chọn ảnh").closest("label")?.querySelector("input");
    fireEvent.change(picker!, { target: { files: [new File(["original"], "decimal.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
    await waitFor(() => expect(screen.queryByText("Số lượng phải lớn hơn 0")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ kind, quantity: expected, unit })));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it.each(["0,000", "-0,25", "1,2.3", "1,2,3", "1kg", "Infinity"])("rejects invalid TPTS quantity %s without saving", async (input) => {
    const onSaved = renderDialog("TPTS");
    fireEvent.change(screen.getByRole("textbox", { name: "Số lượng" }), { target: { value: input } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));

    expect(await screen.findByText("Số lượng phải lớn hơn 0")).toBeVisible();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
