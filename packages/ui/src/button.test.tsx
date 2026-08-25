import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("keeps a native accessible button", () => {
    render(<Button>Thêm phiếu</Button>);
    expect(screen.getByRole("button", { name: "Thêm phiếu" })).toBeEnabled();
  });

  it("uses a filled surface with a moderate border for secondary actions", () => {
    render(<Button variant="secondary">Xuất Excel</Button>);
    const button = screen.getByRole("button", { name: "Xuất Excel" });
    expect(button).toHaveClass("bg-brand-soft", "rounded-xl", "border-2", "focus-visible:outline-3");
    expect(button).not.toHaveClass("focus-visible:ring-3");
  });
});
