import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
});

