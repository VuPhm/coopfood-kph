import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./app";

describe("Admin shell", () => {
  it("shows the bounded admin modules", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Nền tảng vận hành KPH" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Danh mục hàng hóa" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Cửa hàng & phân quyền" })).toBeVisible();
  });
});
