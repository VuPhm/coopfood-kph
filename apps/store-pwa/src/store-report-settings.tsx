import { CalendarDays, ChevronDown, SlidersHorizontal } from "lucide-react";

/** One operational row; period and filter retain their own accessible context. */
export function StoreReportSettings({ period, scope, filterCount, onPeriod, onFilter }: {
  period: string; scope: string; filterCount: number; onPeriod: () => void; onFilter: () => void;
}) {
  return <section className="store-report-settings store-report-settings-inline" aria-label="Thiết lập báo cáo">
    <button type="button" className="store-report-period-inline" aria-label="Chọn kỳ báo cáo" aria-describedby="report-period-summary" onClick={onPeriod}>
      <CalendarDays size={20} aria-hidden="true" /><span id="report-period-summary">{period}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    <button type="button" className={`store-report-filter-inline${filterCount ? " is-filtered" : ""}`} aria-label="Lọc danh mục báo cáo" aria-describedby="report-filter-summary" onClick={onFilter}>
      <SlidersHorizontal size={20} aria-hidden="true" />{filterCount ? <b className="store-settings-badge" aria-hidden="true">{filterCount}</b> : null}
    </button>
    <p id="report-filter-summary" className={filterCount ? "store-report-filter-context" : "sr-only"}>{scope}</p>
  </section>;
}
