import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("keeps a native accessible button", () => {
    render(<Button>Thêm phiếu</Button>);
    expect(screen.getByRole("button", { name: "Thêm phiếu" })).toBeEnabled();
  });
});
