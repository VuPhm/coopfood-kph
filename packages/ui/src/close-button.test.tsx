import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { CloseButton } from "./close-button";

describe("CloseButton", () => {
  it("dismisses without submitting a containing form and forwards the focus ref", () => {
    const dismiss = vi.fn();
    const submit = vi.fn(event => event.preventDefault());
    const ref = createRef<HTMLButtonElement>();
    render(<form onSubmit={submit}><CloseButton ref={ref} aria-label="Đóng tiện ích" onClick={dismiss} /></form>);
    fireEvent.click(screen.getByRole("button", { name: "Đóng tiện ích" }));
    expect(dismiss).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it("respects disabled dismissal", () => {
    const dismiss = vi.fn();
    render(<CloseButton disabled onClick={dismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(dismiss).not.toHaveBeenCalled();
  });
});
