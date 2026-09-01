import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { CalendarInput } from "./calendar-input";

function CalendarInputHarness() {
  const [value, setValue] = useState("");
  return <CalendarInput id="treatment-date" initialMonth="2026-08-01" label="Ngày xử lý" value={value} onValueChange={setValue} />;
}

describe("CalendarInput", () => {
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
