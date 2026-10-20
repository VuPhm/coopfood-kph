import { describe, expect, it } from "vitest";
import type { LocalDate } from "@coopfood-kph/kph-rules";
import { mockDateLots } from "./store-app-mock";
import { createDateReport, defaultReportFilter, presetPeriod } from "./store-date-report-model";
import { readReportLibrary, reportLibraryKey, standardReportTemplates, writeReportLibrary, type SavedDateReport } from "./store-report-library";

const asOf = "2026-10-14" as LocalDate;
function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}
function report(): SavedDateReport {
  return { ...createDateReport(mockDateLots, asOf, presetPeriod("month", asOf), defaultReportFilter, "0001 · Mẫu", "14/10/2026 12:00:00", ["C24-118"]), id: "report-00001", title: "Báo cáo tổng hợp" };
}
describe("mock report history and template library", () => {
  it("exports exactly the chosen lots, preserving explicit empty and missing selections", () => {
    const period = presetPeriod("month", asOf);
    expect(report().rows.map(row => row.id)).toEqual(["C24-118"]);
    expect(createDateReport(mockDateLots, asOf, period, defaultReportFilter, "0001", "now", []).rows).toEqual([]);
    expect(createDateReport(mockDateLots, asOf, period, defaultReportFilter, "0001", "now", ["missing-lot"]).rows).toEqual([]);
  });
  it("round trips a frozen snapshot and open template IDs without using today's inventory", () => {
    const local = storage();
    const snapshot = report();
    const template = { id: "my-new-report-kind", title: "Lô của quầy A", filter: { ...defaultReportFilter }, selectedIds: ["C24-118"] };
    expect(writeReportLibrary(local, "0001", { history: [snapshot], templates: [template] })).toBe("");
    snapshot.rows[0]!.status = "resolved";
    snapshot.rows[0]!.name = "Đổi tên sau khi lưu";
    template.selectedIds.push("another-lot");
    const loaded = readReportLibrary(local, "0001");
    expect(loaded.history[0]!.rows[0]).toMatchObject({ sku: "0011730", status: "open", assessment: { phase: "EXPIRED" } });
    expect(loaded.history[0]!.asOf).toBe("2026-10-14");
    expect(loaded.history[0]!.rows[0]!.name).not.toBe(snapshot.rows[0]!.name);
    expect(loaded.templates[0]).toMatchObject({ id: "my-new-report-kind", selectedIds: ["C24-118"] });
    expect(standardReportTemplates[0]!.filter).toEqual(defaultReportFilter);
  });
  it("keeps stores separate and refuses a foreign or corrupt library without overwriting it", () => {
    const local = storage();
    writeReportLibrary(local, "0001", { history: [report()], templates: [] });
    expect(readReportLibrary(local, "0002").history).toEqual([]);
    local.setItem(reportLibraryKey("0002"), local.getItem(reportLibraryKey("0001"))!);
    expect(readReportLibrary(local, "0002")).toMatchObject({ history: [], writable: false });
    local.setItem(reportLibraryKey("0001"), "broken-json");
    expect(readReportLibrary(local, "0001")).toMatchObject({ writable: false });
    expect(local.getItem(reportLibraryKey("0001"))).toBe("broken-json");
  });
  it("reports disabled or exhausted storage instead of claiming persistence", () => {
    const error = writeReportLibrary({ setItem() { throw new Error("quota"); } }, "0001", { history: [report()], templates: [] });
    expect(error).toContain("trong phiên");
    expect(readReportLibrary({ getItem() { throw new Error("blocked"); } }, "0001").error).toContain("trong phiên");
  });
});
