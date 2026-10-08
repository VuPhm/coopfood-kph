import { useState, type CSSProperties } from "react";
import { Button, Input } from "@coopfood-kph/ui";
import { calculateShelfLife, daysBetween, expiryFromDays, expiryFromMonths, formatDisplayDate, manufactureFromDays, manufactureFromMonths, parseDisplayDate, type LocalDate, type ShelfLifeResult } from "@coopfood-kph/kph-rules";
import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { figmaAsset } from "./figma-assets";

export function ShelfLifeScreen({ idPrefix = "shelf" }: { idPrefix?: string } = {}) {
  const today = formatBusinessDate(new Date()).iso;
  const [known, setKnown] = useState(true);
  const [nsx, setNsx] = useState("");
  const [hsd, setHsd] = useState("");
  const [days, setDays] = useState("");
  const [months, setMonths] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ nsx: LocalDate; hsd: LocalDate; value: ShelfLifeResult } | null>(null);
  function dates(nextNsx: string, nextHsd: string) {
    setNsx(nextNsx); setHsd(nextHsd); setMonths(""); setResult(null); setError("");
    try { const n = daysBetween(parseDisplayDate(nextNsx), parseDisplayDate(nextHsd)) + 1; setDays(n > 0 ? String(n) : ""); } catch { setDays(""); }
  }
  function duration(value: string, unit: "days" | "months") {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (unit === "days") { setDays(cleaned); setMonths(""); } else { setMonths(cleaned); setDays(""); }
    setResult(null); setError("");
    // A duration edit invalidates the derived date, including empty/invalid input.
    if (known) setHsd(""); else setNsx("");
    if (!Number(cleaned)) return;
    try {
      const anchor = parseDisplayDate(known ? nsx : hsd);
      const next = known ? (unit === "days" ? expiryFromDays(anchor, Number(cleaned)) : expiryFromMonths(anchor, Number(cleaned))) : (unit === "days" ? manufactureFromDays(anchor, Number(cleaned)) : manufactureFromMonths(anchor, Number(cleaned)));
      if (known) setHsd(formatDisplayDate(next)); else setNsx(formatDisplayDate(next));
      if (unit === "months") setDays(String(known ? daysBetween(anchor, next) + 1 : daysBetween(next, anchor) + 1));
    } catch { /* An incomplete anchor is validated when submitting. */ }
  }
  function expiry(value: string) {
    if (known) { dates(nsx, value); return; }
    setHsd(value); setResult(null); setError("");
    setNsx("");
    try {
      const parsed = parseDisplayDate(value);
      if (Number(months)) setNsx(formatDisplayDate(manufactureFromMonths(parsed, Number(months))));
      else if (Number(days)) setNsx(formatDisplayDate(manufactureFromDays(parsed, Number(days))));
    } catch { /* Validation on submit. */ }
  }
  const state = result?.value.status.toLowerCase() ?? "empty";
  const withdrawalDays = result ? daysBetween(today, result.value.withdrawalDate) : 0;
  const expiryDays = result ? daysBetween(today, result.hsd) : 0;
  return <div className={`store-shelf shelf-${state}`}>
    <form className="store-shelf-form" onSubmit={event => {
      event.preventDefault();
      try {
        const h = parseDisplayDate(hsd);
        if (!known && !Number(months) && !Number(days)) throw new Error("Nhập thời hạn theo số ngày hoặc số tháng để tính NSX");
        const n = known ? parseDisplayDate(nsx) : Number(months) ? manufactureFromMonths(h, Number(months)) : manufactureFromDays(h, Number(days));
        const lookupToday = formatBusinessDate(new Date()).iso;
        setResult({ nsx: n, hsd: h, value: calculateShelfLife(n, h, lookupToday) }); setError("");
      }
      catch (e) { setError(e instanceof Error ? e.message : "Kiểm tra ngày đã nhập"); setResult(null); }
    }}>
      <div className="store-known-toggle"><strong>{known ? "Đã biết ngày sản xuất" : "Chưa biết ngày sản xuất"}</strong><button type="button" role="switch" aria-label="Đã biết ngày sản xuất" aria-checked={known} onClick={() => { setKnown(!known); setResult(null); setError(""); }}><span /></button></div>
      {known ? <div className="store-field"><label htmlFor={`${idPrefix}-nsx`}>Ngày sản xuất</label><CalendarInput id={`${idPrefix}-nsx`} initialMonth={today} label="Ngày sản xuất" value={nsx} onValueChange={v => dates(v, hsd)} /></div> : null}
      <div className="store-field"><label htmlFor={`${idPrefix}-hsd`}>Hạn sử dụng (HSD)</label><CalendarInput id={`${idPrefix}-hsd`} initialMonth={today} label="Hạn sử dụng" value={hsd} onValueChange={expiry} /></div>
      <div className="store-two-col">{(["days", "months"] as const).map(unit => <div className="store-field" key={unit}><label htmlFor={`${idPrefix}-${unit}`}>HSD (Số {unit === "days" ? "ngày" : "tháng"})</label><div className="store-duration"><Input id={`${idPrefix}-${unit}`} inputMode="numeric" value={unit === "days" ? days : months} onChange={e => duration(e.target.value, unit)} placeholder="—" /><span>{unit === "days" ? "ngày" : "tháng"}</span></div></div>)}</div>
      <div className="store-shelf-actions"><Button className="store-button" type="submit"><img src={figmaAsset("main-1", "imgFeatherSearch")} alt="" />Tra cứu</Button><Button className="store-button store-secondary" variant="ghost" type="button" onClick={() => { setNsx(""); setHsd(""); setDays(""); setMonths(""); setKnown(true); setError(""); setResult(null); }}><img src={figmaAsset("main-1", "imgFeatherRotateCcw")} alt="" />Làm mới</Button></div>
    </form>
    {error ? <p className="store-error" role="alert">{error}</p> : null}
    {result ? <section className="store-shelf-result" aria-label="Kết quả tra hạn lùi" aria-live="polite" data-status={result.value.status}>
      <span className={`store-chip chip-${state}`}>{result.value.status === "EXPIRED" ? "Đã hết hạn sử dụng" : result.value.status === "WARNING" ? "Sắp đến hạn lùi" : result.value.status === "SAFE" ? "An toàn" : withdrawalDays === 0 ? "Đến hạn lùi hôm nay" : "Ngày lùi hàng"}</span>
      <span className="sr-only">{result.value.status === "EXPIRED" ? "Hạn sử dụng" : "Ngày lùi hàng"}</span>
      <time className="store-result-date" dateTime={result.value.status === "EXPIRED" ? result.hsd : result.value.withdrawalDate}>{formatDisplayDate(result.value.status === "EXPIRED" ? result.hsd : result.value.withdrawalDate)}</time>
      <dl className="store-result-facts"><div className={withdrawalDays < 0 ? "is-overdue" : undefined}><dt>{withdrawalDays < 0 ? "Đã qua hạn lùi" : withdrawalDays === 0 ? "Hạn lùi hôm nay" : "Đến hạn lùi"}</dt><dd>{Math.abs(withdrawalDays)} ngày</dd></div><div><dt>{expiryDays < 0 ? "Qua HSD" : expiryDays === 0 ? "HSD hôm nay" : "HSD còn"}</dt><dd>{Math.abs(expiryDays)} ngày</dd></div></dl>
      <ShelfLifeTimeline nsx={result.nsx} hsd={result.hsd} today={today} result={result.value} />
    </section> : <p className="store-muted store-shelf-empty">Nhập ngày để tra cứu hạn lùi hàng.</p>}
  </div>;
}


function ShelfLifeTimeline({ nsx, hsd, today, result }: { nsx: LocalDate; hsd: LocalDate; today: LocalDate; result: ShelfLifeResult }) {
  const milestones = [
    { label: "NSX", date: nsx, index: 0 },
    ...(result.warningDate ? [{ label: "Cảnh báo", date: result.warningDate, index: 1 }] : []),
    { label: "Hạn lùi", date: result.withdrawalDate, index: 2 },
    { label: "HSD", date: hsd, index: 3 },
  ];
  // Short shelf lives have withdrawal = expiry; share the endpoint to avoid overlap.
  const dates = [...new Set(milestones.map(m => m.date))];
  // The reference spaces milestones evenly for legibility. Interpolate today
  // within its actual date interval rather than treating this as a duration axis.
  const position = (date: LocalDate) => {
    if (date <= nsx) return 0;
    if (date >= hsd) return 100;
    const index = dates.findIndex(end => end >= date);
    // Both endpoints exist for a validated NSX < HSD and an interior date.
    const start = dates[index - 1]!;
    const end = dates[index]!;
    const fraction = daysBetween(start, date) / daysBetween(start, end);
    return (index - 1 + fraction) / (dates.length - 1) * 100;
  };
  const todayPosition = position(today);
  const outside = today < nsx ? "before" : today > hsd ? "after" : undefined;
  const todayLabel = outside === "before" ? "Hôm nay · Trước NSX" : outside === "after" ? "Hôm nay · Qua HSD" : "Hôm nay";
  return <div className="store-timeline" aria-label="Mốc thời hạn và hôm nay">
    <div className={`store-timeline-track${result.warningDate ? "" : " is-short-life"}`} style={{ "--warning-position": `${result.warningDate ? position(result.warningDate) : 100}%`, "--withdrawal-position": `${position(result.withdrawalDate)}%` } as CSSProperties}>
      <span className="store-timeline-today" role="img" aria-label={`${todayLabel} ${formatDisplayDate(today)}`} title={formatDisplayDate(today)} data-outside={outside} data-align={todayPosition < 20 ? "start" : todayPosition > 80 ? "end" : "center"} style={{ left: `${todayPosition}%` }}><span>{todayLabel}</span></span>
      {dates.map(date => <div key={date} className="store-timeline-milestone" style={{ left: `${position(date)}%` }}>
        <i className={`milestone-${milestones.find(m => m.date === date)?.index}${date === result.withdrawalDate ? " is-emphasized" : ""}`} aria-hidden="true" />
        <time dateTime={date} title={formatDisplayDate(date)} aria-label={formatDisplayDate(date)}>{formatDisplayDate(date).slice(0, 5)}</time>
        <small className={`milestone-${milestones.find(m => m.date === date)?.index}`}>{milestones.filter(m => m.date === date).map(m => m.label).join(" / ")}</small>
      </div>)}
    </div>
  </div>;
}
