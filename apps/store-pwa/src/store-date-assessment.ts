import { calculateShelfLife, daysBetween, parseDisplayDate, type LocalDate, type ShelfLifeResult } from "@coopfood-kph/kph-rules";

export type DatePhase = "SAFE" | "WARNING" | "DANGER" | "EXPIRED" | "BEFORE_NSX" | "MISSING" | "INVALID";
export const DATE_PHASE_LABELS: Record<DatePhase, string> = {
  SAFE: "Chưa cảnh báo", WARNING: "Cảnh báo", DANGER: "Đến hạn lùi", EXPIRED: "Hết HSD",
  BEFORE_NSX: "Chưa đến NSX", MISSING: "Thiếu NSX", INVALID: "Ngày không hợp lệ",
};
export type DateAssessment = { phase: DatePhase; nsx: LocalDate | null; result: ShelfLifeResult | null; remainingDays: number | null; message: string };

export function assessDateLot({ manufactured, date }: { manufactured?: string | undefined; date: LocalDate }, today: LocalDate): DateAssessment {
  let remainingDays: number | null = null;
  try {
    remainingDays = daysBetween(today, date);
    if (!manufactured) return { phase: remainingDays < 0 ? "EXPIRED" : "MISSING", nsx: null, result: null, remainingDays,
      message: "Thiếu NSX để tính mốc cảnh báo và hạn lùi. HSD vẫn được giữ nguyên." };
    const nsx = parseDisplayDate(manufactured);
    const result = calculateShelfLife(nsx, date, today);
    return { phase: today < nsx ? "BEFORE_NSX" : result.status, nsx, result, remainingDays, message: "" };
  } catch (error) {
    return { phase: "INVALID", nsx: null, result: null, remainingDays, message: error instanceof Error ? error.message : "Kiểm tra NSX và HSD." };
  }
}

export function needsDateAttention(assessment: DateAssessment) {
  return assessment.phase !== "SAFE" && assessment.phase !== "BEFORE_NSX";
}
