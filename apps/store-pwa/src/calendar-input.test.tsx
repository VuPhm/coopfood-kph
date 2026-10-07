import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CalendarInput } from "./calendar-input";

function CalendarInputHarness() {
  const [value, setValue] = useState("");
  return <CalendarInput id="treatment-date" initialMonth="2026-08-01" label="Ngày xử lý" value={value} onValueChange={setValue} />;
}

describe("CalendarInput", () => {
  afterEach(() => vi.restoreAllMocks());

  it("preserves month/year when a day or month is temporarily incomplete", () => {
    render(<CalendarInputHarness />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "12/10/2026" } });
    fireEvent.change(input, { target: { value: "1/10/2026" } });
    expect(input).toHaveValue("1/10/2026");
    fireEvent.change(input, { target: { value: "15/10/2026" } });
    fireEvent.change(input, { target: { value: "15/1/2026" } });
    expect(input).toHaveValue("15/1/2026");
    fireEvent.change(input, { target: { value: "15//2026" } });
    expect(input).toHaveValue("15//2026");
    fireEvent.change(input, { target: { value: "15/11/2026" } });
    expect(input).toHaveValue("15/11/2026");
  });

  it("opens the themed calendar only from its button and selects a date", () => {
    render(<CalendarInputHarness />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: "15082026" } });
    expect(input).toHaveValue("15/08/2026");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Chọn ngày xử lý" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Lịch chọn ngày" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "16 tháng 8, 2026" }));
    expect(input).toHaveValue("16/08/2026");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps business dates read-only", () => {
    render(<CalendarInput id="detected" initialMonth="2026-10-06" label="Ngày phát hiện" value="06/10/2026" readOnly onValueChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
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
