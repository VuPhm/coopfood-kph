import { dateLotBatchLabel } from "./store-date-lot";
import { addDays, formatDisplayDate, parseDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import { assessDateLot, DATE_PHASE_LABELS, needsDateAttention, type DatePhase } from "./store-date-assessment";
import type { MockDateLot, MockDateLotStatus } from "./store-app-mock";

export type ReportPeriod = { start: LocalDate; end: LocalDate };
export type ReportFilter = { phase: "all" | "attention" | DatePhase; processing: "all" | MockDateLotStatus; search: string };
export type DateReportRow = MockDateLot & { assessment: ReturnType<typeof assessDateLot> };
export type DateReport = { period: ReportPeriod; asOf: LocalDate; filter: ReportFilter; rows: DateReportRow[]; store: string; createdAt: string };
export const defaultReportFilter: ReportFilter = { phase: "all", processing: "all", search: "" };
export const processingLabels = { all: "Tất cả xử lý", open: "Mở", acknowledged: "Đã ghi nhận", resolved: "Đã xử lý" };
export const phaseOptions = [{ value: "all", label: "Toàn bộ danh mục" }, { value: "attention", label: "Cần chú ý" }, ...Object.entries(DATE_PHASE_LABELS).map(([value, label]) => ({ value, label }))];

export function presetPeriod(kind: "month" | "week" | "previous", today: LocalDate): ReportPeriod {
  const date = new Date(`${today}T00:00:00Z`);
  const month = today.slice(0, 7);
  if (kind === "week") {
    const start = addDays(today, -((date.getUTCDay() + 6) % 7));
    return { start, end: addDays(start, 6) };
  }
  const start = (kind === "previous" ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)).toISOString().slice(0, 10) : `${month}-01`) as LocalDate;
  const end = new Date(Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)), 0)).toISOString().slice(0, 10) as LocalDate;
  return { start, end };
}
export function parsePeriod(start: string, end: string): ReportPeriod {
  const period = { start: parseDisplayDate(start), end: parseDisplayDate(end) };
  if (period.start > period.end) throw new Error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
  return period;
}
export const periodLabel = (period: ReportPeriod) => `${formatDisplayDate(period.start)} – ${formatDisplayDate(period.end)}`;
export const filterLabel = (filter: ReportFilter) => [phaseOptions.find(option => option.value === filter.phase)?.label, processingLabels[filter.processing], filter.search ? `Tìm: ${filter.search}` : null].filter(Boolean).join(" · ");

// The DATE source is a current list, not a historical inventory ledger.
// A period contains a snapshot; it never filters inventory by HSD.
export function selectDateReport(lots: readonly MockDateLot[], asOf: LocalDate, period: ReportPeriod, filter: ReportFilter): DateReportRow[] {
  if (asOf < period.start || asOf > period.end) return [];
  const needle = filter.search.trim().toLocaleLowerCase("vi");
  return lots.map(lot => ({ ...lot, ...(lot.productSnapshot ? { productSnapshot: { ...lot.productSnapshot } } : {}), assessment: assessDateLot(lot, asOf) }))
    .filter(row => (filter.phase === "all" || (filter.phase === "attention" ? needsDateAttention(row.assessment) : row.assessment.phase === filter.phase)) &&
      (filter.processing === "all" || row.status === filter.processing) &&
      (!needle || `${row.sku} ${row.name} ${dateLotBatchLabel(row)}`.toLocaleLowerCase("vi").includes(needle)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function createDateReport(lots: readonly MockDateLot[], asOf: LocalDate, period: ReportPeriod, filter: ReportFilter, store: string, createdAt: string, selectedIds: readonly string[] | null = null): DateReport {
  return { period: { ...period }, asOf, filter: { ...filter }, rows: selectDateReport(lots, asOf, period, filter).filter(row => selectedIds === null || selectedIds.includes(row.id)), store, createdAt };
}
