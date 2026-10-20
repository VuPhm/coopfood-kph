import { useState } from "react";
import { z } from "zod";
import { parseDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import { assessDateLot } from "./store-date-assessment";
import { defaultReportFilter, periodLabel, phaseOptions, processingLabels, type DateReport, type ReportFilter, type ReportPeriod } from "./store-date-report-model";

export type ReportTemplate = { id: string; title: string; filter: ReportFilter; selectedIds: string[] | null };
export type SavedDateReport = DateReport & { id: string; title: string };
export const standardReportTemplates: ReportTemplate[] = [
  { id: "summary", title: "Báo cáo tổng hợp", filter: { ...defaultReportFilter }, selectedIds: null },
  { id: "attention", title: "Hàng cần chú ý", filter: { ...defaultReportFilter, phase: "attention" }, selectedIds: null },
  { id: "resolved", title: "Hàng đã xử lý", filter: { ...defaultReportFilter, processing: "resolved" }, selectedIds: null },
];
export function templateNameError(title: string, templates: readonly ReportTemplate[], exceptId?: string): string {
  const name = title.trim();
  if (!name) return "Nhập tên mẫu báo cáo.";
  if (name.length > 80) return "Tên mẫu tối đa 80 ký tự.";
  if (templates.some(template => template.id !== exceptId && template.title.trim().toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi"))) return "Tên mẫu đã có. Chọn tên khác.";
  return "";
}
export function suggestedTemplateTitle(filter: ReportFilter, selectedCount: number | null, templates: readonly ReportTemplate[]): string {
  const phase = filter.phase === "all" ? "Tổng hợp DATE" : phaseOptions.find(option => option.value === filter.phase)?.label ?? "Báo cáo DATE";
  const base = [phase, filter.processing !== "all" ? processingLabels[filter.processing] : null, selectedCount !== null ? `${selectedCount} lô` : null].filter(Boolean).join(" · ");
  let index = 1;
  while (true) {
    const suffix = index === 1 ? "" : ` (${index})`;
    const title = `${base.slice(0, 80 - suffix.length)}${suffix}`;
    if (!templateNameError(title, templates)) return title;
    index++;
  }
}
export function suggestedReportTitle(title: string, period: ReportPeriod): string {
  // Replace our prior automatic period suffix when reusing a saved report.
  const base = title.trim().replace(/ · \d{2}\/\d{2}\/\d{4} – \d{2}\/\d{2}\/\d{4}$/, "") || "Báo cáo DATE";
  const suffix = ` · ${periodLabel(period)}`;
  return `${base.slice(0, 120 - suffix.length).trimEnd()}${suffix}`;
}
export function copyTemplateTitle(title: string, templates: readonly ReportTemplate[]): string {
  let index = 1;
  while (true) {
    const suffix = index === 1 ? " (bản sao)" : ` (bản sao ${index})`;
    const name = `${title.slice(0, 80 - suffix.length)}${suffix}`;
    if (!templateNameError(name, templates)) return name;
    index++;
  }
}
export function upsertCustomTemplate(templates: readonly ReportTemplate[], template: ReportTemplate): ReportTemplate[] {
  if (standardReportTemplates.some(preset => preset.id === template.id)) throw new Error("Không cập nhật mẫu tiêu chuẩn.");
  const error = templateNameError(template.title, [...standardReportTemplates, ...templates], template.id);
  if (error) throw new Error(error);
  const copy = { ...template, title: template.title.trim(), filter: { ...template.filter, search: "" }, selectedIds: template.selectedIds === null ? null : [...template.selectedIds] };
  return templates.some(current => current.id === copy.id) ? templates.map(current => current.id === copy.id ? copy : current) : [...templates, copy];
}
export function findSavedReports(history: readonly SavedDateReport[], search: string, month: string) {
  const needle = search.trim().toLocaleLowerCase("vi");
  return history.filter(report => (!month || report.asOf.startsWith(`${month}-`)) && (!needle || `${report.title} ${report.id} ${report.period.start.split("-").reverse().join("/")} ${report.period.end.split("-").reverse().join("/")}`.toLocaleLowerCase("vi").includes(needle)));
}
export const reportLibraryKey = (storeCode: string) => `coopfood:mock-date-report-library:v1:${storeCode}`;
export type ReportLibrary = { history: SavedDateReport[]; templates: ReportTemplate[]; error: string; writable: boolean };

const businessDate = z.string().refine(value => {
  try { return parseDisplayDate(value.split("-").reverse().join("/")) === value; } catch { return false; }
}).transform(value => value as LocalDate);
const filterSchema = z.object({
  phase: z.enum(["all", "attention", "SAFE", "WARNING", "DANGER", "EXPIRED", "BEFORE_NSX", "MISSING", "INVALID"]),
  processing: z.enum(["all", "open", "acknowledged", "resolved"]), search: z.literal(""),
});
const templateSchema = z.object({ id: z.string().min(1), title: z.string().trim().min(1).max(80), filter: filterSchema, selectedIds: z.array(z.string()).nullable() });
const lotSchema = z.object({ id: z.string(), sku: z.string(), name: z.string(), date: z.string().transform(value => value as LocalDate), manufactured: z.string().optional(), status: z.enum(["open", "acknowledged", "resolved"]) });
const savedSchema = z.object({
  id: z.string().min(1), title: z.string().min(1).max(120), asOf: businessDate,
  period: z.object({ start: businessDate, end: businessDate }).refine(value => value.start <= value.end),
  filter: filterSchema, rows: z.array(lotSchema), store: z.string(), createdAt: z.string(),
});
const librarySchema = z.object({ version: z.literal(1), storeCode: z.string(), history: z.array(savedSchema), templates: z.array(templateSchema) });

// This repository is used by the synthetic StoreApp only, never the online app.
// Persist raw frozen lots; derive assessment with the archived asOf, never today's date.
export function readReportLibrary(storage: Pick<Storage, "getItem">, storeCode: string): ReportLibrary {
  const empty = { history: [], templates: [], error: "", writable: true };
  try {
    const raw = storage.getItem(reportLibraryKey(storeCode));
    if (!raw) return empty;
    const data = librarySchema.parse(JSON.parse(raw));
    if (data.storeCode !== storeCode) throw new Error("Store mismatch");
    return { ...empty, templates: data.templates, history: data.history.map(report => ({ ...report, rows: report.rows.map(({ manufactured, ...base }) => { const lot = manufactured === undefined ? base : { ...base, manufactured }; return { ...lot, assessment: assessDateLot(lot, report.asOf) }; }) })) };
  } catch {
    // Do not overwrite unreadable/foreign data with an empty library.
    return { ...empty, writable: false, error: "Không đọc được dữ liệu đã lưu. Báo cáo mới chỉ giữ trong phiên này." };
  }
}
export function writeReportLibrary(storage: Pick<Storage, "setItem">, storeCode: string, library: Pick<ReportLibrary, "history" | "templates">): string {
  try {
    const data = { version: 1, storeCode, templates: library.templates, history: library.history.map(report => ({ ...report, rows: report.rows.map(({ assessment: _assessment, ...lot }) => lot) })) };
    storage.setItem(reportLibraryKey(storeCode), JSON.stringify(data));
    return "";
  } catch { return "Chưa lưu được trên trình duyệt. Lịch sử và mẫu mới đang giữ trong phiên này."; }
}
export function useReportLibrary(storeCode: string) {
  const [library, setLibrary] = useState<ReportLibrary>(() => {
    try { return readReportLibrary(window.localStorage, storeCode); }
    catch { return { history: [], templates: [], writable: false, error: "Trình duyệt không cho lưu. Lịch sử và mẫu mới chỉ giữ trong phiên này." }; }
  });
  function commit(history: SavedDateReport[], templates: ReportTemplate[]) {
    let error = library.error;
    if (library.writable) {
      try { error = writeReportLibrary(window.localStorage, storeCode, { history, templates }); }
      catch { error = "Chưa lưu được trên trình duyệt. Dữ liệu mới đang giữ trong phiên này."; }
    }
    setLibrary({ ...library, history, templates, error });
  }
  return { ...library,
    addReport: (report: SavedDateReport) => commit([report, ...library.history], library.templates),
    saveTemplate: (template: ReportTemplate) => commit(library.history, upsertCustomTemplate(library.templates, template)),
  };
}
