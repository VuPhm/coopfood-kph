import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DateWorkspace } from "./store-date-workspace";

describe("memory-only DATE workspace", () => {
  it("clears a detail selection when acknowledging hides its lot under the active filter", async () => {
    render(<DateWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: /Sản phẩm C/ }));
    await screen.findByRole("heading", { name: "Xử lý cảnh báo DATE" });
    fireEvent.click(screen.getByRole("button", { name: "Ghi nhận" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Xử lý cảnh báo DATE" })).not.toBeInTheDocument());
    expect(screen.getAllByRole("button", { name: /Sản phẩm/ })).toHaveLength(1);
  });

  it("keeps the not-yet-designed tracking action disabled", () => {
    render(<DateWorkspace />);
    expect(screen.getByRole("button", { name: /Thêm theo dõi/ })).toBeDisabled();
    expect(screen.getByText("Chức năng chưa sẵn sàng trong bản dùng thử")).toBeInTheDocument();
  });
});
