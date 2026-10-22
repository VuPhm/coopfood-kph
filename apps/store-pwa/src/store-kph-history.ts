import { formatBusinessDate } from "./business-date";
import type { RecordView } from "./record-view";

export const KPH_BATCH_SIZE = 25;
export const KPH_DATE_SHORTCUTS = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "week", label: "Tuần này" },
] as const;
export type KphDateShortcut = typeof KPH_DATE_SHORTCUTS[number]["value"];

// Anchor to the Vietnamese business day before doing calendar arithmetic in UTC.
export function kphDateRange(shortcut: KphDateShortcut, now = new Date()) {
  const today = formatBusinessDate(now).iso;
  const date = new Date(`${today}T00:00:00Z`);
  const display = (value: Date) => value.toISOString().slice(0, 10).split("-").reverse().join("/");
  if (shortcut === "yesterday") date.setUTCDate(date.getUTCDate() - 1);
  const to = display(date);
  if (shortcut === "week") date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return { from: display(date), to };
}

// Keep the global sort, including name order. A date can recur when sorted by name.
export function kphDateRuns(records: RecordView[]) {
  const groups: { date: string; records: RecordView[] }[] = [];
  for (const record of records) {
    const last = groups.at(-1);
    if (last?.date === record.detectedDate) last.records.push(record);
    else groups.push({ date: record.detectedDate, records: [record] });
  }
  return groups;
}
