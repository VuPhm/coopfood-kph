const businessDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

const businessDatePartFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatBusinessDate(now: Date) {
  const parts = Object.fromEntries(
    businessDatePartFormatter.formatToParts(now).map(({ type, value }) => [type, value]),
  );

  return {
    display: businessDateFormatter.format(now),
    iso: `${parts.year}-${parts.month}-${parts.day}` as LocalDate,
  };
}
import type { LocalDate } from "@coopfood-kph/kph-rules";
