import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("uses one outline-based keyboard focus treatment without a stacked ring", () => {
    render(<Input aria-label="Mã SKU" />);
    const input = screen.getByRole("textbox", { name: "Mã SKU" });

    expect(input).toHaveClass("bg-white", "rounded-xl", "border-2", "focus-visible:outline-3", "focus-visible:outline-focus");
    expect(input).not.toHaveClass("focus-visible:ring-3", "focus-visible:border-brand");
  });
});
