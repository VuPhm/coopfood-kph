import { useState } from "react";
import { cn } from "@coopfood-kph/ui";
import { RotateCcw } from "lucide-react";
import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { EMPTY_HISTORY_DATE_RANGE, HISTORY_DATE_SHORTCUTS, historyDateShortcut, parseHistoryDateRange, type HistoryDateRange } from "./history-date-filter";

export function HistoryDateControls({ range, onChange }: { range: HistoryDateRange; onChange: (range: HistoryDateRange) => void }) {
  const [draft, setDraft] = useState(range);
  const error = parseHistoryDateRange(draft).error;
  const today = formatBusinessDate(new Date()).iso;

  function change(next: HistoryDateRange) {
    setDraft(next);
    if (!parseHistoryDateRange(next).error) onChange(next);
  }

  return <section className="mobile-history-section history-date-section" aria-labelledby="history-date-title" aria-describedby="history-date-help">
    <header className="mobile-history-section-header">
      <h3 id="history-date-title">Ngày phát hiện</h3>
      <button type="button" className="mobile-history-section-reset" aria-label="Bỏ lọc ngày" disabled={!draft.from && !draft.to} onClick={() => change(EMPTY_HISTORY_DATE_RANGE)}>
        <RotateCcw aria-hidden="true" /><span>Bỏ lọc</span>
      </button>
    </header>
    <div className="mobile-history-choice-grid history-date-shortcuts" role="group" aria-label="Lọc nhanh theo ngày">
      {HISTORY_DATE_SHORTCUTS.map(({ value, label }) => {
        const shortcut = historyDateShortcut(value, new Date());
        const selected = draft.from === shortcut.from && draft.to === shortcut.to;
        return <button key={value} type="button" className={cn("mobile-history-choice", selected && "is-selected")} aria-pressed={selected} onClick={() => change(historyDateShortcut(value, new Date()))}>{label}</button>;
      })}
    </div>
    <div className="history-date-fields">
      {(["from", "to"] as const).map((key) => {
        const label = key === "from" ? "Từ ngày" : "Đến ngày";
        return <div key={key} className="history-date-field">
          <label htmlFor={`history-date-${key}`}>{label}</label>
          <CalendarInput id={`history-date-${key}`} initialMonth={today} label={label} value={draft[key]} onValueChange={(value) => change({ ...draft, [key]: value })} />
        </div>;
      })}
    </div>
    <p id="history-date-help" className="history-date-help">Có thể để trống một đầu. Tuần này: thứ Hai – Chủ nhật.</p>
    {error ? <p className="history-date-error" role="alert">{error} Bộ lọc ngày chưa áp dụng; danh sách giữ khoảng hợp lệ trước đó.</p> : null}
  </section>;
}
