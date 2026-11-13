import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { vi, afterEach, beforeEach, describe, expect, it } from "vitest";
import { useState } from "react";
import { DateWorkspace as ControlledDateWorkspace } from "./store-date-workspace";
import { mockDateLots } from "./store-app-mock";

function DateWorkspace({ resolved = false, initialLotId }: {resolved?: boolean; initialLotId?: string} = {}) {
  const [lots, setLots] = useState(resolved ? mockDateLots.map(lot => lot.id === "C24-118" ? { ...lot, status: "resolved" as const } : lot) : mockDateLots);
  return <ControlledDateWorkspace lots={lots} onLotsChange={setLots} today="2026-10-07" onCreateKph={async () => "synthetic-kph"} {...(initialLotId ? {initialLotId} : {})} />;
}
function statusFilter(name: string) {
  fireEvent.click(screen.getByRole("button", {name:"Lọc DATE"}));
  fireEvent.click(within(screen.getByRole("group", {name:"Trạng thái xử lý"})).getByRole("button", {name}));
  fireEvent.click(screen.getByRole("button", {name:"Xong"}));
}

beforeEach(() => vi.stubGlobal("matchMedia", () => ({matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()})));
afterEach(() => vi.unstubAllGlobals());

describe("DATE food-kind workspace", () => {
  it("clears a detail when acknowledgement excludes its lot from an explicit open filter", async () => {
    render(<DateWorkspace />); statusFilter("Mở");
    fireEvent.click(screen.getByRole("button", { name: /Cải thìa/ }));
    await screen.findByRole("heading", { name: "Chi tiết lô DATE" });
    fireEvent.click(screen.getByRole("button", { name: "Ghi nhận" }));
    fireEvent.click(screen.getByRole("button", { name: "Hẹn báo lại" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Chi tiết lô DATE" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", {name:/Cải thìa/})).not.toBeInTheDocument();
  });

  it("shows all existing lots without inferring DATE groups and offers one create action", () => {
    render(<DateWorkspace />);
    expect(screen.getByRole("combobox", {name:"Nhóm DATE"})).toHaveTextContent("Tất cả nhóm");
    expect(screen.getByRole("button", {name:"Thêm theo dõi DATE"})).toBeInTheDocument();
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(7);
    expect(screen.getAllByText("Chưa phân loại").length).toBeGreaterThan(0);
  });
  it("excludes resolved lots and keeps status filtering", () => {
    render(<DateWorkspace resolved />); statusFilter("Đã ghi nhận");
    expect(screen.queryByRole("button", {name:/Cải thìa/})).not.toBeInTheDocument();
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", {name:"Lọc DATE"}));
    expect(screen.queryByRole("button", {name:"Đã xử lý"})).not.toBeInTheDocument();
  });
  it("finds an exact lot without assigning a catalog group", () => {
    render(<DateWorkspace />);
    fireEvent.change(screen.getByRole("textbox", {name:"Tìm SKU, barcode, tên hàng hoặc lô"}),{target:{value:"D24-090"}});
    expect(screen.getByRole("combobox", {name:"Nhóm DATE"})).toHaveTextContent("Chưa phân loại");
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(1);
  });

  it.each(["A24-255","D24-090"])("opens an exact incoming notification target %s without a type filter hiding it", async initialLotId => {
    render(<DateWorkspace initialLotId={initialLotId} />);
    expect(await screen.findByRole("dialog", {name:"Chi tiết lô DATE"})).toHaveTextContent(initialLotId);
  });

  it("uses a keyboard-accessible table opener and the same detail sheet on desktop", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({matches: query.includes("900px"), addEventListener: vi.fn(), removeEventListener: vi.fn()}));
    render(<DateWorkspace />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name:/Mở lô Cải thìa/}));
    expect(screen.getByRole("dialog", {name:"Chi tiết lô DATE"})).toHaveTextContent("C24-118");
    expect(screen.queryByRole("region", {name:"Chi tiết lô DATE"})).not.toBeInTheDocument();
  });
});
