import { addDays, addMonths, formatDisplayDate, parseDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import { Input, cn } from "@coopfood-kph/ui";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatDateEntry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function tryParseDate(value: string) {
  try {
    return parseDisplayDate(value);
  } catch {
    return null;
  }
}

function firstDayOfMonth(value: LocalDate): LocalDate {
  return `${value.slice(0, 7)}-01` as LocalDate;
}

type CalendarInputProps = {
  id: string;
  initialMonth: LocalDate;
  label: string;
  onValueChange: (value: string) => void;
  readOnly?: boolean;
  value: string;
};

export function CalendarInput({ id, initialMonth, label, onValueChange, readOnly, value }: CalendarInputProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<LocalDate>(firstDayOfMonth(initialMonth));
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest(`[data-calendar-input="${id}"]`)) return;
      setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [id, open]);

  function toggleCalendar() {
    if (!open) setMonth(firstDayOfMonth(tryParseDate(value) ?? initialMonth));
    setOpen((current) => !current);
  }

  function selectDate(selected: LocalDate) {
    onValueChange(formatDisplayDate(selected));
    setOpen(false);
  }

  return (
    <div className="relative" data-calendar-input={id}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onValueChange(formatDateEntry(event.target.value))}
        inputMode="numeric"
        maxLength={10}
        placeholder="dd/mm/yyyy"
        readOnly={readOnly}
        aria-readonly={readOnly}
        className={cn("pr-12 tabular-nums", readOnly && "text-ink-muted")}
      />
      <button
        ref={triggerRef}
        type="button"
        className="field-input-action expiry-calendar-trigger"
        aria-label={`Chọn ${label.toLowerCase()}`}
        aria-expanded={open}
        onClick={toggleCalendar}
        disabled={readOnly}
      >
        <CalendarDays size={18} aria-hidden="true" />
      </button>
      {open ? <CalendarPopover month={month} selected={tryParseDate(value)} onMonthChange={setMonth} onSelect={selectDate} /> : null}
    </div>
  );
}

function CalendarPopover({ month, onMonthChange, onSelect, selected }: { month: LocalDate; onMonthChange: (value: LocalDate) => void; onSelect: (value: LocalDate) => void; selected: LocalDate | null }) {
  const monthDate = new Date(`${month}T00:00:00Z`);
  const mondayOffset = (monthDate.getUTCDay() + 6) % 7;
  const start = addDays(month, -mondayOffset);
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const monthKey = month.slice(0, 7);

  return (
    <div className="expiry-calendar" role="dialog" aria-label="Lịch chọn ngày">
      <header>
        <button type="button" aria-label="Tháng trước" onClick={() => onMonthChange(firstDayOfMonth(addMonths(month, -1)))}><ChevronLeft size={18} aria-hidden="true" /></button>
        <strong>{new Intl.DateTimeFormat("vi-VN", { month: "long", timeZone: "UTC", year: "numeric" }).format(monthDate)}</strong>
        <button type="button" aria-label="Tháng sau" onClick={() => onMonthChange(firstDayOfMonth(addMonths(month, 1)))}><ChevronRight size={18} aria-hidden="true" /></button>
      </header>
      <div className="expiry-calendar-grid expiry-calendar-weekdays" aria-hidden="true">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="expiry-calendar-grid">
        {days.map((day) => {
          const dayDate = new Date(`${day}T00:00:00Z`);
          const dayLabel = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", timeZone: "UTC", year: "numeric" }).format(dayDate);
          return <button key={day} type="button" className={cn(day.slice(0, 7) !== monthKey && "is-outside", selected === day && "is-selected")} aria-label={dayLabel} aria-pressed={selected === day} onClick={() => onSelect(day)}>{dayDate.getUTCDate()}</button>;
        })}
      </div>
    </div>
  );
}
