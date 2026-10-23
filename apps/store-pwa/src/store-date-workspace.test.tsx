import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { DateWorkspace as ControlledDateWorkspace } from "./store-date-workspace";
import { mockDateLots } from "./store-app-mock";

function DateWorkspace({ resolved = false } = {}) {
  const [lots, setLots] = useState(resolved ? mockDateLots.map(lot => lot.id === "C24-118" ? { ...lot, status: "resolved" as const } : lot) : mockDateLots);
  return <ControlledDateWorkspace lots={lots} onLotsChange={setLots} onCreateKph={async () => "synthetic-kph"} />;
}

describe("memory-only DATE workspace", () => {
  it("clears a detail selection when acknowledging hides its lot under the active filter", async () => {
    render(<DateWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: /Cải thìa/ }));
    await screen.findByRole("heading", { name: "Chi tiết lô DATE" });
    fireEvent.click(screen.getByRole("button", { name: "Ghi nhận" }));
    fireEvent.click(screen.getByRole("button", { name: "Hẹn báo lại" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Chi tiết lô DATE" })).not.toBeInTheDocument());
    expect(screen.getAllByRole("button", { name: /Sản phẩm/ })).toHaveLength(1);
  });

  it("keeps the not-yet-designed tracking action disabled", () => {
    render(<DateWorkspace />);
    expect(screen.getByRole("button", { name: /Thêm theo dõi/ })).toBeDisabled();
    expect(screen.getByText("Chức năng chưa sẵn sàng trong bản dùng thử")).toBeInTheDocument();
  });

  it("prevents acknowledging an already resolved lot on mobile", async () => {
    render(<DateWorkspace resolved />);
    fireEvent.click(screen.getByRole("button", { name: /Theo dõi DATE/ }));
    fireEvent.click(screen.getByRole("button", { name: /Cải thìa/ }));
    const dialog = await screen.findByRole("dialog", { name: "Chi tiết lô DATE" });
    expect(dialog).toHaveTextContent("Đã xử lý");
    expect(screen.getByRole("button", { name: "Ghi nhận" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đã xử lý" })).toBeDisabled();
  });
});
