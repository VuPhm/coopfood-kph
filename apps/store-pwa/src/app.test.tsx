import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./app";

describe("Store workspace", () => {
  it("keeps both KPH entry actions visible", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Tạo phiếu Thực phẩm khô & khác/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Tạo phiếu Thực phẩm tươi sống/i })).toBeVisible();
  });

  it("changes the scoped history tab", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: /TPTS/i }));
    expect(screen.getAllByText("Cải thìa VietGAP 500 g")).toHaveLength(2);
    expect(screen.queryByText("Bánh quy bơ hộp 300 g")).not.toBeInTheDocument();
  });
});
