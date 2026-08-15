export type LocalDate = `${number}-${number}-${number}`;

const DAY_MS = 86_400_000;

function parts(value: LocalDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Ngày không hợp lệ: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  if (instant.getUTCFullYear() !== year || instant.getUTCMonth() !== month - 1 || instant.getUTCDate() !== day) {
    throw new Error(`Ngày không hợp lệ: ${value}`);
  }
  return { year, month, day, epoch: instant.getTime() };
}

export function parseDisplayDate(value: string): LocalDate {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) throw new Error("Ngày phải theo định dạng dd/mm/yyyy");
  const result = `${match[3]}-${match[2]}-${match[1]}` as LocalDate;
  parts(result);
  return result;
}

export function formatDisplayDate(value: LocalDate) {
  const { year, month, day } = parts(value);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function addDays(value: LocalDate, amount: number): LocalDate {
  const { epoch } = parts(value);
  const result = new Date(epoch + amount * DAY_MS);
  return result.toISOString().slice(0, 10) as LocalDate;
}

export function daysBetween(start: LocalDate, end: LocalDate) {
  return Math.round((parts(end).epoch - parts(start).epoch) / DAY_MS);
}

export type ExpiryStatus = "SAFE" | "WARNING" | "DANGER" | "EXPIRED";

export type ShelfLifeResult = {
  shelfLifeDays: number;
  rounded20PercentDays: number;
  rounded40PercentDays: number;
  withdrawalOffsetDays: number;
  warningWindowDays: number;
  warningDate: LocalDate | null;
  withdrawalDate: LocalDate;
  status: ExpiryStatus;
};

export function calculateShelfLife(nsx: LocalDate, hsd: LocalDate, today: LocalDate): ShelfLifeResult {
  const exclusiveDays = daysBetween(nsx, hsd);
  if (exclusiveDays <= 0) throw new Error("HSD phải sau NSX");

  const shelfLifeDays = exclusiveDays + 1;
  const rounded20PercentDays = Math.round(shelfLifeDays * 0.2);
  const rounded40PercentDays = Math.round(shelfLifeDays * 0.4);
  const withdrawalOffsetDays = shelfLifeDays < 10 ? 0 : rounded20PercentDays;
  const warningWindowDays = shelfLifeDays < 10
    ? 0
    : rounded40PercentDays - withdrawalOffsetDays;
  const withdrawalDate = addDays(hsd, -withdrawalOffsetDays);
  const warningDate = shelfLifeDays < 10 ? null : addDays(withdrawalDate, -warningWindowDays);

  let status: ExpiryStatus = "SAFE";
  if (daysBetween(hsd, today) > 0) status = "EXPIRED";
  else if (daysBetween(withdrawalDate, today) >= 0) status = "DANGER";
  else if (warningDate && daysBetween(warningDate, today) >= 0) status = "WARNING";

  return {
    shelfLifeDays,
    rounded20PercentDays,
    rounded40PercentDays,
    withdrawalOffsetDays,
    warningWindowDays,
    warningDate,
    withdrawalDate,
    status,
  };
}
