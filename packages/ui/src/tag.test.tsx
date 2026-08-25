import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tag } from "./tag";

describe("Tag", () => {
  it("renders with default gray tone and md size", () => {
    render(<Tag>Cận date</Tag>);
    const tag = screen.getByText("Cận date");
    expect(tag).toHaveClass("bg-[#e2e8e3]");
    expect(tag).toHaveClass("text-ink-muted");
  });

  it("renders distinct tone variants", () => {
    const { rerender } = render(<Tag tone="orange">Cận date</Tag>);
    expect(screen.getByText("Cận date")).toHaveClass("text-[#8a4a00]");

    rerender(<Tag tone="green">Đã duyệt</Tag>);
    expect(screen.getByText("Đã duyệt")).toHaveClass("text-brand");

    rerender(<Tag tone="red">HỦY</Tag>);
    expect(screen.getByText("HỦY")).toHaveClass("text-danger");

    rerender(<Tag tone="blue">XUẤT TRẢ</Tag>);
    expect(screen.getByText("XUẤT TRẢ")).toHaveClass("text-[#1769aa]");
  });
});
