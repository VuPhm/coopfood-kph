import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreateRecordDialog } from "./create-record-dialog";

function renderDialog(kind: "TPCN" | "TPTS" = "TPCN") {
  render(<CreateRecordDialog kind={kind} open onOpenChange={vi.fn()} onSaved={vi.fn()} />);
}

describe("Create KPH record", () => {
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

  it("keeps a manual-entry escape hatch when the camera is unavailable", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Quét mã barcode" }));
    expect(screen.getByRole("dialog", { name: "Quét mã SKU / UPC" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Nhập mã thủ công" })).toBeVisible();
  });
});
