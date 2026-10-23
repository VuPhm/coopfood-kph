import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreNotifications } from "./store-notifications";
import type { MockDateLot } from "./store-app-mock";
const lot: MockDateLot = { id: "LOT-01", sku: "00001", name: "Lô hết hạn", manufactured: "01/10/2026", date: "2026-10-10", status: "open" };
describe("Store notifications", () => {
  it("shows a DATE group, keeps identity and opens the exact lot", () => {
    const open = vi.fn();
    render(<StoreNotifications navigate={vi.fn()} lots={[lot]} today="2026-10-11" onOpenDateLot={open} />);
    const group = screen.getByRole("region", { name: "DATE" });
    expect(within(group).getByRole("heading", { name: /Hết HSD/ })).toBeInTheDocument();
    const item = within(group).getByRole("button", { name: /Lô hết hạn/ });
    expect(item).toHaveTextContent("SKU 00001 · Lô LOT-01");expect(item).toHaveTextContent("Còn 0% HSD");
    fireEvent.click(item);expect(open).toHaveBeenCalledWith("LOT-01");
  });
  it("shows the empty state only when no actionable group remains", () => {
    const navigate = vi.fn();
    render(<StoreNotifications navigate={navigate} lots={[{ ...lot, status: "resolved" }]} today="2026-10-11" onOpenDateLot={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Chưa có thông báo" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "DATE" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mở trang chủ" }));expect(navigate).toHaveBeenCalledWith("home");
  });
});
