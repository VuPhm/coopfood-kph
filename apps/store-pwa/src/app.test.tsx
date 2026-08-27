import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App, formatBusinessDate } from "./app";

afterEach(() => vi.useRealTimers());

describe("Store workspace", () => {
  it("shows the Co.op Food logo and today's business date in the header", () => {
    render(<App />);
    const today = formatBusinessDate(new Date());

    expect(screen.getByRole("img", { name: /Co\.op Food/i })).toHaveAttribute("src", "/brand/coopfood-logo.png");
    expect(screen.getByLabelText(`Hôm nay: ${today.display}`)).toContainElement(screen.getByText(today.display));
    expect(screen.getByText(today.display)).toHaveAttribute("datetime", today.iso);
  });

  it("keeps both KPH entry actions visible", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Tạo phiếu TP khô & khác/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Tạo phiếu TP tươi sống/i })).toBeVisible();
  });

  it("opens the store context and saves the required store settings", async () => {
    render(<App />);
    const trigger = screen.getByRole("button", { name: /Thiết lập cửa hàng: Co\.op Food Nguyễn Kiệm · 0001/i });

    expect(within(trigger).getByText("Co.op Food Nguyễn Kiệm · 0001")).toBeVisible();
    expect(within(trigger).getByText("Nguyễn Văn Demo · CHT")).toBeVisible();
    expect(within(trigger).getByText("dữ liệu: trên thiết bị")).toBeVisible();
    expect(screen.queryByText("Cửa hàng hiện tại")).not.toBeInTheDocument();
    expect(screen.queryByText("Cửa hàng trưởng")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Thiết lập cửa hàng" });
    const storeName = within(dialog).getByRole("textbox", { name: "Tên cửa hàng" });
    const storeCode = within(dialog).getByRole("textbox", { name: "Mã cửa hàng" });
    expect(storeName).toHaveValue("Nguyễn Kiệm");
    expect(within(dialog).getByText("Co.op Food")).toBeVisible();
    expect(storeCode).toHaveAttribute("type", "text");
    expect(storeCode).toHaveAttribute("maxlength", "4");
    expect(within(dialog).queryByText(/giữ được số 0 ở đầu/i)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: "CHT" })).toBeChecked();

    fireEvent.change(storeName, { target: { value: "" } });
    fireEvent.change(storeCode, { target: { value: "123" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu thiết lập" }));
    expect(await within(dialog).findByText("Nhập tên cửa hàng")).toBeVisible();
    expect(within(dialog).getByText("Mã cửa hàng gồm đúng 4 chữ số")).toBeVisible();

    fireEvent.change(storeName, { target: { value: "Cống Quỳnh" } });
    fireEvent.change(storeCode, { target: { value: "0123" } });
    fireEvent.click(within(dialog).getByRole("radio", { name: "Nhân viên" }));
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Họ tên" }), { target: { value: "Trần An" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Mã nhân viên" }), { target: { value: "NV-08" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu thiết lập" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Thiết lập cửa hàng" })).not.toBeInTheDocument());
    const updated = screen.getByRole("button", { name: /Thiết lập cửa hàng: Co\.op Food Cống Quỳnh · 0123/i });
    expect(within(updated).getByText("Trần An · Nhân viên · NV-08")).toBeVisible();
  });

  it("automatically hides a notice after 15 seconds", () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
    fireEvent.click(screen.getByRole("button", { name: "Duyệt 1 phiếu" }));

    const notice = screen.getByText("Đã duyệt 1 phiếu trong dữ liệu demo.");
    expect(notice).toBeVisible();
    act(() => vi.advanceTimersByTime(14_999));
    expect(notice).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Đã duyệt 1 phiếu trong dữ liệu demo.")).not.toBeInTheDocument();
  });

  it("keeps expiry lookup inside main as the parallel workbench", () => {
    render(<App />);
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(within(main as HTMLElement).getByRole("complementary", { name: "Tra cứu lùi hàng" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Mở tra cứu lùi hàng" })).not.toBeInTheDocument();
  });

  it("changes the scoped history tab", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: /TP Tươi sống/i }));
    expect(screen.getAllByText("Cải thìa VietGAP 500 g")).toHaveLength(2);
    expect(screen.queryByText("Bánh quy bơ hộp 300 g")).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation between the food type tabs", () => {
    render(<App />);
    const dryTab = screen.getByRole("tab", { name: /TP Khô & khác/i });
    const freshTab = screen.getByRole("tab", { name: /TP Tươi sống/i });

    dryTab.focus();
    fireEvent.keyDown(dryTab, { key: "ArrowRight" });

    expect(freshTab).toHaveFocus();
    expect(freshTab).toHaveAttribute("aria-selected", "true");
  });

  it("sorts record columns in both directions from the desktop headers", () => {
    render(<App />);
    const productSort = screen.getByRole("button", { name: "Sắp xếp theo SKU/UPC · Tên hàng hóa" });
    const heading = productSort.closest("th");

    expect(heading).toHaveAttribute("aria-sort", "none");
    fireEvent.click(productSort);
    expect(heading).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(productSort);
    expect(heading).toHaveAttribute("aria-sort", "descending");
  });

  it("sorts records by approval status from the desktop table header", () => {
    render(<App />);
    const sortBtn = screen.getByRole("button", { name: "Sắp xếp theo Duyệt" });
    const th = sortBtn.closest("th");

    expect(th).toHaveAttribute("aria-sort", "none");
    fireEvent.click(sortBtn);
    expect(th).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(sortBtn);
    expect(th).toHaveAttribute("aria-sort", "descending");
  });

  it("toggles mobile approval filters and sort direction from radio-style grids", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
    const filterTrigger = screen.getByRole("button", { name: "Mở lọc và sắp xếp trên mobile" });
    expect(filterTrigger.querySelector(".history-controls-icon > .lucide-list-filter")).not.toBeNull();
    expect(filterTrigger.querySelector(".history-controls-indicator")).toBeNull();
    fireEvent.click(filterTrigger);
    const dialog = screen.getByRole("dialog", { name: "Lọc và sắp xếp" });
    const approvedFilter = within(dialog).getByRole("button", { name: "Lọc Đã duyệt" });

    expect(dialog.querySelector(".utility-panel-meta")).not.toBeNull();
    expect(within(dialog).getByText("Tùy chọn lọc")).toBeVisible();
    expect(within(dialog).queryByText("Cột sắp xếp")).not.toBeInTheDocument();
    fireEvent.click(approvedFilter);

    expect(within(dialog).getByRole("button", { name: "Bỏ lọc Đã duyệt" })).toHaveAttribute("aria-pressed", "true");
    expect(filterTrigger).toHaveClass("is-active");
    expect(filterTrigger.querySelector(".history-controls-icon > .history-controls-indicator")).not.toBeNull();
    expect(document.querySelector(".selection-count")).toHaveTextContent("Đã chọn 0");
    expect(document.querySelector(".history-total-count")).toHaveTextContent("0");

    fireEvent.click(within(dialog).getByRole("button", { name: "Bỏ lọc Đã duyệt" }));
    expect(document.querySelector(".history-total-count")).toHaveTextContent("1");
    expect(filterTrigger.querySelector(".history-controls-indicator")).toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: "Sắp xếp theo Nhà cung cấp" }));
    expect(within(dialog).getByRole("button", { name: "Sắp xếp Nhà cung cấp tăng dần; bấm để chuyển giảm dần" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(dialog).getByRole("button", { name: "Sắp xếp Nhà cung cấp tăng dần; bấm để chuyển giảm dần" }));
    expect(within(dialog).getByRole("button", { name: "Sắp xếp Nhà cung cấp giảm dần; bấm để huỷ sắp xếp" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(dialog).getByRole("button", { name: "Sắp xếp Nhà cung cấp giảm dần; bấm để huỷ sắp xếp" }));
    expect(within(dialog).getByRole("button", { name: "Sắp xếp theo Nhà cung cấp" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(within(dialog).getByRole("button", { name: "Đóng lọc và sắp xếp" }));

    expect(screen.getByRole("button", { name: "Sắp xếp theo NCC" }).closest("th")).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("button", { name: "Mở lọc và sắp xếp trên mobile" })).not.toHaveClass("is-active");
  });

  it("selects only the records in the active food type", () => {
    render(<App />);
    expect(document.querySelector(".history-action-tools")).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
    expect(screen.getByRole("button", { name: "Duyệt 1 phiếu" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Xuất Excel" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Xóa phiếu đã chọn" })).toBeEnabled();

    fireEvent.click(screen.getByRole("tab", { name: /TP Tươi sống/i }));
    expect(document.querySelector(".selection-count")).toHaveTextContent("Đã chọn 0");
    expect(document.querySelector(".history-action-tools")).toBeNull();
  });

  it("approves all selected records from the selection counter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
    fireEvent.click(screen.getByRole("button", { name: "Duyệt 1 phiếu" }));

    const approvalControls = screen.getAllByRole("combobox", { name: "Trạng thái duyệt phiếu KPH-260815-018" });
    expect(approvalControls[0]).toHaveValue("APPROVED");
    expect(approvalControls[1]).toHaveValue("APPROVED");
    expect(screen.getByText("Đã duyệt 1 phiếu trong dữ liệu demo.")).toBeVisible();
  });

  it("shows evidence thumbnails in table and card views and opens the shared viewer", () => {
    render(<App />);
    expect(screen.getAllByRole("button", { name: "Xem ảnh minh chứng 1 của phiếu KPH-260815-018" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Mở rộng phiếu KPH-260815-018" }));
    const triggers = screen.getAllByRole("button", { name: "Xem ảnh minh chứng 1 của phiếu KPH-260815-018" });
    expect(triggers).toHaveLength(2);

    fireEvent.click(triggers[0]!);
    expect(screen.getByRole("dialog", { name: "Xem ảnh minh chứng" })).toBeVisible();
    expect(screen.getByAltText("Mặt trước hộp bánh quy tại quầy")).toBeVisible();
  });

  it("uses the compact mobile card by default with condition, resolution and approval", () => {
    render(<App />);
    const card = document.querySelector(".record-card");
    const outcomes = document.querySelector(".record-card-compact-outcomes");

    expect(card).toHaveClass("is-compact");
    expect(outcomes).not.toBeNull();
    expect(within(outcomes as HTMLElement).getByText("Cận date")).toBeVisible();
    expect(within(outcomes as HTMLElement).getByText("ĐỔI")).toBeVisible();
    expect(within(outcomes as HTMLElement).getByRole("combobox", { name: "Trạng thái duyệt phiếu KPH-260815-018" })).toBeVisible();
    expect(card?.querySelector(".record-card-footer")).not.toBeNull();
    expect(card?.querySelector(".record-card-meta")).toBeNull();
    expect(card?.querySelector(".record-photo-gallery")).toBeNull();
    expect(within(card as HTMLElement).getByRole("button", { name: "Xóa phiếu KPH-260815-018" })).toBeVisible();
    expect(document.querySelector(".mobile-history .approval-control-label")).not.toBeInTheDocument();
  });

  it("expands a compact card from its content and collapses it from the product row", () => {
    render(<App />);
    const card = document.querySelector(".record-card") as HTMLElement;

    fireEvent.click(within(card).getByText("Cận date"));
    expect(card).not.toHaveClass("is-compact");
    expect(within(card).getByText("15/08/2026")).toBeVisible();
    expect(within(card).queryByText("Phát hiện")).not.toBeInTheDocument();
    expect(within(card).queryByText("Số lượng · NCC")).not.toBeInTheDocument();

    const outcomes = card.querySelector(".record-card-outcomes");
    expect(outcomes).not.toBeNull();
    expect(within(outcomes as HTMLElement).getByText("Cận date")).toBeVisible();
    expect(within(outcomes as HTMLElement).getByText("ĐỔI")).toBeVisible();

    const note = card.querySelector(".record-card-note");
    expect(note).not.toBeNull();
    expect(within(note as HTMLElement).getByText("Ghi chú:")).toBeVisible();
    expect(within(note as HTMLElement).getByText(/Hàng cận hạn dùng còn 3 ngày/i)).toBeVisible();

    fireEvent.click(within(card).getByText("Bánh quy bơ hộp 300 g"));
    expect(card).toHaveClass("is-compact");
  });

  it("expands and collapses every mobile card in the active tab", () => {
    render(<App />);
    const card = document.querySelector(".record-card") as HTMLElement;

    fireEvent.click(screen.getByRole("button", { name: "Mở rộng tất cả" }));
    expect(card).not.toHaveClass("is-compact");
    expect(screen.getByRole("button", { name: "Thu gọn tất cả" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Thu gọn tất cả" }));
    expect(card).toHaveClass("is-compact");
  });

  it("updates the approval state consistently in table and mobile card views", () => {
    render(<App />);
    const approvalControls = screen.getAllByRole("combobox", { name: "Trạng thái duyệt phiếu KPH-260815-018" });

    expect(approvalControls).toHaveLength(2);
    expect(approvalControls[0]).toHaveValue("PENDING");
    fireEvent.change(approvalControls[0]!, { target: { value: "APPROVED" } });

    expect(approvalControls[0]).toHaveValue("APPROVED");
    expect(approvalControls[1]).toHaveValue("APPROVED");
    expect(screen.getByText(/Đã chuyển phiếu KPH-260815-018 sang “Đã duyệt”/i)).toBeVisible();
  });

  it("keeps both delete entry points and restores one record from the trash view", () => {
    render(<App />);
    const rowDeleteButtons = screen.getAllByRole("button", { name: "Xóa phiếu KPH-260815-018" });
    expect(rowDeleteButtons).toHaveLength(2);
    fireEvent.click(rowDeleteButtons[0]!);

    const dialog = screen.getByRole("dialog", { name: "Chuyển 1 phiếu sang trạng thái đã xoá?" });
    expect(within(dialog).getByText(/không có thao tác xoá vĩnh viễn/i)).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Xóa phiếu" }));

    expect(screen.queryByText("Bánh quy bơ hộp 300 g")).not.toBeInTheDocument();
    expect(document.querySelector(".history-total-count")).toHaveTextContent("0");
    expect(screen.getByText(/Đã chuyển 1 phiếu sang trạng thái đã xoá/i)).toBeVisible();

    const titleRow = document.querySelector(".history-title-row") as HTMLElement;
    const titleActions = within(titleRow).getAllByRole("button");
    const filterButton = within(titleRow).getByRole("button", { name: "Mở lọc và sắp xếp trên mobile" });
    const trashToggle = within(titleRow).getByRole("button", { name: "Mở thùng rác, có 1 phiếu" });
    expect(titleRow).toHaveClass("pr-3");
    expect(trashToggle).toHaveTextContent("Phiếu đã xoá");
    expect(trashToggle.querySelector(".lucide-history")).not.toBeNull();
    expect(titleActions.indexOf(filterButton)).toBeLessThan(titleActions.indexOf(trashToggle));
    fireEvent.click(trashToggle);

    expect(screen.getByRole("heading", { name: /Phiếu đã xoá/i })).toBeVisible();
    expect(document.querySelector(".history-board")).toHaveClass("is-trash-mode");
    expect(document.querySelector(".grid.gap-3.mobile-history")).not.toBeNull();
    const restoreButtons = screen.getAllByRole("button", { name: "Khôi phục phiếu KPH-260815-018" });
    expect(restoreButtons).toHaveLength(2);
    expect(restoreButtons[0]?.querySelector(".lucide-rotate-ccw")).not.toBeNull();
    expect(restoreButtons[0]?.querySelector(".lucide-trash-2")).toBeNull();

    fireEvent.click(restoreButtons[0]!);
    expect(screen.queryByText("Bánh quy bơ hộp 300 g")).not.toBeInTheDocument();
    expect(screen.getByText(/Đã khôi phục phiếu KPH-260815-018/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Quay lại phiếu đã khai báo" }));
    expect(screen.getAllByText("Bánh quy bơ hộp 300 g")).toHaveLength(2);
  });

  it("keeps action tools in trash mode and restores every selected record", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Xóa phiếu KPH-260815-018" })[0]!);
    fireEvent.click(within(screen.getByRole("dialog", { name: "Chuyển 1 phiếu sang trạng thái đã xoá?" })).getByRole("button", { name: "Xóa phiếu" }));
    fireEvent.click(screen.getByRole("button", { name: "Mở thùng rác, có 1 phiếu" }));

    expect(document.querySelector(".selection-count")).toHaveTextContent("Đã chọn 0");
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));

    expect(screen.getByRole("button", { name: "Khôi phục 1 phiếu" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Xuất Excel" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Xóa phiếu đã chọn" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Khôi phục 1 phiếu" }));
    expect(document.querySelector(".history-total-count")).toHaveTextContent("0");
    expect(document.querySelector(".selection-count")).toHaveTextContent("Đã chọn 0");
    expect(screen.getByText(/Đã khôi phục 1 phiếu trong dữ liệu demo/i)).toBeVisible();
  });

  it("summarizes selected rows and images before exporting Excel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));

    const dialog = screen.getByRole("dialog", { name: "Xuất phiếu ra Excel" });
    expect(within(dialog).getByText("TP Khô & khác")).toBeVisible();
    expect(within(dialog).getByText("Co.op Food Nguyễn Kiệm · 0001")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Xuất 1 dòng" })).toBeEnabled();
  });
});
