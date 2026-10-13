import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import * as rules from "@coopfood-kph/kph-rules";

import { App } from "./app";
import { downloadKphWorkbook } from "./excel-export";

vi.mock("./excel-export", () => ({ downloadKphWorkbook: vi.fn().mockResolvedValue("synthetic-kph.xlsx") }));

vi.mock("./demo-records", async (importOriginal) => {
  const original = await importOriginal<typeof import("./demo-records")>();
  return { ...original, DEMO_RECORDS: Array.from({ length: 1_000 }, (_, index) => ({
    ...original.DEMO_RECORDS[0]!, id: `KPH-SYNTHETIC-${index}`, productName: `Sản phẩm thử ${index}`, photos: [],
  })) };
});

it("renders only the changed record's row and card when selecting in a large history", () => {
  const tone = vi.spyOn(rules, "getConditionTone");
  try {
    render(<App />);
    const initialCalls = tone.mock.calls.length;
    tone.mockClear();
    fireEvent.click(within(screen.getByRole("table")).getByRole("checkbox", { name: "Chọn phiếu KPH-SYNTHETIC-0" }));
    const updateCalls = tone.mock.calls.length;
    expect(initialCalls).toBe(100); // 50 rows + 50 mobile cards, independent of history size.
    expect(updateCalls).toBe(2);
  } finally { tone.mockRestore(); }
}, 30_000);

it("loads more rows while selecting and exporting across the whole history", async () => {
  render(<App />);
  const table = within(screen.getByRole("table"));
  expect(table.getAllByRole("row")).toHaveLength(51);
  expect(screen.getByText("Đang hiển thị 50/1000 phiếu")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Hiển thị thêm 50 phiếu" }));
  expect(table.getAllByRole("row")).toHaveLength(101);
  expect(screen.getByText("Đang hiển thị 100/1000 phiếu")).toBeVisible();
  expect(table.getByRole("checkbox", { name: "Chọn phiếu KPH-SYNTHETIC-99" })).toBeInTheDocument();
  expect(table.queryByRole("checkbox", { name: "Chọn phiếu KPH-SYNTHETIC-100" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
  expect(screen.getByRole("button", { name: "Duyệt 1000 phiếu" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
  const dialog = within(screen.getByRole("dialog", { name: "Xuất phiếu ra Excel" }));
  expect(dialog.getByRole("button", { name: "Xuất 1000 dòng" })).toBeEnabled();
  expect(dialog.getByText(/có thể chỉnh sửa/)).toBeVisible();
  fireEvent.click(dialog.getByRole("button", { name: "Xuất 1000 dòng" }));
  await waitFor(() => expect(downloadKphWorkbook).toHaveBeenCalled());
  const exported = vi.mocked(downloadKphWorkbook).mock.calls[0]![1];
  expect(exported).toHaveLength(1_000);
  expect(exported[999]?.id).toBe("KPH-SYNTHETIC-999");
}, 30_000);

it("sorts the whole history and resets the batch on view changes", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Hiển thị thêm 50 phiếu" }));
  const sort = screen.getByRole("button", { name: "Sắp xếp theo SKU/UPC · Tên hàng hóa" });
  fireEvent.click(sort);
  fireEvent.click(sort);
  const table = within(screen.getByRole("table"));
  expect(table.getAllByRole("row")).toHaveLength(51);
  expect(table.getAllByRole("row")[1]).toHaveTextContent("Sản phẩm thử 999");
  expect(screen.getByText("Đang hiển thị 50/1000 phiếu")).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: /TP Tươi sống/ }));
  expect(table.getAllByRole("row")).toHaveLength(2); // header + empty state
  fireEvent.click(screen.getByRole("tab", { name: /TP Khô & khác/ }));
  expect(screen.getByText("Đang hiển thị 50/1000 phiếu")).toBeVisible();
}, 30_000);

it("approves and filters records outside the rendered batch", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
  fireEvent.click(screen.getByRole("button", { name: "Duyệt 1000 phiếu" }));
  await waitFor(() => expect(document.querySelector(".selection-count")).toHaveTextContent("Đã chọn 0"));
  fireEvent.click(screen.getByRole("button", { name: "Mở lọc và sắp xếp trên mobile" }));
  const dialog = within(screen.getByRole("dialog", { name: "Lọc & sắp xếp" }));
  fireEvent.click(dialog.getByRole("button", { name: "Lọc Chờ duyệt" }));
  expect(document.querySelector(".history-total-count")).toHaveTextContent("0");
  fireEvent.click(dialog.getByRole("button", { name: "Lọc Đã duyệt" }));
  expect(document.querySelector(".history-total-count")).toHaveTextContent("1000");
}, 30_000);

it("deletes and restores all selected records beyond the rendered batch", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
  fireEvent.click(screen.getByRole("button", { name: "Xóa phiếu đã chọn" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Chuyển 1000 phiếu sang trạng thái đã xoá?" })).getByRole("button", { name: "Xóa phiếu" }));
  await waitFor(() => expect(document.querySelector(".history-total-count")).toHaveTextContent("0"));
  fireEvent.click(screen.getByRole("button", { name: "Mở thùng rác, có 1000 phiếu" }));
  expect(screen.getByText("Đang hiển thị 50/1000 phiếu")).toBeVisible();
  fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả" }));
  fireEvent.click(screen.getByRole("button", { name: "Khôi phục 1000 phiếu" }));
  await waitFor(() => expect(document.querySelector(".history-total-count")).toHaveTextContent("0"));
  fireEvent.click(screen.getByRole("button", { name: "Quay lại phiếu đã khai báo" }));
  expect(screen.getByText("Đang hiển thị 50/1000 phiếu")).toBeVisible();
}, 30_000);
