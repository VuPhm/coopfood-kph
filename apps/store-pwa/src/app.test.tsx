import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./app";

describe("Store workspace", () => {
  it("keeps both KPH entry actions visible", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Tạo phiếu Thực phẩm khô & khác/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Tạo phiếu Thực phẩm tươi sống/i })).toBeVisible();
  });

  it("keeps expiry lookup inside main as the parallel workbench", () => {
    render(<App />);
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(within(main as HTMLElement).getByRole("complementary", { name: "Tra hạn nhanh" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Mở tra hạn nhanh" })).not.toBeInTheDocument();
  });

  it("changes the scoped history tab", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: /TP Tươi sống/i }));
    expect(screen.getAllByText("Cải thìa VietGAP 500 g")).toHaveLength(2);
    expect(screen.queryByText("Bánh quy bơ hộp 300 g")).not.toBeInTheDocument();
  });

  it("selects only the records in the active food type", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Chọn tất cả phiếu trong loại hiện tại" }));
    expect(document.querySelector(".selection-count")).toHaveTextContent("Đã chọn 1 dòng");
    expect(screen.getByRole("button", { name: "Xuất Excel" })).toBeEnabled();

    fireEvent.click(screen.getByRole("tab", { name: /TP Tươi sống/i }));
    expect(document.querySelector(".selection-count")).toHaveTextContent("Đã chọn 0 dòng");
  });
});
