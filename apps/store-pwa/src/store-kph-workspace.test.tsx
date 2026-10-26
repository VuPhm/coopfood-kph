import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KphWorkspace } from "./store-kph-workspace";
import { mockRecords } from "./store-app-mock";

function grouping(enabled: boolean) {
  fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
  const toggle = screen.getByRole("switch", { name: "Nhóm theo ngày" });
  if (toggle.getAttribute("aria-checked") !== String(enabled)) fireEvent.click(toggle);
  fireEvent.click(within(screen.getByRole("dialog", { name: "Lọc & sắp xếp" })).getByRole("button", { name: "Xong" }));
}

describe("Mock KPH history contract", () => {
  it("counts both types within the date range independently of approval", () => {
    render(<KphWorkspace records={mockRecords} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    const tabs = within(screen.getByRole("group", { name: "Loại phiếu" }));
    fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
    fireEvent.click(screen.getByRole("button", { name: "Chờ duyệt" }));
    expect(tabs.getByText("TP tươi sống").closest("button")).toHaveTextContent(`TP tươi sống${mockRecords.filter(r => r.kind === "TPTS").length}`);
    expect(tabs.getByText("TP khô & khác").closest("button")).toHaveTextContent(`TP khô & khác${mockRecords.filter(r => r.kind === "TPCN").length}`);
    fireEvent.change(screen.getByRole("textbox", { name: "Từ ngày" }), { target: { value: "16/08/2026" } });
    expect(tabs.getByText("TP tươi sống").closest("button")).toHaveTextContent("TP tươi sống0");
    expect(tabs.getByText("TP khô & khác").closest("button")).toHaveTextContent("TP khô & khác0");
  });
  it("selects only shown records and preserves selection when showing more", () => {
    const records = Array.from({ length: 27 }, (_, i) => ({ ...mockRecords[0]!, id: `page-${i}`, productName: `Hàng mẫu ${i}` }));
    render(<KphWorkspace records={records} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn tất cả" })[0]!);
    expect(screen.getByText("25 đã chọn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Hiển thị thêm/ }));
    expect(screen.getByText("25 đã chọn")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox", { name: /^Chọn Hàng mẫu/ })).toHaveLength(27);
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn tất cả" })[0]!);
    expect(screen.getByText("27 đã chọn")).toBeInTheDocument();
  });

  it("creates the requested type from its direct CTA", async () => {
    render(<KphWorkspace records={mockRecords} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    fireEvent.click(screen.getByRole("group", { name: "Loại phiếu" }).querySelector("button")!);
    fireEvent.click(screen.getByRole("button", { name: "Tạo phiếu TP khô & khác" }));
    // The first lazy form import also compiles its dependencies in a cold suite.
    await screen.findByRole("textbox", { name: "Tên hàng hóa" }, { timeout: 5000 });
    expect(await screen.findByText("TP khô & khác", { selector: "small" })).toBeInTheDocument();
  });

  it("selects one fixture without selecting a second record or exporting it", () => {
    render(<KphWorkspace records={mockRecords} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn Cải thìa VietGAP 500 g" })[0]!);
    for (const checkbox of screen.getAllByRole("checkbox", { name: "Chọn Nông sản mẫu 01" })) expect(checkbox).not.toBeChecked();
    expect(screen.getByText("1 đã chọn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
    expect(screen.getByRole("dialog", { name: "Xuất Excel" })).toHaveTextContent("1 phiếu đã duyệt");
  });

  it("searches leading-zero SKU and barcode separately on a found record", () => {
    const record = { ...mockRecords[0]!, barcode: "29123415005" };
    render(<KphWorkspace records={[record]} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    const search = screen.getByRole("textbox", { name: "Tìm tên hàng hoặc SKU" });
    for (const identifier of ["0011730", "29123415005"]) {
      fireEvent.change(search, { target: { value: identifier } });
      expect(screen.getByText("1 phiếu", { selector: ".store-result-count" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mở phiếu Cải thìa VietGAP 500 g" })).toBeInTheDocument();
    }
  });
});

describe("KPH day selection and progressive results", () => {
  const base = mockRecords[0]!;
  const makeRecords = () => Array.from({ length: 52 }, (_, i) => ({ ...base, id: `day-${String(i).padStart(2, "0")}`, productName: `Phiếu ${i}`, detectedDate: i < 30 ? "22/10/2026" : "21/10/2026" }));

  it("selects the loaded part of a day, exposes partial state after append and keeps other days intact", () => {
    render(<KphWorkspace records={makeRecords()} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    grouping(true);
    const today = () => screen.getByRole("checkbox", { name: "Chọn ngày 22/10/2026" });
    expect(screen.getByText("25/30 phiếu đã hiện")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    fireEvent.click(today());
    expect(screen.getByText("25 đã chọn")).toBeInTheDocument();
    expect(today()).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Thu gọn ngày 22/10/2026" }));
    expect(screen.queryByRole("button", { name: /^Mở phiếu/ })).not.toBeInTheDocument();
    expect(today()).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /Hiển thị thêm/ }));
    expect(screen.getByRole("button", { name: "Thu gọn ngày 22/10/2026" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Đã hiển thị 50/52 phiếu")).toBeInTheDocument();
    expect(today()).toBePartiallyChecked();
    fireEvent.click(today());
    expect(screen.getByText("30 đã chọn")).toBeInTheDocument();
    const yesterday = () => screen.getByRole("checkbox", { name: "Chọn ngày 21/10/2026" });
    fireEvent.click(yesterday());
    expect(screen.getByText("50 đã chọn")).toBeInTheDocument();
    fireEvent.click(today());
    expect(screen.getByText("20 đã chọn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Hiển thị thêm/ }));
    expect(yesterday()).toBePartiallyChecked();
    expect(screen.queryByRole("button", { name: /Hiển thị thêm/ })).not.toBeInTheDocument();
    expect(screen.getByText("Đã hiển thị 52/52 phiếu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("textbox", { name: "Tìm tên hàng hoặc SKU" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Tìm tên hàng hoặc SKU" }), { target: { value: "Phiếu 1" } });
    expect(screen.getByText("0 đã chọn")).toBeInTheDocument();
  });

  it("applies quick filters immediately, resets loaded extent and supports manual override/reset", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T04:00:00Z"));
    try {
      render(<KphWorkspace records={makeRecords()} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: /Hiển thị thêm/ }));
      fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
      fireEvent.click(screen.getByRole("button", { name: "Hôm nay" }));
      expect(screen.getByRole("textbox", { name: "Từ ngày" })).toHaveValue("22/10/2026");
      expect(screen.getByRole("textbox", { name: "Đến ngày" })).toHaveValue("22/10/2026");
      expect(screen.getByText("Đã hiển thị 25/30 phiếu")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Hôm qua" }));
      expect(screen.getByText("Đã hiển thị 22/22 phiếu")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Tuần này" }));
      expect(screen.getByRole("textbox", { name: "Từ ngày" })).toHaveValue("19/10/2026");
      fireEvent.change(screen.getByRole("textbox", { name: "Từ ngày" }), { target: { value: "20/10/2026" } });
      expect(screen.getByRole("button", { name: "Tuần này" })).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(screen.getByRole("button", { name: "Đặt lại bộ lọc" }));
      expect(screen.getByRole("textbox", { name: "Từ ngày" })).toHaveValue("");
      expect(screen.getByText("Đã hiển thị 25/52 phiếu")).toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
});


describe("KPH collapsible day groups", () => {
  it("keeps collapse and day selection independent inside and outside selection mode", () => {
    render(<KphWorkspace records={mockRecords} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    expect(screen.queryByRole("checkbox", { name: /^Chọn ngày/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thu gọn ngày 14/08/2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    const checkbox = screen.getByRole("checkbox", { name: "Chọn ngày 14/08/2026" });
    const expand = () => screen.getByRole("button", { name: "Mở rộng ngày 14/08/2026" });
    expect(expand()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Mở phiếu Nông sản mẫu 01" })).not.toBeInTheDocument();
    // The complete 44px checkbox label selects loaded records without opening the group.
    fireEvent.click(checkbox.closest("label")!);
    expect(checkbox).toBeChecked();
    expect(screen.getByText("5 đã chọn")).toBeInTheDocument();
    expect(expand()).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expand());
    expect(screen.getByRole("checkbox", { name: "Chọn Nông sản mẫu 01" })).toBeChecked();
    // Date and count remain part of the collapse button, separate from the label.
    fireEvent.click(within(screen.getByRole("button", { name: "Thu gọn ngày 14/08/2026" })).getByText("5 phiếu"));
    expect(checkbox).toBeChecked();
    expect(screen.getByText("5 đã chọn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xong" }));
    expect(screen.queryByRole("checkbox", { name: /^Chọn ngày/ })).not.toBeInTheDocument();
    expect(expand()).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expand());
    expect(screen.getByRole("button", { name: "Mở phiếu Nông sản mẫu 01" })).toBeInTheDocument();
  });
  it("opens collapsed groups on filter reset and when appending into that day", () => {
    const records = Array.from({ length: 30 }, (_, i) => ({ ...mockRecords[0]!, id: `collapse-${i}`, productName: `Cùng ngày ${i}` }));
    render(<KphWorkspace records={records} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    grouping(true);
    fireEvent.click(screen.getByRole("button", { name: "Thu gọn ngày 15/08/2026" }));
    expect(screen.queryByRole("button", { name: /^Mở phiếu/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Hiển thị thêm/ }));
    expect(screen.getAllByRole("button", { name: /^Mở phiếu/ })).toHaveLength(30);
    fireEvent.click(screen.getByRole("button", { name: "Thu gọn ngày 15/08/2026" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Tìm tên hàng hoặc SKU" }), { target: { value: "Cùng ngày 1" } });
    expect(screen.getByRole("button", { name: "Thu gọn ngày 15/08/2026" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Mở phiếu Cùng ngày 1" })).toBeInTheDocument();
  });
});


it("defaults to grouped days and preserves loaded extent/selection when grouping changes", () => {
  const records = Array.from({ length: 30 }, (_, i) => ({ ...mockRecords[0]!, id: `presentation-${i}` }));
  render(<KphWorkspace records={records} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
  expect(screen.getByRole("button", { name: /^Thu gọn ngày/ })).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("button", { name: /Hiển thị thêm/ }));
  fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
  fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn tất cả" })[0]!);
  grouping(true);
  expect(screen.getByText("30 đã chọn")).toBeInTheDocument();
  expect(screen.getByText("Đã hiển thị 30/30 phiếu")).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: "Chọn ngày 15/08/2026" })).toBeChecked();
  grouping(false);
  expect(screen.queryByRole("checkbox", { name: /^Chọn ngày/ })).not.toBeInTheDocument();
  expect(screen.getByText("30 đã chọn")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
  expect(screen.getByRole("switch", { name: "Nhóm theo ngày" })).toHaveAttribute("aria-checked", "false");
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại bộ lọc" }));
  expect(screen.getByRole("switch", { name: "Nhóm theo ngày" })).toHaveAttribute("aria-checked", "true");
  fireEvent.click(within(screen.getByRole("dialog", { name: "Lọc & sắp xếp" })).getByRole("button", { name: "Xong" }));
  expect(screen.getByRole("checkbox", { name: "Chọn ngày 15/08/2026" })).toBeChecked();
  expect(screen.getByText("30 đã chọn")).toBeInTheDocument();
});
