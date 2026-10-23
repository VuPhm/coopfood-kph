import type { LocalDate } from "@coopfood-kph/kph-rules";
import { assessDateLot, type DateAssessment } from "./store-date-assessment";
import type { MockDateLot } from "./store-app-mock";

export const DATE_NOTICE_GROUPS = [
  { id: "expired", title: "Hết HSD", description: "Kiểm tra và lập phiếu KPH", tone: "danger" },
  { id: "withdrawal", title: "Đến hạn lùi", description: "Cần lùi hàng khỏi quầy", tone: "warning" },
  { id: "warning", title: "Cảnh báo", description: "Theo dõi hạn dùng của lô", tone: "warning" },
  { id: "dates", title: "Cần kiểm tra ngày", description: "Bổ sung hoặc kiểm tra NSX / HSD", tone: "neutral" },
  { id: "reminder", title: "Đến lịch báo lại", description: "Các lô đã hẹn cần xem lại", tone: "info" },
] as const;
export type DateNoticeGroupId = typeof DATE_NOTICE_GROUPS[number]["id"];
export type DateNotice = { lot: MockDateLot; assessment: DateAssessment };

// One current actionable notice per lot. This is a view of DATE, not an event history.
export function groupDateNotifications(lots: MockDateLot[], today: LocalDate) {
  const groups = DATE_NOTICE_GROUPS.map(group => ({ ...group, items: [] as DateNotice[] }));
  for (const lot of lots) {
    if (lot.status === "resolved") continue;
    const due = !!lot.remindOn && lot.remindOn <= today;
    if (lot.status === "acknowledged" && !due) continue;
    const assessment = assessDateLot(lot, today);
    const id: DateNoticeGroupId | undefined = due ? "reminder" :
      assessment.phase === "EXPIRED" ? "expired" : assessment.phase === "DANGER" ? "withdrawal" :
      assessment.phase === "WARNING" ? "warning" : assessment.phase === "MISSING" || assessment.phase === "INVALID" ? "dates" : undefined;
    if (id) groups.find(group => group.id === id)!.items.push({ lot, assessment });
  }
  for (const group of groups) group.items.sort((a, b) => {
    const dateA = group.id === "reminder" ? a.lot.remindOn! : a.lot.date;
    const dateB = group.id === "reminder" ? b.lot.remindOn! : b.lot.date;
    return dateA.localeCompare(dateB) || a.lot.id.localeCompare(b.lot.id);
  });
  return groups.filter(group => group.items.length > 0);
}
