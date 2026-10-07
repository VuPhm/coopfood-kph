import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShelfLifeScreen } from "./store-shelf-life";

const change = (name: string, value: string) => fireEvent.change(screen.getByRole("textbox", { name }), { target: { value } });
const lookup = () => fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));

describe("Shelf life input corrections", () => {
  afterEach(() => vi.useRealTimers());

  it("validates partial edits and recalculates the inclusive 9/10-day boundary without changing the year", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-06T00:00:00+07:00"));
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "10/10/2026");
    lookup();
    expect(document.querySelector(".store-result-date")).toHaveTextContent("08/10/2026");
    change("Ngày sản xuất", "0/10/2026");
    lookup();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(document.querySelector(".store-shelf-result")).toBeNull();
    change("Ngày sản xuất", "02/10/2026");
    expect(screen.getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveValue("9");
    lookup();
    expect(document.querySelector(".store-result-date")).toHaveTextContent("10/10/2026");
    change("Hạn sử dụng (HSD)", "10/1/2026");
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("10/1/2026");
    change("Hạn sử dụng (HSD)", "10/11/2026");
    expect(screen.getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveValue("40");
    lookup();
    expect(document.querySelector(".store-result-date")).toHaveTextContent("02/11/2026");
  });
  it("clears the derived expiry when its duration is cleared", () => {
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    change("HSD (Số ngày)", "10");
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("10/10/2026");
    change("HSD (Số ngày)", "");
    lookup();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(document.querySelector(".store-shelf-result")).toBeNull();
  });
  it("requires a duration when unknown manufacture mode has stale dates", () => {
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "10/10/2026");
    fireEvent.click(screen.getByRole("radio", { name: /Chưa biết NSX/ }));
    change("HSD (Số ngày)", "");
    lookup();
    expect(screen.getByRole("alert")).toHaveTextContent("Nhập thời hạn");
  });
  it("rejects equal manufacture and expiry dates using the domain rule", () => {
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "01/10/2026");
    lookup();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(document.querySelector(".store-shelf-result")).toBeNull();
  });
});
