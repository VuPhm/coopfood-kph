import { describe, expect, it } from "vitest";
import { kphDateRange } from "./store-kph-history";

describe("KPH quick date ranges in Asia/Ho_Chi_Minh", () => {
  it("uses the business day across UTC midnight and the year boundary", () => {
    const now = new Date("2026-12-31T17:01:00Z");
    expect(kphDateRange("today", now)).toEqual({ from: "01/01/2027", to: "01/01/2027" });
    expect(kphDateRange("yesterday", now)).toEqual({ from: "31/12/2026", to: "31/12/2026" });
    expect(kphDateRange("week", now)).toEqual({ from: "28/12/2026", to: "01/01/2027" });
  });
  it("starts the week on Monday and includes Sunday without shifting to next week", () => {
    expect(kphDateRange("week", new Date("2026-10-25T04:00:00Z"))).toEqual({ from: "19/10/2026", to: "25/10/2026" });
    expect(kphDateRange("week", new Date("2026-10-25T17:00:00Z"))).toEqual({ from: "26/10/2026", to: "26/10/2026" });
  });
});
