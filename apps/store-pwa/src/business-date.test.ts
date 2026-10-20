import { afterEach, describe, expect, it, vi } from "vitest";
import { parseDisplayDate } from "@coopfood-kph/kph-rules";

import { formatBusinessDate } from "./business-date";

afterEach(() => vi.restoreAllMocks());

describe("canonical business date", () => {
  it.each([
    ["2026-10-19T16:59:59.999Z", "19/10/2026", "2026-10-19"],
    ["2026-10-19T17:00:00.000Z", "20/10/2026", "2026-10-20"],
    ["2026-12-31T17:00:00.000Z", "01/01/2027", "2027-01-01"],
    ["2024-02-28T17:00:00.000Z", "29/02/2024", "2024-02-29"],
  ])("keeps Asia/Ho_Chi_Minh day boundaries for %s", (instant, display, iso) => {
    expect(formatBusinessDate(new Date(instant))).toEqual({ display, iso });
  });

  it.each(["10/20/2026", "20/10/26", "20 thg 10, 2026", "20\u200e/10\u200e/2026"])("does not use browser-specific format() output %s as form data", (formatted) => {
    const prototype: { readonly format: unknown } = Intl.DateTimeFormat.prototype;
    vi.spyOn(prototype, "format", "get").mockReturnValue(() => formatted);
    const date = formatBusinessDate(new Date("2026-10-20T05:00:00Z"));
    expect(date).toEqual({ display: "20/10/2026", iso: "2026-10-20" });
    expect(parseDisplayDate(date.display)).toBe(date.iso);
  });
});
