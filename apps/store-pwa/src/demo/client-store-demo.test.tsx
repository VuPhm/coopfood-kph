import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ClientStoreDemo } from "./client-store-demo";

afterEach(() => vi.unstubAllGlobals());

describe("Client Store Demo", () => {
  it("opens the reused expiry lookup from Home while keeping the workbench single", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    render(<ClientStoreDemo><div>KPH workspace</div></ClientStoreDemo>);

    const functions = screen.getByRole("region", { name: "Chức năng" });
    const attention = screen.getByRole("region", { name: "Việc cần chú ý" });
    expect(functions.compareDocumentPosition(attention) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelectorAll(".expiry-workbench")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Tra cứu lùi hàng Tính DATE và hạn lùi/i }));
    expect(screen.getByLabelText("Ngày sản xuất")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Đóng tra cứu lùi hàng" }));
    fireEvent.click(screen.getByRole("button", { name: "KPH" }));
    expect(screen.getByText("KPH workspace")).toBeVisible();
    expect(document.querySelectorAll(".expiry-workbench")).toHaveLength(1);
  });
});
