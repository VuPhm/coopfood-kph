import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("respects a form's outside-dismiss prevention", async () => {
    function ProtectedForm() {
      const [open, setOpen] = useState(true);
      return <Dialog open={open} onOpenChange={setOpen}><DialogContent onInteractOutside={event => event.preventDefault()}><DialogTitle>Phiếu đang nhập</DialogTitle></DialogContent></Dialog>;
    }
    render(<ProtectedForm />);
    await new Promise(resolve => setTimeout(resolve, 0));
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as Element;
    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);
    expect(screen.getByRole("dialog", { name: "Phiếu đang nhập" })).toBeInTheDocument();
  });
  it("returns focus to an ordinary opener when a controlled dialog closes", async () => {
    function ControlledDialog() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Mở hộp thoại</button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Hộp thoại kiểm tra</DialogTitle></DialogContent></Dialog></>;
    }
    render(<ControlledDialog />);
    const trigger = screen.getByRole("button", { name: "Mở hộp thoại" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes from the shared X button", () => {
    render(<OpenDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog", { name: "Hộp thoại kiểm tra" })).not.toBeInTheDocument();
  });

  it("keeps an explicit caller focus destination when closing", async () => {
    function ControlledDialog() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Mở hộp thoại</button><button id="next-action">Tiếp tục</button><Dialog open={open} onOpenChange={setOpen}><DialogContent onCloseAutoFocus={() => document.getElementById("next-action")?.focus()}><DialogTitle>Hộp thoại kiểm tra</DialogTitle></DialogContent></Dialog></>;
    }
    render(<ControlledDialog />);
    const trigger = screen.getByRole("button", { name: "Mở hộp thoại" });
    trigger.focus(); fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Tiếp tục" })).toHaveFocus());
  });

  it("closes with Escape", () => {
    render(<OpenDialog />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Hộp thoại kiểm tra" })).not.toBeInTheDocument();
  });

  it("closes from an outside click while keeping a 44px close hit area", async () => {
    render(<OpenDialog />);
    const closeButton = screen.getByRole("button", { name: "Đóng" });
    expect(closeButton).toHaveClass("size-11", "right-3", "top-3");

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    await new Promise(resolve => setTimeout(resolve, 0));
    fireEvent.pointerDown(overlay as Element);
    fireEvent.click(overlay as Element);
    expect(screen.queryByRole("dialog", { name: "Hộp thoại kiểm tra" })).not.toBeInTheDocument();
  });
});
