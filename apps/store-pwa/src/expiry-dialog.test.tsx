import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExpiryWorkbench } from "./expiry-dialog";

describe("Expiry lookup", () => {
  it("formats dates and updates the result without a separate submit", () => {
    render(<ExpiryWorkbench today="2026-08-24" />);

    expect(screen.getByText("Chưa nhập đủ dữ liệu")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Ngày sản xuất"), { target: { value: "01082026" } });
    fireEvent.change(screen.getByLabelText("Hạn sử dụng (HSD)"), { target: { value: "30082026" } });

    expect(screen.getByLabelText("Ngày sản xuất")).toHaveValue("01/08/2026");
    expect(screen.getByLabelText("HSD (Số ngày)")).toHaveValue("30");
    expect(screen.getByText("Ngày lùi hàng")).toBeVisible();
    expect(screen.getByText("24/08/2026")).toBeVisible();
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

    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByLabelText("Ngày sản xuất")).toHaveAttribute("readonly");

    fireEvent.change(screen.getByLabelText("Hạn sử dụng (HSD)"), { target: { value: "30082026" } });
    fireEvent.change(screen.getByLabelText("HSD (Số ngày)"), { target: { value: "30" } });

    expect(screen.getByLabelText("Ngày sản xuất")).toHaveValue("01/08/2026");
    expect(screen.getByText("Còn an toàn")).toBeVisible();
  });

  it("shows contextual errors and exposes the calendar from its own trigger", () => {
    render(<ExpiryWorkbench today="2026-08-15" />);

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
    fireEvent.change(screen.getByLabelText("Ngày sản xuất"), { target: { value: "01082026" } });
    fireEvent.change(screen.getByLabelText("Hạn sử dụng (HSD)"), { target: { value: "30082026" } });
    expect(screen.getByText("Ngày lùi hàng")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Ẩn tra hạn" }));
    expect(screen.queryByLabelText("Ngày sản xuất")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hiện tra hạn" })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "Hiện tra hạn" }));
    expect(screen.getByLabelText("Ngày sản xuất")).toHaveValue("01/08/2026");
    expect(screen.getByLabelText("Hạn sử dụng (HSD)")).toHaveValue("30/08/2026");
    expect(screen.getByText("Ngày lùi hàng")).toBeVisible();
  });
});
