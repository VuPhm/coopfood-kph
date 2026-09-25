import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { addDays, formatDisplayDate } from "@coopfood-kph/kph-rules";
import { demoToday } from "./client-store-demo-data";
import { ClientStoreDemo } from "./client-store-demo";

afterEach(() => vi.unstubAllGlobals());

describe("Client Store Demo", () => {
  it("opens the reused expiry lookup from Home while keeping the workbench single", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    render(<ClientStoreDemo><div>KPH workspace</div></ClientStoreDemo>);

    const functions = screen.getByRole("region", { name: "Chức năng" });
    const attention = screen.getByRole("region", { name: "Việc cần chú ý" });
    expect(functions.compareDocumentPosition(attention) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelectorAll(".expiry-workbench")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Tra cứu lùi hàng Tính DATE và hạn lùi/i }));
    expect(screen.getByLabelText("Ngày sản xuất")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" }));
    fireEvent.click(screen.getByRole("button", { name: "KPH" }));
    expect(screen.getByText("KPH workspace")).toBeVisible();
    expect(document.querySelectorAll(".expiry-workbench")).toHaveLength(1);
  });

  it("receives a lot and shows the new quantity and lot in inventory and reports", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    render(<ClientStoreDemo><div>KPH workspace</div></ClientStoreDemo>);

    fireEvent.click(screen.getByRole("button", { name: /Nhập hàng Quét và nhận lô hàng/i }));
    fireEvent.change(screen.getByLabelText("Barcode / SKU"), { target: { value: "SP000123" } });
    fireEvent.click(screen.getByRole("button", { name: /Xem sản phẩm/i }));
    expect(screen.getByText("TH Food")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));

    const today = demoToday();
    fireEvent.change(screen.getByLabelText("Ngày sản xuất (NSX) *"), { target: { value: formatDisplayDate(addDays(today, -10)) } });
    fireEvent.change(screen.getByLabelText("Hạn sử dụng (HSD) *"), { target: { value: formatDisplayDate(addDays(today, 20)) } });
    fireEvent.change(screen.getByLabelText("Số lượng (Hộp) *"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText(/Số lô \/ LOT/), { target: { value: "LOT123" } });
    fireEvent.click(screen.getByRole("button", { name: /Lưu lô hàng/i }));

    expect(screen.getByRole("heading", { name: "Đã lưu lô hàng" })).toBeVisible();
    expect(screen.getByText("LOT123", { exact: false })).toBeVisible();
    expect(screen.getByText("31 Hộp")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Tồn kho" }));
    expect(screen.getByText("LOT123")).toBeVisible();
    expect(screen.getByText("31 Hộp")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Báo cáo" }));
    expect(screen.getByRole("heading", { name: "Kết quả · 8 dòng" })).toBeVisible();
    expect(screen.getByText(/LOT123 · HSD/)).toBeVisible();
  });
});
