import { CalendarDays, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useStoreDensityValue } from "./store-density";
import { StoreSettingsGroup, StoreSettingsRow } from "./store-settings-group";

/** Same settings and handlers; Compact uses one operational row, without two cards. */
export function StoreReportSettings({ period, scope, filterCount, onPeriod, onFilter }: {
  period: string; scope: string; filterCount: number; onPeriod: () => void; onFilter: () => void;
}) {
  const compact = useStoreDensityValue() === "compact";
  if (!compact) return <StoreSettingsGroup label="Thiết lập báo cáo" columns={2} className="store-report-settings">
    <StoreSettingsRow label="Kỳ báo cáo" value={period} icon={<CalendarDays size={20} aria-hidden="true" />} onClick={onPeriod} ariaLabel="Chọn kỳ báo cáo" />
    <StoreSettingsRow label="Phạm vi" value={scope} valueId="report-filter-summary" icon={<SlidersHorizontal size={20} aria-hidden="true" />} onClick={onFilter} ariaLabel="Lọc danh mục báo cáo" badge={filterCount} />
  </StoreSettingsGroup>;
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
