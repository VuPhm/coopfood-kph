import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" })).toHaveAttribute("data-status", "EMPTY");
    lookup();
    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" })).toHaveAttribute("data-status", "EMPTY");
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
    expect(document.querySelector(".store-shelf-result")).toHaveAttribute("data-status", "EMPTY");
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
    expect(document.querySelector(".store-shelf-result")).toHaveAttribute("data-status", "EMPTY");
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
    expect(document.querySelector(".store-shelf-result")).toHaveAttribute("data-status", "EMPTY");
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
  });
});


describe("Automatic shelf life lookup", () => {
  afterEach(() => vi.useRealTimers());
  function setup() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T00:00:00+07:00"));
    render(<ShelfLifeScreen />);
    return screen.getByRole("region", { name: "Kết quả tra hạn lùi" });
  }
  const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

  it("updates the existing holder after 350ms from the last keystroke and clears stale results immediately", () => {
    const holder = setup();
    expect(holder).toHaveAttribute("data-status", "EMPTY");
    expect(within(holder).getByRole("heading", { name: "Chưa có kết quả" })).toBeInTheDocument();
    expect(holder.querySelector(".store-shelf-placeholder")).toHaveAttribute("data-state", "empty");
    expect(holder.querySelector(".store-result-date")).toBeNull();
    expect(holder.querySelector(".store-result-facts")).toBeNull();
    expect(holder.querySelector(".store-timeline-track")).toBeNull();
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "10/10/2026");
    advance(300);
    expect(holder).toHaveAttribute("data-status", "EMPTY");
    change("Hạn sử dụng (HSD)", "11/10/2026");
    advance(349);
    expect(holder).toHaveAttribute("data-status", "EMPTY");
    advance(1);
    expect(holder.querySelector(".store-result-date")).toHaveTextContent("09/10/2026");
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" })).toBe(holder);
    change("Hạn sử dụng (HSD)", "32/10/2026");
    expect(holder).toHaveAttribute("data-status", "EMPTY");
    advance(350);
    expect(screen.getByRole("alert")).toHaveTextContent("Ngày không hợp lệ");
    expect(holder.querySelector(".store-result-date")).toBeNull();
    expect(holder.querySelector(".store-shelf-placeholder")).toHaveAttribute("data-state", "invalid");
    expect(within(holder).getByRole("heading", { name: "Kiểm tra thông tin" })).toBeInTheDocument();
  });

  it("calculates a picker selection immediately and cancels pending typed values", () => {
    const holder = setup();
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "11/10/2026");
    advance(100);
    fireEvent.click(screen.getByRole("button", { name: "Chọn hạn sử dụng" }));
    fireEvent.click(screen.getByRole("button", { name: "10 tháng 10, 2026" }));
    expect(holder.querySelector(".store-result-date")).toHaveTextContent("08/10/2026");
    advance(500);
    expect(holder.querySelector(".store-result-date")).toHaveTextContent("08/10/2026");
    fireEvent.click(screen.getByRole("button", { name: "Chọn ngày sản xuất" }));
    fireEvent.click(screen.getByRole("button", { name: "2 tháng 10, 2026" }));
    expect(holder.querySelector(".store-result-date")).toHaveTextContent("10/10/2026");
    // Re-selecting the same valid date must also leave a real result.
    fireEvent.click(screen.getByRole("button", { name: "Chọn ngày sản xuất" }));
    fireEvent.click(screen.getByRole("button", { name: "2 tháng 10, 2026" }));
    expect(holder).toHaveAttribute("data-status", "SAFE");
  });

  it("recalculates on mode changes and debounces days/months in unknown manufacture mode", () => {
    const holder = setup();
    change("Ngày sản xuất", "01/10/2026");
    change("Hạn sử dụng (HSD)", "10/10/2026");
    fireEvent.click(screen.getByRole("switch"));
    expect(holder.querySelector(".store-result-date")).toHaveTextContent("08/10/2026");
    change("HSD (Số ngày)", "9");
    advance(350);
    expect(holder.querySelector(".store-result-date")).toHaveTextContent("10/10/2026");
    change("HSD (Số tháng)", "1");
    advance(350);
    expect(screen.getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveValue("31");
    expect(holder.querySelector(".store-result-date")).toHaveTextContent("04/10/2026");
    fireEvent.click(screen.getByRole("switch"));
    expect(holder.querySelector(".store-result-date")).toHaveTextContent("04/10/2026");
    change("HSD (Số tháng)", "0");
    advance(350);
    expect(holder).toHaveAttribute("data-status", "EMPTY");
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("");
  });

  it("keeps incomplete input empty and Reset cancels a pending calculation", () => {
    const holder = setup();
    change("Ngày sản xuất", "01/10/2026");
    advance(350);
    expect(holder).toHaveAttribute("data-status", "EMPTY");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    change("HSD (Số ngày)", "10");
    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    advance(500);
    expect(holder).toHaveAttribute("data-status", "EMPTY");
    expect(holder.querySelector(".store-shelf-placeholder")).toHaveAttribute("data-state", "empty");
    expect(within(holder).getByRole("heading", { name: "Chưa có kết quả" })).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    for (const input of screen.getAllByRole("textbox")) expect(input).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
