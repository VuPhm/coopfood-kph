import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { CalendarInput } from "./calendar-input";

function CalendarInputHarness() {
  const [value, setValue] = useState("");
  return <CalendarInput id="treatment-date" initialMonth="2026-08-01" label="Ngày xử lý" value={value} onValueChange={setValue} />;
}

describe("CalendarInput", () => {
  it.each(["", "2026-10-20", "01/01/2000"])("ignores change events carrying %s when the date is read-only", (value) => {
    const onValueChange = vi.fn();
    render(<CalendarInput id="detected-date" initialMonth="2026-10-20" label="Ngày phát hiện" value="20/10/2026" readOnly onValueChange={onValueChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value } });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("20/10/2026");
    expect(input).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Chọn ngày phát hiện" })).toBeDisabled();
  });

  it("portals above clipped forms and follows its anchor while the form scrolls", async () => {
    render(<CalendarInputHarness />);
    const anchor = document.querySelector('[data-calendar-input="treatment-date"]');
    expect(anchor).not.toBeNull();
    let top = 100;
    vi.spyOn(anchor as HTMLElement, "getBoundingClientRect").mockImplementation(() => ({
      bottom: top + 44,
      height: 44,
      left: 100,
      right: 300,
      top,
      width: 200,
      x: 100,
      y: top,
      toJSON: () => undefined,
    }));

    fireEvent.click(screen.getByRole("button", { name: "Chọn ngày xử lý" }));

    const calendar = screen.getByRole("dialog", { name: "Lịch chọn ngày" });
    expect(calendar.parentElement).toBe(document.body);
    await waitFor(() => expect(calendar).toHaveStyle({ top: "152px" }));

    top = 40;
    fireEvent.scroll(document);

    await waitFor(() => expect(calendar).toHaveStyle({ top: "92px" }));
  });
});
