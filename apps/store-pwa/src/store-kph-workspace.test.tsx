import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KphWorkspace } from "./store-kph-workspace";
import { mockRecords } from "./store-app-mock";

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
  it("selects only the current page and clears selection when paging", () => {
    const records = Array.from({ length: 27 }, (_, i) => ({ ...mockRecords[0]!, id: `page-${i}`, productName: `Hàng mẫu ${i}` }));
    render(<KphWorkspace records={records} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn tất cả" })[0]!);
    expect(screen.getByText("25 đã chọn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(screen.getByText("0 đã chọn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xuất Excel" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Chọn tất cả" })[0]!);
    expect(screen.getByText("2 đã chọn")).toBeInTheDocument();
  });

  it("creates the currently selected type from the toolbar action", () => {
    render(<KphWorkspace records={mockRecords} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    fireEvent.click(screen.getByRole("group", { name: "Loại phiếu" }).querySelector("button")!);
    fireEvent.click(screen.getByRole("button", { name: "Tạo phiếu TP khô & khác" }));
    expect(screen.getByText("TP khô & khác", { selector: "small" })).toBeInTheDocument();
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
    for (const identifier of ["0011730", "29123415005", " 0011730 "]) {
      fireEvent.change(search, { target: { value: identifier } });
      expect(screen.getByText("1 phiếu")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mở phiếu Cải thìa VietGAP 500 g" })).toBeInTheDocument();
    }
  });
});
