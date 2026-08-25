import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Dialog, DialogContent, DialogTitle } from "./dialog";

function OpenDialog() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Hộp thoại kiểm tra</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("closes with Escape", () => {
    render(<OpenDialog />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Hộp thoại kiểm tra" })).not.toBeInTheDocument();
  });

  it("closes from an outside click while keeping a 44px close hit area", () => {
    render(<OpenDialog />);
    const closeButton = screen.getByRole("button", { name: "Đóng" });
    expect(closeButton).toHaveClass("size-11", "right-0", "top-0");

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as Element);
    expect(screen.queryByRole("dialog", { name: "Hộp thoại kiểm tra" })).not.toBeInTheDocument();
  });
});
