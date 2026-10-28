import { addDays, formatDisplayDate, parseDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";

export type HistoryDateRange = { from: string; to: string };
export const EMPTY_HISTORY_DATE_RANGE: HistoryDateRange = { from: "", to: "" };
export const HISTORY_DATE_SHORTCUTS = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "week", label: "Tuần này" },
] as const;

export function historyDateShortcut(shortcut: typeof HISTORY_DATE_SHORTCUTS[number]["value"], now: Date): HistoryDateRange {
  const today = formatBusinessDate(now).iso;
  let from = today;
  let to = today;
  if (shortcut === "yesterday") from = to = addDays(today, -1);
  if (shortcut === "week") {
    const mondayOffset = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
    from = addDays(today, -mondayOffset);
    to = addDays(from, 6);
  }
  return { from: formatDisplayDate(from), to: formatDisplayDate(to) };
}

export function parseHistoryDateRange(range: HistoryDateRange) {
  let from: LocalDate | null = null;
  let to: LocalDate | null = null;
  try {
    from = range.from ? parseDisplayDate(range.from) : null;
    to = range.to ? parseDisplayDate(range.to) : null;
  } catch {
    return { from, to, error: "Nhập ngày hợp lệ theo dd/mm/yyyy." };
  }
  return { from, to, error: from && to && from > to ? "Đến ngày phải bằng hoặc sau Từ ngày." : "" };
}

export function matchesHistoryDateRange(detectedDate: string, range: ReturnType<typeof parseHistoryDateRange>) {
  if (range.error) return false;
  if (!range.from && !range.to) return true;
  try {
    const date = parseDisplayDate(detectedDate);
    return (!range.from || date >= range.from) && (!range.to || date <= range.to);
  } catch {
    return false;
  }
}
