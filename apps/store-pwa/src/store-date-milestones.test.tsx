import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { DateWorkspace } from "./store-date-workspace";
import type { MockDateLot } from "./store-app-mock";
const expired: MockDateLot = { id: "LOT-01", sku: "000001", name: "Lô hết hạn", manufactured: "01/10/2026", date: "2026-10-10", status: "open" };
function Workspace({ initial = [expired] }: { initial?: MockDateLot[] }) {
  const [lots, setLots] = useState(initial);
  return <DateWorkspace lots={lots} onLotsChange={setLots} onCreateKph={async () => "synthetic-kph"} />;
}
describe("DATE milestones and processing are separate", () => {
  afterEach(() => vi.useRealTimers());
  function today() { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-12T00:00:00+07:00")); }
  it("keeps Hết HSD after resolution and reuses the Tra hạn timeline with lot identity", () => {
    today(); render(<Workspace initial={[{ ...expired, status: "resolved" }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Theo dõi DATE/ }));
    fireEvent.click(screen.getByRole("button", { name: /Lô hết hạn/ }));
    let dialog = screen.getByRole("dialog", { name: "Chi tiết lô DATE" });
    const milestones = within(dialog).getByRole("region", { name: "Mốc DATE của lô" });
    expect(milestones.querySelector(".store-date-condition")).toHaveAttribute("data-date-phase", "EXPIRED");
    expect(within(milestones).getByRole("img", { name: "Hôm nay · Qua HSD 12/10/2026" })).toBeInTheDocument();
    expect(dialog).toHaveTextContent("000001"); expect(dialog).toHaveTextContent("LOT-01");
    expect(within(dialog).getByRole("button", { name: "Đã xử lý" })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Đóng" }));
    const card = screen.getByRole("button", { name: /Lô hết hạn/ });
    expect(card.querySelector('[data-processing-status="resolved"]')).toHaveTextContent("Đã xử lý");
    expect(card.querySelector('[data-date-phase="EXPIRED"]')).toHaveTextContent("Hết HSD");
    expect(card.querySelector(".store-timeline, .store-date-life")).toBeNull();
    expect(card.querySelector(".store-date-percent")).toHaveTextContent("Còn 0% HSD");
    expect(card.querySelector(".store-date-percent")).toHaveAttribute("data-tone", "danger");
    fireEvent.click(card);
    dialog = screen.getByRole("dialog", { name: "Chi tiết lô DATE" });
    expect(dialog.querySelector('[data-processing-status="resolved"]')).toHaveTextContent("Đã xử lý");
    expect(dialog.querySelector('[data-date-phase="EXPIRED"]')).toHaveTextContent("Hết HSD");
  });
  it("filters DATE phase and restores all lots from an empty result", () => {
    today(); render(<Workspace initial={[expired, { ...expired, id: "LOT-02", name: "Lô còn hạn", date: "2026-12-30" }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Theo dõi DATE/ }));
    fireEvent.click(screen.getByRole("button", { name: "Lọc DATE" }));
    const group = screen.getByRole("group", { name: "Tình trạng DATE" });
    fireEvent.click(within(group).getByRole("button", { name: "Cảnh báo" }));
    fireEvent.click(screen.getByRole("button", { name: "Xong" }));
    expect(screen.getByText("Không có lô phù hợp")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả lô" }));
    expect(screen.getByRole("button", { name: /Lô còn hạn/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lô hết hạn/ })).toBeInTheDocument();
  });
  it.each([ [undefined, "2026-10-20", "MISSING"], ["31/02/2026", "2026-10-20", "INVALID"], [undefined, "2026-02-31", "INVALID"] ] as const)("shows %s / %s without fabricating a timeline", (manufactured, date, phase) => {
    today(); const { manufactured: _oldNsx, ...base } = expired;
    render(<Workspace initial={[{ ...base, ...(manufactured ? { manufactured } : {}), date }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Lô hết hạn/ }));
    const detail = screen.getByRole("region", { name: "Mốc DATE của lô" });
    expect(detail.querySelector(".store-date-condition")).toHaveAttribute("data-date-phase", phase);
    expect(detail.querySelector(".store-timeline")).toBeNull();
    expect(detail.querySelector(".store-date-percent")).toHaveTextContent("Chưa đủ dữ liệu");
  });
});
