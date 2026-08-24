import {
  addDays,
  addMonths,
  calculateShelfLife,
  daysBetween,
  expiryFromDays,
  expiryFromMonths,
  formatDisplayDate,
  manufactureFromDays,
  manufactureFromMonths,
  parseDisplayDate,
  type LocalDate,
  type ShelfLifeResult,
} from "@coopfood-kph/kph-rules";
import {
  Button,
  Input,
  cn,
} from "@coopfood-kph/ui";
import {
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";

type DurationSource = "date" | "days" | "months";
type CalendarTarget = "nsx" | "hsd";

const statusCopy = {
  SAFE: { label: "Còn an toàn", icon: ShieldCheck },
  WARNING: { label: "Sắp đến hạn lùi", icon: Clock3 },
  DANGER: { label: "Ngày lùi hàng", icon: CircleAlert },
  EXPIRED: { label: "Đã hết hạn sử dụng", icon: Ban },
} as const;

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

function positiveWholeNumber(value: string) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function firstDayOfMonth(value: LocalDate): LocalDate {
  return `${value.slice(0, 7)}-01` as LocalDate;
}

export function ExpiryWorkbench({ today = "2026-08-15" }: { today?: LocalDate }) {
  const [expanded, setExpanded] = useState(true);
  const [knownManufactureDate, setKnownManufactureDate] = useState(true);
  const [nsx, setNsx] = useState("");
  const [hsd, setHsd] = useState("");
  const [days, setDays] = useState("");
  const [months, setMonths] = useState("");
  const [durationSource, setDurationSource] = useState<DurationSource>("date");
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<LocalDate>(firstDayOfMonth(today));

  useEffect(() => {
    if (!calendarTarget) return;
    function closeCalendarOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest("[data-expiry-date-control]")) return;
      setCalendarTarget(null);
    }
    function closeCalendarOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCalendarTarget(null);
    }
    document.addEventListener("pointerdown", closeCalendarOnOutsidePointer);
    document.addEventListener("keydown", closeCalendarOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeCalendarOnOutsidePointer);
      document.removeEventListener("keydown", closeCalendarOnEscape);
    };
  }, [calendarTarget]);

  const liveState = useMemo(() => {
    const parsedNsx = tryParseDate(nsx);
    const parsedHsd = tryParseDate(hsd);
    const hasDuration = positiveWholeNumber(days) !== null || positiveWholeNumber(months) !== null;
    if (!parsedNsx || !parsedHsd || (!knownManufactureDate && !hasDuration)) {
      const completeButInvalid = [nsx, hsd].find((value) => value.length === 10 && !tryParseDate(value));
      return completeButInvalid
        ? { error: "Ngày không hợp lệ. Hãy kiểm tra lại theo định dạng dd/mm/yyyy.", result: null }
        : { error: "", result: null };
    }

    try {
      return { error: "", result: calculateShelfLife(parsedNsx, parsedHsd, today) };
    } catch (caught) {
      return {
        error: caught instanceof Error ? caught.message : "Không thể tra cứu thời hạn.",
        result: null,
      };
    }
  }, [days, hsd, knownManufactureDate, months, nsx, today]);

  function syncFromKnownNsx(nextNsx: string, source = durationSource) {
    const parsedNsx = tryParseDate(nextNsx);
    if (!parsedNsx) return;

    if (source === "days") {
      const duration = positiveWholeNumber(days);
      if (duration) setHsd(formatDisplayDate(expiryFromDays(parsedNsx, duration)));
      return;
    }
    if (source === "months") {
      const duration = positiveWholeNumber(months);
      if (duration) {
        const nextHsd = expiryFromMonths(parsedNsx, duration);
        setHsd(formatDisplayDate(nextHsd));
        setDays(String(daysBetween(parsedNsx, nextHsd) + 1));
      }
      return;
    }

    const parsedHsd = tryParseDate(hsd);
    if (parsedHsd) {
      const inclusiveDays = daysBetween(parsedNsx, parsedHsd) + 1;
      setDays(inclusiveDays > 0 ? String(inclusiveDays) : "");
    }
  }

  function changeNsx(value: string) {
    const nextValue = formatDateEntry(value);
    setNsx(nextValue);
    if (knownManufactureDate) syncFromKnownNsx(nextValue);
  }

  function changeHsd(value: string) {
    const nextValue = formatDateEntry(value);
    setHsd(nextValue);
    setDurationSource("date");
    setMonths("");

    const parsedHsd = tryParseDate(nextValue);
    if (!parsedHsd) return;
    const parsedNsx = tryParseDate(nsx);
    if (knownManufactureDate && parsedNsx) {
      const inclusiveDays = daysBetween(parsedNsx, parsedHsd) + 1;
      setDays(inclusiveDays > 0 ? String(inclusiveDays) : "");
      return;
    }
    if (!knownManufactureDate) deriveNsxFromDuration(parsedHsd, days, months, durationSource);
  }

  function deriveNsxFromDuration(parsedHsd: LocalDate, nextDays: string, nextMonths: string, source: DurationSource) {
    if (source === "months") {
      const duration = positiveWholeNumber(nextMonths);
      if (duration) {
        const nextNsx = manufactureFromMonths(parsedHsd, duration);
        setNsx(formatDisplayDate(nextNsx));
        setDays(String(daysBetween(nextNsx, parsedHsd) + 1));
      }
      return;
    }

    const duration = positiveWholeNumber(nextDays);
    if (duration) setNsx(formatDisplayDate(manufactureFromDays(parsedHsd, duration)));
  }

  function changeDays(value: string) {
    const nextValue = value.replace(/\D/g, "").slice(0, 4);
    setDays(nextValue);
    setMonths("");
    setDurationSource("days");
    const duration = positiveWholeNumber(nextValue);
    if (!duration) return;

    if (knownManufactureDate) {
      const parsedNsx = tryParseDate(nsx);
      if (parsedNsx) setHsd(formatDisplayDate(expiryFromDays(parsedNsx, duration)));
    } else {
      const parsedHsd = tryParseDate(hsd);
      if (parsedHsd) setNsx(formatDisplayDate(manufactureFromDays(parsedHsd, duration)));
    }
  }

  function changeMonths(value: string) {
    const nextValue = value.replace(/\D/g, "").slice(0, 3);
    setMonths(nextValue);
    setDurationSource("months");
    const duration = positiveWholeNumber(nextValue);
    if (!duration) return;

    if (knownManufactureDate) {
      const parsedNsx = tryParseDate(nsx);
      if (parsedNsx) {
        const nextHsd = expiryFromMonths(parsedNsx, duration);
        setHsd(formatDisplayDate(nextHsd));
        setDays(String(daysBetween(parsedNsx, nextHsd) + 1));
      }
    } else {
      const parsedHsd = tryParseDate(hsd);
      if (parsedHsd) {
        const nextNsx = manufactureFromMonths(parsedHsd, duration);
        setNsx(formatDisplayDate(nextNsx));
        setDays(String(daysBetween(nextNsx, parsedHsd) + 1));
      }
    }
  }

  function toggleMode() {
    const nextKnown = !knownManufactureDate;
    setKnownManufactureDate(nextKnown);
    if (!nextKnown) {
      const parsedHsd = tryParseDate(hsd);
      if (parsedHsd) deriveNsxFromDuration(parsedHsd, days, months, durationSource);
    } else {
      syncFromKnownNsx(nsx);
    }
  }

  function reset() {
    setKnownManufactureDate(true);
    setNsx("");
    setHsd("");
    setDays("");
    setMonths("");
    setDurationSource("date");
    setCalendarTarget(null);
  }

  function openCalendar(target: CalendarTarget) {
    const selected = tryParseDate(target === "nsx" ? nsx : hsd) ?? today;
    setCalendarMonth(firstDayOfMonth(selected));
    setCalendarTarget((current) => current === target ? null : target);
  }

  function chooseCalendarDate(value: LocalDate) {
    if (calendarTarget === "nsx") changeNsx(formatDisplayDate(value));
    if (calendarTarget === "hsd") changeHsd(formatDisplayDate(value));
    setCalendarTarget(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function toggleWorkbench() {
    setExpanded((current) => {
      if (current) setCalendarTarget(null);
      return !current;
    });
  }

  return (
    <aside className={cn("expiry-workbench", !expanded && "is-collapsed")} aria-label="Tra hạn nhanh">
      <button
        type="button"
        className="expiry-workbench-toggle"
        aria-controls="expiry-workbench-content"
        aria-expanded={expanded}
        onClick={toggleWorkbench}
      >
        {expanded ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        <span>{expanded ? "Ẩn tra hạn" : "Hiện tra hạn"}</span>
      </button>

      {expanded ? <div id="expiry-workbench-content" className="expiry-workbench-body">
        <form className="expiry-form" onSubmit={submit} aria-label="Thông tin hạn sử dụng và tra cứu">
          <section className="expiry-focus-zone">
            <DateControl
              id="lookup-nsx"
              label="Ngày sản xuất"
              value={nsx}
              readOnly={!knownManufactureDate}
              calendarOpen={calendarTarget === "nsx"}
              calendarMonth={calendarMonth}
              onCalendarMonthChange={setCalendarMonth}
              onCalendarToggle={() => openCalendar("nsx")}
              onCalendarSelect={chooseCalendarDate}
              onChange={changeNsx}
              action={(
              <button type="button" role="switch" aria-checked={knownManufactureDate} className="expiry-switch" onClick={toggleMode}>
                <span>{knownManufactureDate ? "Đã biết" : "Chưa biết"}</span>
                <i aria-hidden="true" />
              </button>
              )}
            />
            <DateControl
              id="lookup-hsd"
              label="Hạn sử dụng (HSD)"
              value={hsd}
              calendarOpen={calendarTarget === "hsd"}
              calendarMonth={calendarMonth}
              onCalendarMonthChange={setCalendarMonth}
              onCalendarToggle={() => openCalendar("hsd")}
              onCalendarSelect={chooseCalendarDate}
              onChange={changeHsd}
            />

            <div className="expiry-or"><span>hoặc nhập thời hạn</span></div>
            <div className="expiry-duration-grid">
              <DurationControl id="lookup-days" label="HSD (Số ngày)" suffix="ngày" value={days} onChange={changeDays} />
              <DurationControl id="lookup-months" label="HSD (Số tháng)" suffix="tháng" value={months} onChange={changeMonths} />
            </div>

            <div className="expiry-actions">
              <Button type="submit"><Search size={17} aria-hidden="true" />Tra cứu</Button>
              <Button type="button" variant="ghost" onClick={reset}><RotateCcw size={17} aria-hidden="true" />Làm mới</Button>
            </div>
          </section>
        </form>

        <LookupResult error={liveState.error} hsd={tryParseDate(hsd)} nsx={tryParseDate(nsx)} result={liveState.result} today={today} />
      </div> : null}
    </aside>
  );
}

type DateControlProps = {
  action?: ReactNode;
  id: string;
  label: string;
  value: string;
  readOnly?: boolean;
  calendarOpen: boolean;
  calendarMonth: LocalDate;
  onCalendarMonthChange: (value: LocalDate) => void;
  onCalendarSelect: (value: LocalDate) => void;
  onCalendarToggle: () => void;
  onChange: (value: string) => void;
};

function DateControl({ action, calendarMonth, calendarOpen, id, label, onCalendarMonthChange, onCalendarSelect, onCalendarToggle, onChange, readOnly, value }: DateControlProps) {
  return (
    <div className="expiry-field" data-expiry-date-control>
      <div className="expiry-field-heading">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="numeric"
          maxLength={10}
          placeholder="dd/mm/yyyy"
          readOnly={readOnly}
          aria-readonly={readOnly}
          className={cn("pr-12 tabular-nums", readOnly && "text-ink-muted")}
        />
        <button type="button" className="expiry-calendar-trigger" aria-label={`Chọn ${label.toLowerCase()}`} aria-expanded={calendarOpen} onClick={onCalendarToggle} disabled={readOnly}>
          <CalendarDays size={18} aria-hidden="true" />
        </button>
        {calendarOpen ? (
          <CalendarPopover
            month={calendarMonth}
            selected={tryParseDate(value)}
            onMonthChange={onCalendarMonthChange}
            onSelect={onCalendarSelect}
          />
        ) : null}
      </div>
    </div>
  );
}

function DurationControl({ id, label, onChange, suffix, value }: { id: string; label: string; onChange: (value: string) => void; suffix: string; value: string }) {
  return (
    <div className="expiry-field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} inputMode="numeric" placeholder={suffix === "ngày" ? "Ví dụ: 30" : "Ví dụ: 3"} className="pr-16 tabular-nums" />
        <span className="expiry-input-suffix">{suffix}</span>
      </div>
    </div>
  );
}

function CalendarPopover({ month, onMonthChange, onSelect, selected }: { month: LocalDate; onMonthChange: (value: LocalDate) => void; onSelect: (value: LocalDate) => void; selected: LocalDate | null }) {
  const monthDate = new Date(`${month}T00:00:00Z`);
  const mondayOffset = (monthDate.getUTCDay() + 6) % 7;
  const gridStart = addDays(month, -mondayOffset);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const monthKey = month.slice(0, 7);
  const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", timeZone: "UTC", year: "numeric" }).format(monthDate);

  return (
    <div className="expiry-calendar" role="dialog" aria-label="Lịch chọn ngày">
      <header>
        <button type="button" aria-label="Tháng trước" onClick={() => onMonthChange(firstDayOfMonth(addMonths(month, -1)))}><ChevronLeft size={18} aria-hidden="true" /></button>
        <strong>{monthLabel}</strong>
        <button type="button" aria-label="Tháng sau" onClick={() => onMonthChange(firstDayOfMonth(addMonths(month, 1)))}><ChevronRight size={18} aria-hidden="true" /></button>
      </header>
      <div className="expiry-calendar-grid expiry-calendar-weekdays" aria-hidden="true">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="expiry-calendar-grid">{days.map((day) => {
        const dayDate = new Date(`${day}T00:00:00Z`);
        const label = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", timeZone: "UTC", year: "numeric" }).format(dayDate);
        return <button key={day} type="button" className={cn(day.slice(0, 7) !== monthKey && "is-outside", selected === day && "is-selected")} aria-label={label} aria-pressed={selected === day} onClick={() => onSelect(day)}>{dayDate.getUTCDate()}</button>;
      })}</div>
    </div>
  );
}

function LookupResult({ error, hsd, nsx, result, today }: { error: string; hsd: LocalDate | null; nsx: LocalDate | null; result: ShelfLifeResult | null; today: LocalDate }) {
  if (error) {
    return (
      <section className="expiry-result is-error" role="alert">
        <div className="expiry-result-summary"><span className="expiry-result-icon" aria-hidden="true"><CircleAlert /></span><div><p>Không thể tra cứu</p><strong>Kiểm tra dữ liệu đã nhập</strong><small>{error}</small></div></div>
      </section>
    );
  }

  if (!result || !nsx || !hsd) {
    return (
      <section className="expiry-result is-placeholder" aria-live="polite">
        <div className="expiry-result-summary"><span className="expiry-result-icon" aria-hidden="true"><CalendarDays /></span><div><p>Sẵn sàng tra cứu</p><strong>Chưa nhập đủ dữ liệu</strong><small>Điền NSX và một thông tin HSD để xác định bốn mốc thời hạn.</small></div></div>
      </section>
    );
  }

  const copy = statusCopy[result.status];
  const StatusIcon = copy.icon;
  const mainDate = result.status === "EXPIRED" ? hsd : result.withdrawalDate;
  const daysToHsd = daysBetween(today, hsd);
  const daysToWithdrawal = daysBetween(today, result.withdrawalDate);
  const detail = result.status === "EXPIRED"
    ? `Đã qua HSD ${Math.abs(daysToHsd)} ngày`
    : result.status === "DANGER"
      ? `${daysToWithdrawal < 0 ? `Đã qua hạn lùi ${Math.abs(daysToWithdrawal)} ngày` : "Đến hạn lùi hàng"} · HSD còn ${Math.max(0, daysToHsd)} ngày`
      : `${daysToWithdrawal} ngày đến hạn lùi · Vòng đời ${result.shelfLifeDays} ngày`;

  return (
    <section className={cn("expiry-result", `is-${result.status.toLowerCase()}`)} aria-live="polite">
      <div className="expiry-result-summary">
        <span className="expiry-result-icon" aria-hidden="true"><StatusIcon /></span>
        <div><p>{copy.label}</p><strong>{formatDisplayDate(mainDate)}</strong><small>{detail}</small></div>
      </div>
      <Timeline hsd={hsd} nsx={nsx} result={result} today={today} />
    </section>
  );
}

function Timeline({ hsd, nsx, result, today }: { hsd: LocalDate; nsx: LocalDate; result: ShelfLifeResult; today: LocalDate }) {
  const totalDays = Math.max(1, daysBetween(nsx, hsd));
  const position = (value: LocalDate) => Math.min(100, Math.max(0, daysBetween(nsx, value) / totalDays * 100));
  const todayInRange = daysBetween(nsx, today) >= 0 && daysBetween(today, hsd) >= 0;
  const style = {
    "--warning-at": `${result.warningDate ? position(result.warningDate) : position(result.withdrawalDate)}%`,
    "--withdrawal-at": `${position(result.withdrawalDate)}%`,
    "--today-at": `${position(today)}%`,
  } as CSSProperties;
  const milestones = [
    { date: nsx, label: "NSX", kind: "start", at: 0 },
    { date: result.warningDate, label: "Cảnh báo", kind: "warning", at: result.warningDate ? position(result.warningDate) : position(result.withdrawalDate) },
    { date: result.withdrawalDate, label: "Hạn lùi", kind: "withdrawal", at: position(result.withdrawalDate) },
    { date: hsd, label: "HSD", kind: "end", at: 100 },
  ];

  return (
    <div className="expiry-timeline" style={style} aria-label="Bốn mốc thời hạn">
      <div className="expiry-timeline-scroll">
        <div className="expiry-timeline-track">
          <div className="expiry-timeline-line" aria-hidden="true">{todayInRange ? <span className="expiry-today-marker">Hôm nay</span> : null}</div>
          <div className="expiry-milestones">{milestones.map((milestone) => (
            <div
              key={milestone.label}
              className={cn("expiry-milestone", `is-${milestone.kind}`)}
              style={{ "--milestone-at": `${milestone.at}%` } as CSSProperties}
            >
              <i aria-hidden="true" />
              <strong>{milestone.date ? formatDisplayDate(milestone.date).slice(0, 5) : "—"}</strong>
              <span>{milestone.label}</span>
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  );
}
