import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { DateWorkspace as ControlledDateWorkspace } from "./store-date-workspace";
import { parseDisplayDate } from "@coopfood-kph/kph-rules";
import { mockDateLots } from "./store-app-mock";

function DateWorkspace() {
  const [lots, setLots] = useState(mockDateLots);
  return <ControlledDateWorkspace lots={lots} onLotsChange={setLots} />;
}

describe("memory-only DATE workspace", () => {
  it("clears a detail selection when acknowledging hides its lot under the active filter", async () => {
    render(<DateWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: /Sản phẩm C/ }));
    await screen.findByRole("heading", { name: "Xử lý cảnh báo DATE" });
    fireEvent.click(screen.getByRole("button", { name: "Ghi nhận" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Xử lý cảnh báo DATE" })).not.toBeInTheDocument());
    expect(screen.getAllByRole("button", { name: /Sản phẩm/ })).toHaveLength(1);
  });

  it("keeps the not-yet-designed tracking action disabled", () => {
    render(<DateWorkspace />);
    expect(screen.getByRole("button", { name: /Thêm theo dõi/ })).toBeDisabled();
    expect(screen.getByText("Chức năng chưa sẵn sàng trong bản dùng thử")).toBeInTheDocument();
  });

  it("prevents acknowledging an already resolved lot on mobile", async () => {
    render(<DateWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: /Theo dõi DATE/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sản phẩm C/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Đã xử lý" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Xử lý cảnh báo DATE" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Sản phẩm C/ }));
    const dialog = await screen.findByRole("dialog", { name: "Xử lý cảnh báo DATE" });
    expect(dialog).toHaveTextContent("Đã xử lý");
    expect(screen.getByRole("button", { name: "Ghi nhận" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đã xử lý" })).toBeDisabled();
  });
});

it("searches an exact lot with surrounding whitespace", () => {
  render(<DateWorkspace />);
  fireEvent.change(screen.getByRole("textbox", { name: "Tìm mã hàng hoặc lô" }), { target: { value: " C24-118 " } });
  expect(screen.getByRole("button", { name: /Sản phẩm C/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Sản phẩm D/ })).not.toBeInTheDocument();
});


describe("desktop DATE expiry copy", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it.each([["07/10/2026", "Qua 2 ngày"], ["09/10/2026", "Hết hạn hôm nay"]])("describes expiry %s without a negative day count", (date, label) => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-09T03:00:00Z"));
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const lot = { ...mockDateLots[0]!, status: "open" as const, date: parseDisplayDate(date!) };
    render(<ControlledDateWorkspace lots={[lot]} onLotsChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(lot.name) }));
    const row = [...document.querySelectorAll(".store-date-detail .store-summary > div")].find(el => el.querySelector("dt")?.textContent === "Còn lại");
    expect(row?.querySelector("dd")).toHaveTextContent(label!);
  });
});
