import { describe, expect, it } from "vitest";
import type { LocalDate } from "@coopfood-kph/kph-rules";
import { defaultReportFilter, presetPeriod } from "./store-date-report-model";
import { suggestedReportTitle, suggestedTemplateTitle, type ReportTemplate } from "./store-report-library";

describe("ready-to-save report names", () => {
  it("describes the scope without freezing a count for dynamic templates", () => {
    const filter = { ...defaultReportFilter, phase: "EXPIRED" as const, processing: "resolved" as const };
    expect(suggestedTemplateTitle(filter, 2, [])).toBe("Hết HSD · Đã xử lý · 2 lô");
    expect(suggestedTemplateTitle(filter, null, [])).toBe("Hết HSD · Đã xử lý");
  });
  it("avoids case-insensitive collisions while retaining the content label", () => {
    const first = suggestedTemplateTitle(defaultReportFilter, null, []);
    const templates: ReportTemplate[] = [{ id: "one", title: first.toUpperCase(), filter: defaultReportFilter, selectedIds: null }];
    const second = suggestedTemplateTitle(defaultReportFilter, null, templates);
    expect(second).not.toBe(first); expect(second).toContain(first);
    const third = suggestedTemplateTitle(defaultReportFilter, null, [...templates, { ...templates[0]!, id: "two", title: second }]);
    expect(third).not.toBe(second);
  });
  it("includes the period, bounds long titles and replaces the old automatic period on reuse", () => {
    const period = presetPeriod("month", "2026-10-14" as LocalDate);
    const title = suggestedReportTitle("Báo cáo tổng hợp", period);
    expect(title).toBe("Báo cáo tổng hợp · 01/10/2026 – 31/10/2026");
    expect(suggestedReportTitle(title, period)).toBe(title);
    expect(suggestedReportTitle(title, presetPeriod("previous", "2026-10-14" as LocalDate))).toBe("Báo cáo tổng hợp · 01/09/2026 – 30/09/2026");
    expect(suggestedReportTitle("x".repeat(120), period).length).toBeLessThanOrEqual(120);
  });
});
