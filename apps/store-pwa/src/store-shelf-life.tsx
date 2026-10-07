import { useState, type CSSProperties } from "react";
import { Button, Input } from "@coopfood-kph/ui";
import { calculateShelfLife, daysBetween, expiryFromDays, expiryFromMonths, formatDisplayDate, manufactureFromDays, manufactureFromMonths, parseDisplayDate, type LocalDate, type ShelfLifeResult } from "@coopfood-kph/kph-rules";
import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { figmaAsset } from "./figma-assets";

export function ShelfLifeScreen() {
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
  return <div className={`store-shelf shelf-${state}`}>
    <form className="store-shelf-form" onSubmit={event => {
      event.preventDefault();
      try {
        const h = parseDisplayDate(hsd);
        if (!known && !Number(months) && !Number(days)) throw new Error("Nhập thời hạn theo số ngày hoặc số tháng để tính NSX");
        const n = known ? parseDisplayDate(nsx) : Number(months) ? manufactureFromMonths(h, Number(months)) : manufactureFromDays(h, Number(days));
        setResult({ nsx: n, hsd: h, value: calculateShelfLife(n, h, today) }); setError("");
      }
      catch (e) { setError(e instanceof Error ? e.message : "Kiểm tra ngày đã nhập"); setResult(null); }
    }}>
      <fieldset className="store-mode"><legend className="sr-only">Cách nhập ngày sản xuất</legend>{[true, false].map(value => <label key={String(value)} className={known === value ? "is-selected" : ""}>
        <input type="radio" name="shelf-mode" checked={known === value} onChange={() => { setKnown(value); setResult(null); setError(""); }} />
        <span><strong>{value ? "Biết NSX" : "Chưa biết NSX"}</strong><small>{value ? "Nhập trực tiếp" : "Tự tính từ HSD"}</small></span>
      </label>)}</fieldset>
      {known ? <div className="store-field"><label htmlFor="shelf-nsx">Ngày sản xuất</label><CalendarInput id="shelf-nsx" initialMonth={today} label="Ngày sản xuất" value={nsx} onValueChange={v => dates(v, hsd)} /></div> : null}
      <div className="store-field"><label htmlFor="shelf-hsd">Hạn sử dụng (HSD)</label><CalendarInput id="shelf-hsd" initialMonth={today} label="Hạn sử dụng" value={hsd} onValueChange={expiry} /></div>
      <div className="store-two-col">{(["days", "months"] as const).map(unit => <div className="store-field" key={unit}><label htmlFor={`shelf-${unit}`}>HSD (Số {unit === "days" ? "ngày" : "tháng"})</label><div className="store-duration"><Input id={`shelf-${unit}`} inputMode="numeric" value={unit === "days" ? days : months} onChange={e => duration(e.target.value, unit)} placeholder="—" /><span>{unit === "days" ? "ngày" : "tháng"}</span></div></div>)}</div>
      <div className="store-shelf-actions"><Button className="store-button" type="submit"><img src={figmaAsset("main-1", "imgFeatherSearch")} alt="" />Tra cứu</Button><Button className="store-button store-secondary" variant="ghost" type="button" onClick={() => { setNsx(""); setHsd(""); setDays(""); setMonths(""); setKnown(true); setError(""); setResult(null); }}><img src={figmaAsset("main-1", "imgFeatherRotateCcw")} alt="" />Làm mới</Button></div>
    </form>
    {error ? <p className="store-error" role="alert">{error}</p> : null}
    {result ? <section className="store-shelf-result" aria-live="polite">
      <span className={`store-chip chip-${state}`}>{result.value.status === "EXPIRED" ? "Đã hết hạn sử dụng" : result.value.status === "WARNING" ? "Cảnh báo lùi hàng" : "Ngày lùi hàng"}</span>
      <strong className="store-result-date">{formatDisplayDate(result.value.status === "EXPIRED" ? result.hsd : result.value.withdrawalDate)}</strong>
      <div className="store-result-facts"><div><small>{daysBetween(today, result.value.withdrawalDate) < 0 ? "Qua hạn lùi" : "Đến hạn lùi"}</small><strong>{Math.abs(daysBetween(today, result.value.withdrawalDate))} ngày</strong></div><div><small>{daysBetween(today, result.hsd) < 0 ? "Qua HSD" : "HSD còn"}</small><strong>{Math.abs(daysBetween(today, result.hsd))} ngày</strong></div></div>
      <ShelfLifeTimeline nsx={result.nsx} hsd={result.hsd} today={today} result={result.value} />
    </section> : <p className="store-muted store-shelf-empty">Nhập ngày để tra cứu hạn lùi hàng.</p>}
  </div>;
}


function ShelfLifeTimeline({ nsx, hsd, today, result }: { nsx: LocalDate; hsd: LocalDate; today: LocalDate; result: ShelfLifeResult }) {
  const span = daysBetween(nsx, hsd);
  const position = (date: LocalDate) => Math.max(0, Math.min(100, daysBetween(nsx, date) / span * 100));
  const warning = result.warningDate ? position(result.warningDate) : 100;
  const withdrawal = position(result.withdrawalDate);
  const milestones = [
    { label: "NSX", date: nsx, index: 0 },
    ...(result.warningDate ? [{ label: "Cảnh báo", date: result.warningDate, index: 1 }] : []),
    { label: "Hạn lùi", date: result.withdrawalDate, index: 2 },
    { label: "HSD", date: hsd, index: 3 },
  ];
  // Short shelf lives have withdrawal = expiry; share the endpoint to avoid overlap.
  const dates = [...new Set(milestones.map(m => m.date))];
  return <div className="store-timeline" aria-label="Mốc thời hạn và hôm nay">
    <div className="store-timeline-track" style={{ "--warning-position": `${warning}%`, "--withdrawal-position": `${withdrawal}%` } as CSSProperties}>
      <span className="store-timeline-today" role="img" aria-label={`Hôm nay ${formatDisplayDate(today)}`} title={`Hôm nay ${formatDisplayDate(today)}`} data-outside={today < nsx ? "before" : today > hsd ? "after" : undefined} style={{ left: `${position(today)}%` }} />
      {dates.map(date => <div key={date} className="store-timeline-milestone" style={{ left: `${position(date)}%` }}>
        <i className={`milestone-${milestones.find(m => m.date === date)?.index}`} aria-hidden="true" />
        <strong>{formatDisplayDate(date).slice(0, 5)}</strong>
        {milestones.filter(m => m.date === date).map(m => <small className={`milestone-${m.index}`} key={m.label}>{m.label}</small>)}
      </div>)}
    </div>
  </div>;
}
