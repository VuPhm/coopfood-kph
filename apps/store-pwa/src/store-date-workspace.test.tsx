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

  it("uses the two food kinds as primary tabs and leaves unsupported creation out of the toolbar", () => {
    render(<DateWorkspace />);
    const tabs=screen.getByRole("group", {name:"Loại thực phẩm"});
    expect(within(tabs).getAllByRole("button")).toHaveLength(2);
    expect(within(tabs).getByRole("button", {name:/TP tươi sống/})).toHaveAttribute("aria-pressed","true");
    expect(within(tabs).getByRole("button", {name:/TP khô & khác/})).toHaveTextContent("3");
    expect(screen.queryByRole("button", {name:/Theo dõi DATE|Thêm theo dõi/})).not.toBeInTheDocument();
  });

  it("does not silently classify unknown lots or discard them from the workspace", () => {
    render(<DateWorkspace />);
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", {name:/Chưa phân loại/}));
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(3);
    expect(screen.getByRole("button", {name:/Lô D24-090/})).toBeInTheDocument();
    expect(within(screen.getByRole("group", {name:"Loại thực phẩm"})).getAllByRole("button").every(button=>button.getAttribute("aria-pressed")==="false")).toBe(true);
  });

  it("excludes resolved lots and keeps status filtering independent of the selected food kind", () => {
    render(<DateWorkspace resolved />);
    expect(screen.queryByRole("button", {name:/Cải thìa/})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name:/TP khô & khác/})); statusFilter("Đã ghi nhận");
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(1);
    expect(screen.getByRole("button", {name:/Lô A24-301/})).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name:/Chưa phân loại/}));
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", {name:"Lọc DATE"}));
    expect(screen.queryByRole("button", {name:"Đã xử lý"})).not.toBeInTheDocument();
  });

  it("routes exact SKU/barcode/lot lookup to the explicit kind, including unknown", () => {
    render(<DateWorkspace />);
    const query=screen.getByRole("textbox", {name:"Tìm SKU, barcode, tên hàng hoặc lô"});
    fireEvent.change(query,{target:{value:"8936000123456"}});
    expect(screen.getByRole("button", {name:/TP khô & khác/})).toHaveAttribute("aria-pressed","true");
    expect(document.querySelectorAll("[data-date-lot-id]")).toHaveLength(3);
    fireEvent.change(query,{target:{value:"D24-090"}});
    expect(screen.getByRole("button", {name:/Chưa phân loại/})).toHaveAttribute("aria-pressed","true");
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
