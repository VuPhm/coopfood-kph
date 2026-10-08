import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { StoreSheet } from "./store-app";

function Harness({ removeOpener = false, hideOpener = false }: { removeOpener?: boolean; hideOpener?: boolean }) {
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(false);
  return <><main id="store-content" tabIndex={-1}>Nội dung</main>
    {!(closed && removeOpener) && <button style={closed && hideOpener ? { display: "none" } : undefined} onClick={() => setOpen(true)}>Mở hộp</button>}
    <StoreSheet open={open} onOpenChange={next => { setOpen(next); if (!next) setClosed(true); }} title="Hộp kiểm tra" description="Kiểm tra focus"><p>Thông tin</p></StoreSheet></>;
}

describe("controlled StoreSheet return focus", () => {
  it.each(["escape", "close"])("returns to the opener after %s", async method => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Mở hộp" }); opener.focus(); fireEvent.click(opener);
    const dialog = await screen.findByRole("dialog", { name: "Hộp kiểm tra" });
    if (method === "escape") fireEvent.keyDown(dialog, { key: "Escape" });
    else fireEvent.click(dialog.querySelector(".store-sheet-heading button")!);
    await waitFor(() => expect(opener).toHaveFocus());
  });
  it.each([{ removeOpener: true }, { hideOpener: true }])("falls back to content when the opener becomes unavailable: %j", async props => {
    render(<Harness {...props} />);
    const opener = screen.getByRole("button", { name: "Mở hộp" }); opener.focus(); fireEvent.click(opener);
    const dialog = await screen.findByRole("dialog", { name: "Hộp kiểm tra" });
    fireEvent.click(dialog.querySelector(".store-sheet-heading button")!);
    await waitFor(() => expect(document.getElementById("store-content")).toHaveFocus());
  });
});
