import { describe, expect, it } from "vitest";
import { historyDateShortcut, matchesHistoryDateRange, parseHistoryDateRange } from "./history-date-filter";

describe("Pilot history dates", () => {
  it("uses Vietnam's day at a UTC year boundary", () => {
    const now = new Date("2026-12-31T17:01:00Z");
    expect(historyDateShortcut("today", now)).toEqual({ from: "01/01/2027", to: "01/01/2027" });
    expect(historyDateShortcut("yesterday", now)).toEqual({ from: "31/12/2026", to: "31/12/2026" });
    expect(historyDateShortcut("week", now)).toEqual({ from: "28/12/2026", to: "03/01/2027" });
  });

  it.each([
    ["2026-10-25T12:00:00Z", "19/10/2026", "25/10/2026"],
    ["2026-10-25T17:00:00Z", "26/10/2026", "01/11/2026"],
  ])("starts weeks on Monday even at the Vietnam midnight boundary (%s)", (now, from, to) => {
    expect(historyDateShortcut("week", new Date(now))).toEqual({ from, to });
  });

  it("handles leap days", () => {
    expect(historyDateShortcut("yesterday", new Date("2028-03-01T00:00:00Z"))).toEqual({ from: "29/02/2028", to: "29/02/2028" });
  });

  it("includes both boundaries and compares calendar dates across months", () => {
    const range = parseHistoryDateRange({ from: "31/12/2026", to: "02/01/2027" });
    expect(["30/12/2026", "31/12/2026", "01/01/2027", "02/01/2027", "03/01/2027"].map(date => matchesHistoryDateRange(date, range))).toEqual([false, true, true, true, false]);
  });

  it("supports open bounds and keeps legacy invalid dates visible only without a date filter", () => {
    expect(matchesHistoryDateRange("15/08/2026", parseHistoryDateRange({ from: "", to: "15/08/2026" }))).toBe(true);
    expect(matchesHistoryDateRange("15/08/2026", parseHistoryDateRange({ from: "16/08/2026", to: "" }))).toBe(false);
    expect(matchesHistoryDateRange("invalid", parseHistoryDateRange({ from: "", to: "" }))).toBe(true);
    expect(matchesHistoryDateRange("invalid", parseHistoryDateRange({ from: "15/08/2026", to: "" }))).toBe(false);
  });

  it.each([
    { from: "31/02/2026", to: "" },
    { from: "15/08", to: "" },
    { from: "16/08/2026", to: "15/08/2026" },
  ])("rejects invalid or reversed ranges %j", (range) => {
    expect(parseHistoryDateRange(range).error).not.toBe("");
  });
});
