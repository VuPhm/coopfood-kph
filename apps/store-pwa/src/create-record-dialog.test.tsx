import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatBusinessDate } from "./business-date";
import { CreateRecordDialog, type CreatedRecordDraft } from "./create-record-dialog";
import { processEvidencePhoto } from "./image-processing";

vi.mock("./image-processing", () => ({ processEvidencePhoto: vi.fn() }));

function renderDialog(kind: "TPCN" | "TPTS" = "TPCN", onSaved = vi.fn<(draft: CreatedRecordDraft) => void>()) {
  render(<CreateRecordDialog kind={kind} open onOpenChange={vi.fn()} onSaved={onSaved} />);
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

  it("uses the TPTS option matrix", () => {
    renderDialog("TPTS");
    const condition = screen.getByRole("group", { name: "Tình trạng" });
    const resolution = screen.getByRole("group", { name: "Biện pháp xử lý" });
    expect(within(condition).getByRole("radio", { name: "Hư hỏng" })).toBeChecked();
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
    renderDialog();
    const picker = screen.getByText("Chọn ảnh").closest("label")?.querySelector("input");
    const file = new File(["original"], "evidence.jpg", { type: "image/jpeg", lastModified: 1_776_220_280_000 });

    fireEvent.change(picker!, { target: { files: [file] } });

    expect(await screen.findByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
    expect(processEvidencePhoto).toHaveBeenCalledWith(file, { storeCode: "CF-DEMO-001", storeName: "Nguyễn Kiệm" });
    fireEvent.click(screen.getByRole("button", { name: "Xem ảnh minh chứng 1" }));
    expect(screen.getByAltText("Ảnh minh chứng evidence.jpg đã đóng tem")).toHaveAttribute("src", "blob:stamped-photo");
  });

  it("keeps a manual-entry escape hatch when the camera is unavailable", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Quét mã barcode" }));
    expect(screen.getByRole("dialog", { name: "Quét mã SKU / UPC" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Nhập mã thủ công" })).toBeVisible();
  });

  it("uses the shared calendar trigger for every date field", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "Chọn ngày phát hiện" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Chọn ngày xử lý (nếu có)" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Chọn ngày xử lý (nếu có)" }));
    fireEvent.click(screen.getByRole("button", { name: "20 tháng 8, 2026" }));
    expect(screen.getByRole("textbox", { name: "Ngày xử lý (nếu có)" })).toHaveValue("20/08/2026");
  });

  it("defaults the detected date and calendar to the current Ho Chi Minh business day", () => {
    renderDialog();
    const today = formatBusinessDate(new Date());
    expect(screen.getByRole("textbox", { name: "Ngày phát hiện" })).toHaveValue(today.display);

    fireEvent.click(screen.getByRole("button", { name: "Chọn ngày phát hiện" }));
    expect(screen.getByRole("button", { name: new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", timeZone: "UTC", year: "numeric" }).format(new Date(`${today.iso}T00:00:00Z`)) })).toHaveAttribute("aria-pressed", "true");
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
    const picker = screen.getByText("Chọn ảnh").closest("label")?.querySelector("input");
    fireEvent.change(picker!, { target: { files: [new File(["original"], "evidence.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({
        kind: "TPCN",
        barcode: "000123",
        productName: "Sản phẩm kiểm thử",
        detectedDate: formatBusinessDate(new Date()).display,
        quantity: 1,
        unit: "EA",
        photos: [expect.objectContaining({ fileName: "evidence.jpg", blob: stampedBlob })],
      })));
  });
});
