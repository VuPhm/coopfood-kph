import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("delegates keyboard-only focus treatment to the app shell", () => {
    render(<Input aria-label="Mã SKU" />);
    const input = screen.getByRole("textbox", { name: "Mã SKU" });

    expect(input).toHaveClass("bg-white", "rounded-xl", "border-2", "outline-none");
    expect(input).not.toHaveClass("focus-visible:outline-3", "focus-visible:ring-3", "focus-visible:border-brand");
  });
});
