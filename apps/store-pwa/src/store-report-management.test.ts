import { describe, expect, it } from "vitest";
import type { LocalDate } from "@coopfood-kph/kph-rules";
import { mockDateLots } from "./store-app-mock";
import { createDateReport, defaultReportFilter, presetPeriod } from "./store-date-report-model";
import { copyTemplateTitle, findSavedReports, standardReportTemplates, templateNameError, upsertCustomTemplate, type ReportTemplate, type SavedDateReport } from "./store-report-library";

const template: ReportTemplate = { id: "personal", title: "Quầy A", filter: { ...defaultReportFilter }, selectedIds: ["C24-118"] };
describe("report template management and history query", () => {
  it("validates blank, long and case-insensitive names while allowing a template to keep its own name", () => {
    expect(templateNameError(" ", [template])).not.toBe("");
    expect(templateNameError("x".repeat(81), [template])).not.toBe("");
    expect(templateNameError(" QUẦY A ", [template])).not.toBe("");
    expect(templateNameError(" Quầy A ", [template], template.id)).toBe("");
  });
  it("updates a custom ID without changing another template or a frozen report", () => {
    const original = { ...template, filter: { ...template.filter }, selectedIds: [...template.selectedIds!] };
    const snapshot = createDateReport(mockDateLots, "2026-10-14" as LocalDate, presetPeriod("month", "2026-10-14" as LocalDate), original.filter, "0001", "now", original.selectedIds);
    const update: ReportTemplate = { ...original, title: "Quầy A mới", filter: { ...original.filter, phase: "EXPIRED" }, selectedIds: ["A24-198"] };
    const next = upsertCustomTemplate([original], update);
    expect(next).toHaveLength(1); expect(next[0]!.id).toBe("personal");
    update.selectedIds!.push("D24-090"); update.filter.phase = "SAFE";
    expect(next[0]).toMatchObject({ selectedIds: ["A24-198"], filter: { phase: "EXPIRED" } });
    expect(original.title).toBe("Quầy A"); expect(original.selectedIds).toEqual(["C24-118"]);
    expect(snapshot.rows.map(row => row.id)).toEqual(["C24-118"]);
  });
  it("rejects attempts to overwrite a standard preset", () => {
    expect(() => upsertCustomTemplate([], { ...standardReportTemplates[0]!, title: "Đổi tên preset" })).toThrow();
  });
  it("generates unique bounded copy names", () => {
    const first = copyTemplateTitle(template.title, [template]);
    const second = copyTemplateTitle(template.title, [template, { ...template, id: "copy", title: first }]);
    expect(first).not.toBe(second);
    expect(copyTemplateTitle("a".repeat(80), [])).toHaveLength(80);
  });
  it("combines history search and closing month without changing source order or snapshots", () => {
    const asOf = "2026-10-14" as LocalDate;
    const base = createDateReport(mockDateLots, asOf, presetPeriod("month", asOf), defaultReportFilter, "0001", "now");
    const history: SavedDateReport[] = [{ ...base, id: "new", title: "Quầy A tháng 10" }, { ...base, id: "old", title: "Quầy A tháng 9", asOf: "2026-09-30" as LocalDate }, { ...base, id: "other", title: "Quầy B" }];
    expect(findSavedReports(history, " QUẦY A ", "2026-10").map(report => report.id)).toEqual(["new"]);
    expect(findSavedReports(history, "Quầy A", "").map(report => report.id)).toEqual(["new", "old"]);
    expect(findSavedReports(history, "không có", "")).toEqual([]);
    expect(findSavedReports(history, "01/10/2026", "")).toHaveLength(3);
    expect(history.map(report => report.id)).toEqual(["new", "old", "other"]);
  });
});
