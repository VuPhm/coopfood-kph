import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShelfLifeScreen } from "./store-shelf-life";

const change = (name: string, value: string) => fireEvent.change(screen.getByRole("textbox", { name }), { target: { value } });
const lookup = () => fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));

describe("Shelf life input corrections", () => {
  afterEach(() => vi.useRealTimers());

  it.each([
    ["2026-10-05", "SAFE", "An toàn", "Đến hạn lùi", "3 ngày", "HSD còn", "5 ngày", "08/10/2026"],
    ["2026-10-06", "WARNING", "Sắp đến hạn lùi", "Đến hạn lùi", "2 ngày", "HSD còn", "4 ngày", "08/10/2026"],
    ["2026-10-08", "DANGER", "Đến hạn lùi hôm nay", "Hạn lùi hôm nay", "0 ngày", "HSD còn", "2 ngày", "08/10/2026"],
    ["2026-10-09", "DANGER", "Ngày lùi hàng", "Đã qua hạn lùi", "1 ngày", "HSD còn", "1 ngày", "08/10/2026"],
    ["2026-10-10", "DANGER", "Ngày lùi hàng", "Đã qua hạn lùi", "2 ngày", "HSD hôm nay", "0 ngày", "08/10/2026"],
    ["2026-10-11", "EXPIRED", "Đã hết hạn sử dụng", "Đã qua hạn lùi", "3 ngày", "Qua HSD", "1 ngày", "10/10/2026"],
  ])("shows %s with status, labeled day counts and the correct primary date", (today, status, badge, withdrawalLabel, withdrawalValue, expiryLabel, expiryValue, mainDate) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${today}T00:00:00+07:00`));
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "10/10/2026");
    lookup();
    const result = screen.getByRole("region", { name: "Kết quả tra hạn lùi" });
    expect(result).toHaveAttribute("data-status", status);
    expect(result.querySelector(".store-chip")).toHaveTextContent(badge);
    expect(result.querySelector(".store-result-date")).toHaveTextContent(mainDate);
    const facts = result.querySelectorAll(".store-result-facts > div");
    expect(facts[0]).toHaveTextContent(`${withdrawalLabel}${withdrawalValue}`);
    expect(facts[1]).toHaveTextContent(`${expiryLabel}${expiryValue}`);
    expect(within(result).getByRole("img", { name: `Hôm nay${status === "EXPIRED" ? " · Qua HSD" : ""} ${today.split("-").reverse().join("/")}` })).toBeInTheDocument();
  });

  it("matches the reference dates and keeps reset/edit results from going stale", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-30T00:00:00+07:00"));
    render(<ShelfLifeScreen />);
    expect(screen.getByText("Nhập ngày để tra cứu hạn lùi hàng.")).toBeInTheDocument();
    change("Ngày sản xuất", "18/01/2026");
    change("Hạn sử dụng (HSD)", "18/10/2026");
    lookup();
    const result = screen.getByRole("region", { name: "Kết quả tra hạn lùi" });
    expect(result.querySelector(".store-result-date")).toHaveTextContent("24/08/2026");
    expect(result).toHaveTextContent("Đã qua hạn lùi37 ngàyHSD còn18 ngày");
    expect(result.querySelector('time[datetime="2026-06-30"]')).toHaveTextContent("30/06");
    change("Hạn sử dụng (HSD)", "19/10/2026");
    expect(screen.queryByRole("region", { name: "Kết quả tra hạn lùi" })).not.toBeInTheDocument();
    lookup();
    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    expect(screen.queryByRole("region", { name: "Kết quả tra hạn lùi" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Ngày sản xuất" })).toHaveValue("");
  });

  it.each(["2026-10-06", "2026-10-10", "2026-10-11"])("combines the withdrawal/expiry endpoint below 10 days on %s", today => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${today}T00:00:00+07:00`));
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "02/10/2026");
    change("Hạn sử dụng (HSD)", "10/10/2026");
    lookup();
    const result = screen.getByRole("region", { name: "Kết quả tra hạn lùi" });
    expect(result.querySelectorAll(".store-timeline-milestone")).toHaveLength(2);
    expect(within(result).getByText("Hạn lùi / HSD")).toBeInTheDocument();
    expect(within(result).queryByText("Cảnh báo")).not.toBeInTheDocument();
    expect(result.querySelector(".store-result-date")).toHaveTextContent("10/10/2026");
  });

  it("labels today before manufacture without implying it lies inside the shelf life", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-30T00:00:00+07:00"));
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "10/10/2026");
    lookup();
    expect(screen.getByRole("img", { name: "Hôm nay · Trước NSX 30/09/2026" })).toHaveAttribute("data-outside", "before");
  });

  it("rechecks the business date when submitting unchanged inputs after midnight", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-05T23:59:00+07:00"));
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "10/10/2026");
    lookup();
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" })).toHaveAttribute("data-status", "SAFE");
    vi.setSystemTime(new Date("2026-10-06T00:01:00+07:00"));
    lookup();
    const result = screen.getByRole("region", { name: "Kết quả tra hạn lùi" });
    expect(result).toHaveAttribute("data-status", "WARNING");
    expect(result.querySelector(".store-result-facts > div:first-child")).toHaveTextContent("Đến hạn lùi2 ngày");
  });

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
    fireEvent.click(screen.getByRole("switch", { name: "Đã biết ngày sản xuất" }));
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

  it.each([
    [true, "HSD (Số ngày)", "10", "Ngày sản xuất", "01/10/2026", "Hạn sử dụng (HSD)", "10/10/2026", "02/10/2026", "11/10/2026"],
    [true, "HSD (Số tháng)", "2", "Ngày sản xuất", "01/10/2026", "Hạn sử dụng (HSD)", "01/12/2026", "02/10/2026", "02/12/2026"],
    [false, "HSD (Số ngày)", "10", "Hạn sử dụng (HSD)", "10/10/2026", "", "", "11/10/2026", ""],
    [false, "HSD (Số tháng)", "2", "Hạn sử dụng (HSD)", "01/12/2026", "", "", "02/12/2026", ""],
  ])("keeps %s / %s entered before the anchor, then recalculates an edited anchor", (known, durationName, value, anchor, date, derived, expected, edited, next) => {
    render(<ShelfLifeScreen />);
    if (!known) fireEvent.click(screen.getByRole("switch", { name: "Đã biết ngày sản xuất" }));
    change(durationName, value);
    change(anchor, date);
    expect(screen.getByRole("textbox", { name: durationName })).toHaveValue(value);
    if (derived) expect(screen.getByRole("textbox", { name: derived })).toHaveValue(expected);
    lookup();
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" }).querySelector('time[datetime="2026-10-01"]')).not.toBeNull();
    change(anchor, "");
    expect(screen.queryByRole("region", { name: "Kết quả tra hạn lùi" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: durationName })).toHaveValue(value);
    if (derived) expect(screen.getByRole("textbox", { name: derived })).toHaveValue("");
    change(anchor, edited);
    if (derived) expect(screen.getByRole("textbox", { name: derived })).toHaveValue(next);
    lookup();
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" }).querySelector('time[datetime="2026-10-02"]')).not.toBeNull();
  });

  it.each(["HSD (Số ngày)", "HSD (Số tháng)"])("preserves invalid %s and associates its error/focus with the field", field => {
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    const input = screen.getByRole("textbox", { name: field });
    for (const value of ["-2", "1.5", "1e2", "0", "9007199254740992"]) {
      change(field, value);
      expect(input).toHaveValue(value);
      expect(input).not.toHaveAttribute("aria-invalid");
      lookup();
      expect(screen.getByRole("alert")).toHaveTextContent("phải là số nguyên lớn hơn 0");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", "shelf-error");
      expect(input).toHaveAccessibleDescription(screen.getByRole("alert").textContent!);
      expect(input).toHaveFocus();
      expect(screen.queryByRole("region", { name: "Kết quả tra hạn lùi" })).not.toBeInTheDocument();
    }
    change(field, "10");
    lookup();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" })).toBeInTheDocument();
  });

  it.each([true, false])("keeps HSD > NSX validation for a one-day duration in known=%s mode", known => {
    render(<ShelfLifeScreen />);
    if (!known) fireEvent.click(screen.getByRole("switch", { name: "Đã biết ngày sản xuất" }));
    change(known ? "Ngày sản xuất" : "Hạn sử dụng (HSD)", "01/10/2026");
    change("HSD (Số ngày)", "1");
    lookup();
    expect(screen.getByRole("alert")).toHaveTextContent("HSD phải sau NSX");
    expect(screen.getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveFocus();
    expect(screen.queryByRole("region", { name: "Kết quả tra hạn lùi" })).not.toBeInTheDocument();
  });

  it("keeps a valid five-digit day duration instead of truncating it", () => {
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "01/10/2026");
    change("HSD (Số ngày)", "10000");
    expect(screen.getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveValue("10000");
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("15/02/2054");
    lookup();
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" })).toBeInTheDocument();
  });

  it("retains month-end rules, mode switches and explicit date overrides", () => {
    render(<ShelfLifeScreen />);
    change("HSD (Số tháng)", "1");
    change("Ngày sản xuất", "31/01/2028");
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("29/02/2028");
    expect(screen.getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveValue("30");
    change("Ngày sản xuất", "31/01/2027");
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("28/02/2027");
    fireEvent.click(screen.getByRole("switch", { name: "Đã biết ngày sản xuất" }));
    change("Hạn sử dụng (HSD)", "31/03/2028");
    lookup();
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" }).querySelector('time[datetime="2028-02-29"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Đã biết ngày sản xuất" }));
    change("Hạn sử dụng (HSD)", "10/03/2028");
    expect(screen.getByRole("textbox", { name: "HSD (Số tháng)" })).toHaveValue("");
    change("Ngày sản xuất", "01/03/2028");
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("10/03/2028");
    expect(screen.getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveValue("10");
  });

  it("commits the error association before moving focus to the invalid field", () => {
    render(<ShelfLifeScreen />);
    change("Ngày sản xuất", "10/10/2026");
    change("Hạn sử dụng (HSD)", "01/10/2026");
    const hsd = screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" });
    const associations: (string | null)[][] = [];
    hsd.addEventListener("focus", () => associations.push([hsd.getAttribute("aria-invalid"), hsd.getAttribute("aria-describedby")]));
    lookup();
    expect(associations).toEqual([["true", "shelf-error"]]);
  });

  it("focuses invalid date/unknown-duration fields and clears their associations on edit/reset", () => {
    render(<ShelfLifeScreen />);
    lookup();
    expect(screen.getByRole("textbox", { name: "Ngày sản xuất" })).toHaveFocus();
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "01/10/2026");
    lookup();
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveAccessibleDescription("HSD phải sau NSX");
    fireEvent.click(screen.getByRole("switch", { name: "Đã biết ngày sản xuất" }));
    change("HSD (Số ngày)", "");
    lookup();
    expect(screen.getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(document.querySelector('[aria-invalid="true"]')).toBeNull();
  });

  it("keeps labels and calendar anchors distinct when two utilities coexist", () => {
    render(<><section aria-label="Tiện ích chính"><ShelfLifeScreen /></section><section aria-label="Tiện ích nhanh"><ShelfLifeScreen idPrefix="quick-shelf" /></section></>);
    const main = within(screen.getByRole("region", { name: "Tiện ích chính" }));
    const quick = within(screen.getByRole("region", { name: "Tiện ích nhanh" }));
    fireEvent.change(quick.getByRole("textbox", { name: "Ngày sản xuất" }), { target: { value: "08/10/2026" } });
    expect(quick.getByRole("textbox", { name: "Ngày sản xuất" })).toHaveValue("08/10/2026");
    expect(main.getByRole("textbox", { name: "Ngày sản xuất" })).toHaveValue("");
    expect(document.querySelectorAll('#shelf-nsx')).toHaveLength(1);
    expect(document.querySelectorAll('#quick-shelf-nsx')).toHaveLength(1);
    fireEvent.click(main.getByRole("button", { name: "Tra cứu" }));
    fireEvent.click(quick.getByRole("button", { name: "Tra cứu" }));
    expect(main.getByRole("alert")).toHaveAttribute("id", "shelf-error");
    expect(quick.getByRole("alert")).toHaveAttribute("id", "quick-shelf-error");
    expect(main.getByRole("textbox", { name: "Ngày sản xuất" })).toHaveAttribute("aria-describedby", "shelf-error");
    expect(quick.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveAttribute("aria-describedby", "quick-shelf-error");
  });
});
