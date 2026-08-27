import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExpiryWorkbench } from "./expiry-dialog";

afterEach(() => vi.useRealTimers());

function openWorkbench() {
  fireEvent.click(screen.getByRole("button", { name: "Tra cứu lùi hàng" }));
}

describe("Expiry lookup", () => {
  it("formats dates and updates the result without a separate submit", () => {
    render(<ExpiryWorkbench today="2026-08-24" />);
    openWorkbench();

    expect(screen.getByText("Chưa nhập đủ dữ liệu")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Ngày sản xuất"), { target: { value: "01082026" } });
    fireEvent.change(screen.getByLabelText("Hạn sử dụng (HSD)"), { target: { value: "30082026" } });

    expect(screen.getByLabelText("Ngày sản xuất")).toHaveValue("01/08/2026");
    expect(screen.getByLabelText("HSD (Số ngày)")).toHaveValue("30");
    expect(screen.getByText("Ngày lùi hàng")).toBeVisible();
    expect(screen.getByText("24/08/2026")).toBeVisible();
    expect(screen.getByText("0 ngày đến hạn lùi")).toBeVisible();
    expect(screen.getByText("HSD còn 6 ngày")).toBeVisible();
    expect(screen.queryByText(/Vòng đời/i)).not.toBeInTheDocument();
    const timeline = screen.getByLabelText("Bốn mốc thời hạn");
    expect(timeline).toHaveTextContent("01/08NSX18/08Cảnh báo24/08Hạn lùi30/08HSD");

    const markerPositions = Array.from(timeline.querySelectorAll<HTMLElement>(".expiry-milestone"))
      .map((marker) => Number.parseFloat(marker.style.getPropertyValue("--milestone-at")));
    expect(markerPositions[0]).toBe(0);
    expect(markerPositions[1]).toBeCloseTo(17 / 29 * 100);
    expect(markerPositions[2]).toBeCloseTo(23 / 29 * 100);
    expect(markerPositions[3]).toBe(100);
  });

  it("derives NSX when the user only knows HSD and duration", () => {
    render(<ExpiryWorkbench today="2026-08-15" />);
    openWorkbench();

    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByLabelText("Ngày sản xuất")).toHaveAttribute("readonly");

    fireEvent.change(screen.getByLabelText("Hạn sử dụng (HSD)"), { target: { value: "30082026" } });
    fireEvent.change(screen.getByLabelText("HSD (Số ngày)"), { target: { value: "30" } });

    expect(screen.getByLabelText("Ngày sản xuất")).toHaveValue("01/08/2026");
    expect(screen.getByText("An toàn")).toBeVisible();
  });

  it("shows contextual errors and exposes the calendar from its own trigger", () => {
    render(<ExpiryWorkbench today="2026-08-15" />);
    openWorkbench();

    fireEvent.click(screen.getByRole("button", { name: "Chọn ngày sản xuất" }));
    expect(screen.getByRole("dialog", { name: "Lịch chọn ngày" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "1 tháng 8, 2026" }));
    expect(screen.getByLabelText("Ngày sản xuất")).toHaveValue("01/08/2026");

    fireEvent.click(screen.getByRole("button", { name: "Chọn ngày sản xuất" }));
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Lịch chọn ngày" }), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Lịch chọn ngày" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Hạn sử dụng (HSD)"), { target: { value: "01072026" } });
    expect(screen.getByRole("alert")).toHaveTextContent("HSD phải sau NSX");
  });

  it("keeps the latest lookup values and result while collapsed", () => {
    render(<ExpiryWorkbench today="2026-08-24" />);
    openWorkbench();
    fireEvent.change(screen.getByLabelText("Ngày sản xuất"), { target: { value: "01082026" } });
    fireEvent.change(screen.getByLabelText("Hạn sử dụng (HSD)"), { target: { value: "30082026" } });
    expect(screen.getByText("Ngày lùi hàng")).toBeVisible();

    const closeButton = screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" });
    expect(closeButton).not.toHaveTextContent("Ẩn tra hạn");
    fireEvent.click(closeButton);
    expect(screen.queryByLabelText("Ngày sản xuất")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tra cứu lùi hàng" })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "Tra cứu lùi hàng" }));
    expect(screen.getByLabelText("Ngày sản xuất")).toHaveValue("01/08/2026");
    expect(screen.getByLabelText("Hạn sử dụng (HSD)")).toHaveValue("30/08/2026");
    expect(screen.getByText("Ngày lùi hàng")).toBeVisible();
  });

  it("returns the mobile sheet to the top when reopened", () => {
    render(<ExpiryWorkbench />);
    openWorkbench();

    const workbench = screen.getByRole("complementary", { name: "Tra cứu lùi hàng" });
    workbench.scrollTop = 180;
    fireEvent.click(screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" }));
    openWorkbench();

    expect(workbench.scrollTop).toBe(0);
  });

  it("closes the workbench with Escape or the real backdrop", () => {
    render(<ExpiryWorkbench />);
    openWorkbench();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Tra cứu lùi hàng" })).toHaveAttribute("aria-expanded", "false");

    openWorkbench();
    const backdrop = screen.getByRole("button", { name: "Đóng tra cứu lùi hàng từ nền mờ" });
    fireEvent.pointerDown(backdrop);
    expect(screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(backdrop);
    expect(screen.getByRole("button", { name: "Tra cứu lùi hàng" })).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the desktop workbench open when the user clicks outside", () => {
    const previousWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    render(<ExpiryWorkbench />);
    openWorkbench();

    fireEvent.pointerDown(document.body);

    expect(screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" })).toHaveAttribute("aria-expanded", "true");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: previousWidth });
  });

  it("gives the collapsed trigger a temporary visible hint and keeps the shared meta row when expanded", () => {
    render(<ExpiryWorkbench />);

    const trigger = screen.getByRole("button", { name: "Tra cứu lùi hàng" });
    expect(trigger).toHaveTextContent("Tra cứu lùi hàng");
    expect(trigger.querySelector(".utility-panel-action-text")).not.toBeNull();
    expect(trigger).toHaveAttribute("aria-label", "Tra cứu lùi hàng");
    expect(trigger.closest(".utility-panel-meta")).toHaveClass("is-collapsed");

    fireEvent.click(trigger);
    const workbench = screen.getByRole("complementary", { name: "Tra cứu lùi hàng" });
    expect(workbench.querySelector(".utility-panel-meta")).not.toBeNull();
    expect(screen.getByText("Tra cứu lùi hàng")).toBeVisible();
    expect(screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" }).closest(".utility-panel-meta")).not.toBeNull();
  });

  it("only animates the lookup hint once while keeping its desktop label mounted", () => {
    vi.useFakeTimers();
    render(<ExpiryWorkbench />);

    const initialTrigger = screen.getByRole("button", { name: "Tra cứu lùi hàng" });
    expect(initialTrigger).toHaveClass("has-entry-hint");
    expect(initialTrigger).toHaveTextContent("Tra cứu lùi hàng");

    act(() => vi.advanceTimersByTime(2_800));
    expect(screen.getByRole("button", { name: "Tra cứu lùi hàng" })).not.toHaveClass("has-entry-hint");
    expect(screen.getByRole("button", { name: "Tra cứu lùi hàng" })).toHaveTextContent("Tra cứu lùi hàng");

    fireEvent.click(screen.getByRole("button", { name: "Tra cứu lùi hàng" }));
    fireEvent.click(screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" }));

    expect(screen.getByRole("button", { name: "Tra cứu lùi hàng" })).not.toHaveClass("has-entry-hint");
    expect(screen.getByRole("button", { name: "Tra cứu lùi hàng" })).toHaveTextContent("Tra cứu lùi hàng");
  });
});
