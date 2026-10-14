import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoreApp } from "./store-app";

describe("Store App session and route ownership", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-06T12:00:00+07:00"));
    window.history.replaceState(null, "", "#home");
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.useRealTimers());

  it("retains DATE updates across Home navigation and updates the Home summary", async () => {
    render(<StoreApp />);
    const home = () => within(document.querySelector('.store-launcher-mobile') as HTMLElement);
    fireEvent.click(home().getByRole("button", { name: "Quản lý DATE" }));
    fireEvent.click(await screen.findByRole("button", { name: /Cải thìa/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Ghi nhận" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Chi tiết lô DATE" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Về trang chủ" }));
    await screen.findByText("3 cảnh báo đang mở");
    fireEvent.click(home().getByRole("button", { name: "Quản lý DATE" }));
    await screen.findByRole("heading", { name: "Cần xử lý" });
    expect(screen.queryByRole("button", { name: /Cải thìa/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Đã ghi nhận 4/ }));
    expect(screen.getByRole("button", { name: /Cải thìa/ })).toBeInTheDocument();
  });

  it("opens legacy lookup links in DATE with a single navigation destination", async () => {
    window.history.replaceState(null, "", "#lookup");
    render(<StoreApp />);
    await screen.findByRole("region", { name: "Tra mã hàng" });
    expect(window.location.hash).toBe("#date");
    expect(screen.queryByRole("button", { name: "Tra cứu" })).not.toBeInTheDocument();
    const nav = within(screen.getByRole("navigation", { name: "Điều hướng chính trên mobile" }));
    expect(nav.getAllByRole("link")).toHaveLength(3);
    expect(nav.getByRole("link", { name: "DATE" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Về trang chủ" }));
    await screen.findByRole("button", { name: "Co.op Food — Trang chủ" });
    expect(document.querySelector('[href="#lookup"]')).not.toBeInTheDocument();
  });

  it("retains quick lookup mode, dates, duration and result across panel unmount and route changes", async () => {
    window.history.replaceState(null, "", "#kph");
    render(<StoreApp />);
    const open = () => fireEvent.click(screen.getByRole("button", { name: "Mở tiện ích tra cứu lùi hàng" }));
    open();
    const quick = () => within(screen.getByRole("dialog", { name: "Tra cứu lùi hàng nhanh" }));
    expect(document.querySelector(".store-mobile-toolbar")).toHaveAttribute("hidden");
    expect(document.querySelector(".store-quick-fab")).toHaveAttribute("hidden");
    fireEvent.click(quick().getByRole("switch"));
    fireEvent.change(quick().getByRole("textbox", { name: "Hạn sử dụng (HSD)" }), { target: { value: "10/10/2026" } });
    fireEvent.change(quick().getByRole("textbox", { name: "HSD (Số ngày)" }), { target: { value: "10" } });
    // Close while debounce is pending: the page owns the calculation too.
    fireEvent.click(quick().getByRole("button", { name: "Đóng tiện ích" }));
    expect(screen.queryByRole("dialog", { name: "Tra cứu lùi hàng nhanh" })).not.toBeInTheDocument();
    expect(document.querySelector(".store-mobile-toolbar")).not.toHaveAttribute("hidden");
    expect(document.querySelector(".store-quick-fab")).not.toHaveAttribute("hidden");
    open();
    await waitFor(() => expect(quick().getByRole("region", { name: "Kết quả tra hạn lùi" }).querySelector(".store-result-date")).toHaveTextContent("08/10/2026"));
    fireEvent.keyDown(document, { key: "Escape" });
    open();
    expect(quick().getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(quick().getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("10/10/2026");
    expect(quick().getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveValue("10");
    expect(quick().getByRole("region", { name: "Kết quả tra hạn lùi" }).querySelector(".store-result-date")).toHaveTextContent("08/10/2026");
    window.location.hash = "home";
    fireEvent(window, new HashChangeEvent("hashchange"));
    await screen.findByText("Cần chú ý hôm nay");
    fireEvent.click(within(document.querySelector('.store-launcher-mobile') as HTMLElement).getByRole("button", { name: "Quản lý DATE" }));
    await screen.findByRole("heading", { name: "Cần xử lý" });
    open();
    expect(quick().getByRole("textbox", { name: "HSD (Số ngày)" })).toHaveValue("10");
    expect(quick().getByRole("region", { name: "Kết quả tra hạn lùi" }).querySelector(".store-result-date")).toHaveTextContent("08/10/2026");
    fireEvent.click(quick().getByRole("button", { name: "Làm mới" }));
    fireEvent.click(quick().getByRole("button", { name: "Đóng tiện ích" }));
    open();
    expect(quick().getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(quick().getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("");
    expect(quick().getByRole("region", { name: "Kết quả tra hạn lùi" })).toHaveAttribute("data-status", "EMPTY");
  });

  it("dismisses the quick utility when changing routes", async () => {
    render(<StoreApp />);
    fireEvent.click(within(document.querySelector('.store-launcher-mobile') as HTMLElement).getByRole("button", { name: "KPH" }));
    fireEvent.click(await screen.findByRole("button", { name: "Mở tiện ích tra cứu lùi hàng" }));
    expect(screen.getByRole("dialog", { name: "Tra cứu lùi hàng nhanh" })).toBeInTheDocument();
    window.location.hash = "home";
    fireEvent(window, new HashChangeEvent("hashchange"));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tra cứu lùi hàng nhanh" })).not.toBeInTheDocument());
    fireEvent.click(within(document.querySelector('.store-launcher-mobile') as HTMLElement).getByRole("button", { name: "Tra cứu lùi hàng" }));
    await screen.findByRole("textbox", { name: "Ngày sản xuất" });
    expect(document.querySelectorAll('#shelf-nsx')).toHaveLength(1);
    expect(document.querySelector('#quick-shelf-nsx')).toBeNull();
  });

  it("uses a modal backdrop and closes the picker before dismissing quick lookup", async () => {
    window.history.replaceState(null, "", "#date");
    render(<StoreApp />);
    const trigger = screen.getByRole("button", { name: "Mở tiện ích tra cứu lùi hàng" });
    trigger.focus(); fireEvent.click(trigger);
    const quick = screen.getByRole("dialog", { name: "Tra cứu lùi hàng nhanh" });
    expect(quick).toHaveAttribute("data-slot", "dialog-content");
    expect(screen.queryByRole("button", { name: "Tài khoản và cửa hàng" })).not.toBeInTheDocument();
    fireEvent.click(within(quick).getByRole("button", { name: "Chọn hạn sử dụng" }));
    expect(screen.getByRole("dialog", { name: "Lịch chọn ngày" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Lịch chọn ngày" })).not.toBeInTheDocument();
    expect(quick).toBeInTheDocument();
    await new Promise(resolve => setTimeout(resolve, 0));
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as Element;
    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);
    expect(screen.queryByRole("dialog", { name: "Tra cứu lùi hàng nhanh" })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("logs only successful main lookups, persists across routes, and recalls mode/inputs with fresh results", async () => {
    window.history.replaceState(null, "", "#shelf");
    render(<StoreApp />);
    const history = () => within(screen.getByRole("region", { name: /^Lịch sử tra cứu/ }));
    expect(history().getByText("Chưa có lịch sử tra cứu")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Ngày sản xuất" }), { target: { value: "01/10/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" }), { target: { value: "01/10/2026" } });
    fireEvent.click(within(document.querySelector(".store-shelf-form") as HTMLElement).getByRole("button", { name: "Tra cứu" }));
    expect(history().queryByRole("list")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.change(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" }), { target: { value: "10/10/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "HSD (Số tháng)" }), { target: { value: "1" } });
    await waitFor(() => expect(history().getAllByRole("listitem")).toHaveLength(1));
    fireEvent.click(within(document.querySelector(".store-shelf-form") as HTMLElement).getByRole("button", { name: "Tra cứu" }));
    expect(history().getAllByRole("listitem")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Làm mới" }));
    fireEvent.click(history().getByRole("button", { name: /^Tra lại/ }));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("textbox", { name: "HSD (Số tháng)" })).toHaveValue("1");
    expect(screen.getByRole("textbox", { name: "Hạn sử dụng (HSD)" })).toHaveValue("10/10/2026");
    expect(screen.getByRole("region", { name: "Kết quả tra hạn lùi" })).not.toHaveAttribute("data-status", "EMPTY");
    fireEvent.click(screen.getByRole("button", { name: "Về trang chủ" }));
    await screen.findByText("Cần chú ý hôm nay");
    fireEvent.click(within(document.querySelector('.store-launcher-mobile') as HTMLElement).getByRole("button", { name: "KPH" }));
    fireEvent.click(await screen.findByRole("button", { name: "Mở tiện ích tra cứu lùi hàng" }));
    const quick = within(screen.getByRole("dialog", { name: "Tra cứu lùi hàng nhanh" }));
    expect(quick.queryByRole("region", { name: /^Lịch sử tra cứu/ })).not.toBeInTheDocument();
    fireEvent.change(quick.getByRole("textbox", { name: "Ngày sản xuất" }), { target: { value: "01/10/2026" } });
    fireEvent.change(quick.getByRole("textbox", { name: "Hạn sử dụng (HSD)" }), { target: { value: "12/10/2026" } });
    fireEvent.click(quick.getByRole("button", { name: "Tra cứu" }));
    window.location.hash = "home";
    fireEvent(window, new HashChangeEvent("hashchange"));
    await screen.findByText("Cần chú ý hôm nay");
    fireEvent.click(within(document.querySelector('.store-launcher-mobile') as HTMLElement).getByRole("button", { name: "Tra cứu lùi hàng" }));
    await screen.findByRole("region", { name: /^Lịch sử tra cứu/ });
    expect(history().getAllByRole("listitem")).toHaveLength(1);
  });
});
