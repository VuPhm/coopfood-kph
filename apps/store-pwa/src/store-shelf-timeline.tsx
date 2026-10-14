import { memo, type CSSProperties } from "react";
import { daysBetween, formatDisplayDate, type LocalDate, type ShelfLifeResult } from "@coopfood-kph/kph-rules";

export const ShelfLifeTimeline = memo(function ShelfLifeTimeline({ nsx, hsd, today, result }: { nsx: LocalDate; hsd: LocalDate; today: LocalDate; result: ShelfLifeResult }) {
  const milestones = [
    { label: "NSX", date: nsx, index: 0 },
    ...(result.warningDate ? [{ label: "Cảnh báo", date: result.warningDate, index: 1 }] : []),
    { label: "Hạn lùi", date: result.withdrawalDate, index: 2 },
    { label: "HSD", date: hsd, index: 3 },
  ];
  // Short shelf lives have withdrawal = expiry; share the endpoint to avoid overlap.
  const dates = [...new Set(milestones.map(m => m.date))];
  // Stay close to the date ratio, reserving room for labels in the quick panel.
  // Slightly widen the last two intervals instead of compressing their text.
  const duration = daysBetween(nsx, hsd);
  const warningPosition = result.warningDate ? Math.min(daysBetween(nsx, result.warningDate) / duration * 100, 56) : 100;
  const withdrawalPosition = result.warningDate ? Math.min(78, Math.max(daysBetween(nsx, result.withdrawalDate) / duration * 100, warningPosition + 22)) : 100;
  const positions = dates.map(date => date === nsx ? 0 : date === hsd ? 100 : date === result.warningDate ? warningPosition : withdrawalPosition);
  // Interpolate today within the adjusted intervals so it still meets each milestone.
  const position = (date: LocalDate) => {
    if (date <= nsx) return 0;
    if (date >= hsd) return 100;
    const index = dates.findIndex(end => end >= date);
    // Both endpoints exist for a validated NSX < HSD and an interior date.
    const start = dates[index - 1]!;
    const end = dates[index]!;
    const fraction = daysBetween(start, date) / daysBetween(start, end);
    return positions[index - 1]! + fraction * (positions[index]! - positions[index - 1]!);
  };
  const todayPosition = position(today);
  const outside = today < nsx ? "before" : today > hsd ? "after" : undefined;
  const todayLabel = outside === "before" ? "Hôm nay · Trước NSX" : outside === "after" ? "Hôm nay · Qua HSD" : "Hôm nay";
  return <div className="store-timeline" aria-label="Mốc thời hạn và hôm nay">
    <div className={`store-timeline-track${result.warningDate ? "" : " is-short-life"}`} style={{ "--warning-position": `${result.warningDate ? position(result.warningDate) : 100}%`, "--withdrawal-position": `${position(result.withdrawalDate)}%` } as CSSProperties}>
      <span className="store-timeline-today" role="img" aria-label={`${todayLabel} ${formatDisplayDate(today)}`} title={formatDisplayDate(today)} data-outside={outside} style={{ left: `${todayPosition}%`, "--today-position": todayPosition } as CSSProperties}><span>{todayLabel}</span></span>
      {dates.map(date => <div key={date} className="store-timeline-milestone" style={{ left: `${position(date)}%` }}>
        <i className={`milestone-${milestones.find(m => m.date === date)?.index}${date === result.withdrawalDate ? " is-emphasized" : ""}`} aria-hidden="true" />
        <time dateTime={date} title={formatDisplayDate(date)} aria-label={formatDisplayDate(date)}>{formatDisplayDate(date).slice(0, 5)}</time>
        <small className={`milestone-${milestones.find(m => m.date === date)?.index}`}>{milestones.filter(m => m.date === date).map(m => m.label).join(" / ")}</small>
      </div>)}
    </div>
  </div>;
});
