import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("keeps a clear borderless surface and visible keyboard focus token", () => {
    render(<Input aria-label="Mã SKU" />);
    const input = screen.getByRole("textbox", { name: "Mã SKU" });

    expect(input).toHaveClass("bg-white", "rounded-xl", "focus-visible:ring-3", "focus-visible:ring-focus");
    expect(input.className.split(/\s+/)).not.toContain("border");
  });
});
