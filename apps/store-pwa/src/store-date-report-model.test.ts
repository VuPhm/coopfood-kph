import { describe, expect, it } from "vitest";
import type { LocalDate } from "@coopfood-kph/kph-rules";
import { mockDateLots } from "./store-app-mock";
import { createDateReport, defaultReportFilter, parsePeriod, presetPeriod, selectDateReport } from "./store-date-report-model";
import { createDateReportWorkbook } from "./store-date-report-export";

const today = "2026-10-14" as LocalDate;
const period = presetPeriod("month", today);
describe("DATE periodic report candidate", () => {
  it("contains a current snapshot without filtering stock by expiry or inventing past inventory", () => {
    const rows = selectDateReport(mockDateLots, today, period, defaultReportFilter);
    expect(rows).toHaveLength(mockDateLots.length);
    expect(rows.some(row => row.date > period.end)).toBe(true);
    expect(selectDateReport(mockDateLots, today, presetPeriod("previous", today), defaultReportFilter)).toEqual([]);
  });
  it("retains expired DATE after processing and freezes the rows and filters used to create a report", () => {
    const lots = mockDateLots.map(lot => ({ ...lot, status: "resolved" as const }));
    const filter = { ...defaultReportFilter, phase: "EXPIRED" as const, processing: "resolved" as const };
    const report = createDateReport(lots, today, period, filter, "0001", "14/10/2026");
    expect(report.rows.length).toBeGreaterThan(0);
    expect(report.rows.every(row => row.assessment.phase === "EXPIRED" && row.status === "resolved")).toBe(true);
    lots[0]!.name = "Thay đổi sau khi tạo";
    filter.search = "không còn phù hợp";
    expect(report.rows[0]!.name).not.toBe(lots[0]!.name);
    expect(report.filter.search).toBe("");
  });
  it("validates periods and uses Monday-to-Sunday weeks across month/year boundaries", () => {
    expect(presetPeriod("week", "2027-01-01" as LocalDate)).toEqual({ start: "2026-12-28", end: "2027-01-03" });
    expect(presetPeriod("month", "2028-02-10" as LocalDate).end).toBe("2028-02-29");
    expect(() => parsePeriod("31/02/2026", "14/10/2026")).toThrow();
    expect(() => parsePeriod("15/10/2026", "14/10/2026")).toThrow();
  });
  it("exports identifiers as text and missing stock as missing rather than zero", async () => {
    const report = createDateReport(mockDateLots, today, period, defaultReportFilter, "0001", "14/10/2026");
    report.rows[0]!.name = "=HYPERLINK(\"https://example.com\")";
    const book = await createDateReportWorkbook(report);
    const sheet = book.worksheets[0]!;
    expect(sheet.getCell("A10").value).toBe(report.rows[0]!.sku);
    expect(sheet.getCell("A10").numFmt).toBe("@");
    expect(sheet.getCell("B10").value).toBe(report.rows[0]!.name);
    expect(sheet.getCell("B10").type).toBe(3); // Excel string, never formula
    expect(sheet.getCell("F10").value).toBe("Chưa có");
    expect(sheet.getCell("G10").value).toBe("Chưa có");
  });
});
