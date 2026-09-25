import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(within(functions).getAllByRole("button")).toHaveLength(6);
    expect(screen.queryByRole("region", { name: "Việc cần chú ý" })).not.toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Điều hướng Store App" });
    expect(within(navigation).getAllByRole("button").map((button) => button.textContent)).toEqual(["Trang chủ", "Thông báo", "Cài đặt"]);
    expect(document.querySelectorAll(".expiry-workbench")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Tra cứu lùi hàng Tính DATE và hạn lùi/i }));
    expect(screen.getByLabelText("Ngày sản xuất")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" }));
    fireEvent.click(within(functions).getByRole("button", { name: /KPH Ghi nhận hàng không phù hợp/i }));
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
    fireEvent.click(within(screen.getByRole("navigation", { name: "Điều hướng Store App" })).getByRole("button", { name: "Trang chủ" }));
    fireEvent.click(screen.getByRole("button", { name: /Tồn kho Tra SKU và lô hàng/i }));
    expect(screen.getByText("LOT123")).toBeVisible();
    expect(screen.getByText("31 Hộp")).toBeVisible();
    fireEvent.click(within(screen.getByRole("navigation", { name: "Điều hướng Store App" })).getByRole("button", { name: "Trang chủ" }));
    fireEvent.click(screen.getByRole("button", { name: /Báo cáo Xem tình hình vận hành/i }));
    expect(screen.getByRole("heading", { name: "Kết quả · 8 dòng" })).toBeVisible();
    expect(screen.getByText(/LOT123 · HSD/)).toBeVisible();
  });

  it("moves operational attention to Notifications and role control to Settings", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    render(<ClientStoreDemo><div>KPH workspace</div></ClientStoreDemo>);
    const navigation = screen.getByRole("navigation", { name: "Điều hướng Store App" });
    fireEvent.click(within(navigation).getByRole("button", { name: "Thông báo" }));
    expect(screen.getByRole("heading", { name: "Thông báo" })).toBeVisible();
    expect(screen.getByText(/Chênh lệch: Bánh mì sandwich/)).toBeVisible();
    expect(screen.queryByText(/chờ duyệt/i)).not.toBeInTheDocument();
    fireEvent.click(within(navigation).getByRole("button", { name: "Cài đặt" }));
    expect(screen.getByRole("heading", { name: "Cài đặt" })).toBeVisible();
    fireEvent.change(screen.getByRole("combobox", { name: "Vai trò demo" }), { target: { value: "manager" } });
    expect(screen.getByRole("button", { name: /Tài khoản Quản lý · Nguyễn Văn Demo/i })).toBeVisible();
  });

  it("records a first check and a re-check as separate logs against the latest local count", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    render(<ClientStoreDemo><div>KPH workspace</div></ClientStoreDemo>);
    fireEvent.click(screen.getByRole("button", { name: /Kiểm khớp So tồn tham chiếu với thực tế/i }));

    expect(screen.getAllByText(/inventory-reference-demo.csv/).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Nhập barcode / SKU thủ công"), { target: { value: "SP000123" } });
    expect(screen.getByText(/Tồn tham chiếu ngoài: 24 Hộp/)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Thực tế (Hộp)"), { target: { value: "18" } });
    expect(screen.getByText(/Chênh lệch -6/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Ghi nhận & kiểm tiếp/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Số kiểm gần nhất đã cập nhật");

    fireEvent.change(screen.getByLabelText("Nhập barcode / SKU thủ công"), { target: { value: "SP000123" } });
    expect(screen.getByText((_, element) => element?.tagName === "SPAN" && element.textContent?.includes("Tồn tham chiếu dùng lần này") === true)).toHaveTextContent("18 Hộp");
    fireEvent.change(screen.getByLabelText("Thực tế (Hộp)"), { target: { value: "20" } });
    expect(screen.getByText(/Chênh lệch \+2/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Ghi nhận & kiểm tiếp/i }));
    expect(screen.queryByText(/Chờ duyệt|Yêu cầu kiểm lại|đợt kiểm kê/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nhập barcode / SKU thủ công"), { target: { value: "SP000123" } });
    expect(screen.getByText((_, element) => element?.tagName === "SPAN" && element.textContent?.includes("Tồn tham chiếu:") === true)).toHaveTextContent("24 Hộp");
    expect(screen.getByText((_, element) => element?.tagName === "SPAN" && element.textContent?.includes("Số kiểm gần nhất:") === true)).toHaveTextContent("20 Hộp");

    fireEvent.click(within(screen.getByRole("navigation", { name: "Điều hướng Store App" })).getByRole("button", { name: "Trang chủ" }));
    fireEvent.click(screen.getByRole("button", { name: /Báo cáo Xem tình hình vận hành/i }));
    fireEvent.click(screen.getByRole("button", { name: "Kiểm khớp & chênh lệch" }));
    expect(screen.getByText("Sữa tươi TH true milk 1L")).toBeVisible();
    expect(screen.getByText(/24 → 20 \(-4\)/)).toBeVisible();
    expect(screen.getAllByText(/Trần Minh Anh/).length).toBeGreaterThan(0);
  });

  it("imports the demo CSV mapping as a new reference snapshot before checking", async () => {
    vi.stubGlobal("scrollTo", vi.fn());
    render(<ClientStoreDemo><div>KPH workspace</div></ClientStoreDemo>);
    fireEvent.click(screen.getByRole("button", { name: /Kiểm khớp So tồn tham chiếu với thực tế/i }));
    const file = new File(["SKU,Reference quantity\nSP000123,26\n"], "inventory-export-demo.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => "SKU,Reference quantity\nSP000123,26\n" });
    fireEvent.change(screen.getByLabelText("Nạp CSV snapshot tồn kho demo"), { target: { files: [file] } });
    expect(await screen.findByText(/inventory-export-demo.csv/)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Nhập barcode / SKU thủ công"), { target: { value: "SP000123" } });
    expect(screen.getByText((_, element) => element?.tagName === "SPAN" && element.textContent?.includes("Tồn tham chiếu:") === true)).toHaveTextContent("26 Hộp");
    fireEvent.change(screen.getByLabelText("Thực tế (Hộp)"), { target: { value: "25" } });
    expect(screen.getByText(/Chênh lệch -1/)).toBeVisible();
  });
});
