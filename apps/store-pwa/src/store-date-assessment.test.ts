import { describe, expect, it } from "vitest";
import { assessDateLot, needsDateAttention, remainingShelfPercent } from "./store-date-assessment";

const lot = { manufactured: "01/10/2026", date: "2026-10-10" as const };
describe("DATE lot assessment using Tra hạn rules", () => {
  it.each([
    ["2026-09-30", "BEFORE_NSX", false],
    ["2026-10-05", "SAFE", false],
    ["2026-10-06", "WARNING", true],
    ["2026-10-08", "DANGER", true],
    ["2026-10-10", "DANGER", true],
    ["2026-10-11", "EXPIRED", true],
  ] as const)("labels %s as %s without expiring on HSD itself", (today, phase, attention) => {
    const assessment = assessDateLot(lot, today);
    expect(assessment.phase).toBe(phase);
    expect(needsDateAttention(assessment)).toBe(attention);
    expect(assessment.result).toMatchObject({ shelfLifeDays: 10, warningDate: "2026-10-06", withdrawalDate: "2026-10-08" });
  });
  it("keeps short shelf life without an invented warning milestone", () => {
    const assessment = assessDateLot({ ...lot, manufactured: "02/10/2026" }, "2026-10-09");
    expect(assessment.phase).toBe("SAFE");
    expect(assessment.result).toMatchObject({ warningDate: null, withdrawalDate: lot.date });
  });
  it.each([ ["2026-10-10", "MISSING"], ["2026-10-11", "EXPIRED"] ] as const)("keeps the known HSD %s when NSX is missing", (today, phase) => {
    const assessment = assessDateLot({ date: lot.date }, today);
    expect(assessment.phase).toBe(phase);
    expect(assessment.result).toBeNull();
    expect(assessment.nsx).toBeNull();
    expect(assessment.remainingDays).toBe(phase === "MISSING" ? 0 : -1);
  });
  it.each([ "31/02/2026", "10/10/2026", "11/10/2026" ])("rejects invalid or non-increasing dates: %s", manufactured => {
    expect(assessDateLot({ ...lot, manufactured }, "2026-10-12")).toMatchObject({ phase: "INVALID", result: null });
  });
  it("returns a data error instead of throwing when HSD is invalid", () => {
    expect(assessDateLot({ date: "2026-02-31" }, "2026-10-12")).toMatchObject({ phase: "INVALID", remainingDays: null, result: null });
  });
});


describe("remaining shelf-life percentage presentation", () => {
  it.each([
    ["2026-09-30", 100], ["2026-10-01", 100], ["2026-10-05", 60],
    ["2026-10-06", 50], ["2026-10-08", 30], ["2026-10-10", 10], ["2026-10-11", 0],
  ] as const)("uses inclusive days and clamps %s to %s%%", (today, expected) => {
    expect(remainingShelfPercent(assessDateLot(lot, today))).toBe(expected);
  });
  it("rounds up so an unexpired long-life lot never shows zero", () => {
    expect(remainingShelfPercent(assessDateLot({ manufactured: "01/01/2024", date: "2026-10-10" }, "2026-10-10"))).toBe(1);
  });
  it("counts leap days and HCM calendar dates independently of elapsed hours", () => {
    expect(remainingShelfPercent(assessDateLot({ manufactured: "28/02/2024", date: "2024-03-02" }, "2024-03-01"))).toBe(50);
  });
  it.each([undefined, "31/02/2026", "10/10/2026"])("does not invent a ratio for missing/invalid NSX %s", manufactured => {
    expect(remainingShelfPercent(assessDateLot({ ...lot, manufactured }, "2026-10-11"))).toBeNull();
  });
});
