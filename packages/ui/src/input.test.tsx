import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("keeps a moderate border and visible keyboard focus token", () => {
    render(<Input aria-label="Mã SKU" />);
    const input = screen.getByRole("textbox", { name: "Mã SKU" });

    expect(input).toHaveClass("bg-white", "rounded-xl", "border-2", "focus-visible:ring-3", "focus-visible:ring-focus");
  });
});
