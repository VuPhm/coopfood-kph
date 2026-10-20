import { formatDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";

const businessDatePartFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
  calendar: "gregory",
  numberingSystem: "latn",
});

export function formatBusinessDate(now: Date) {
  const parts = Object.fromEntries(
    businessDatePartFormatter.formatToParts(now).map(({ type, value }) => [type, value]),
  ) as Record<"year" | "month" | "day", string>;
  const iso = `${parts.year.padStart(4, "0")}-${parts.month.padStart(2, "0")}-${parts.day.padStart(2, "0")}` as LocalDate;

  return {
    // Form data must use the contract format, independent of browser locale literals.
    display: formatDisplayDate(iso),
    iso,
  };
}
