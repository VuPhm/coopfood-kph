import type { ShelfLifeResult } from "@coopfood-kph/kph-rules";
import { ListLabel, type ListLabelTone } from "@coopfood-kph/ui";
import { CalendarCheck, CalendarClock, CalendarX2, Clock3, type LucideIcon } from "lucide-react";

const statuses: Record<ShelfLifeResult["status"], { label: string; tone: ListLabelTone; icon: LucideIcon }> = {
  SAFE: { label: "An toàn", tone: "success", icon: CalendarCheck },
  WARNING: { label: "Sắp đến hạn lùi", tone: "warning", icon: Clock3 },
  DANGER: { label: "Cần lùi hàng", tone: "warning", icon: CalendarClock },
  EXPIRED: { label: "Đã hết hạn sử dụng", tone: "danger", icon: CalendarX2 },
};
export function getShelfSnapshotTone(status: ShelfLifeResult["status"]) { return statuses[status].tone; }
export function ShelfSnapshotLabel({ status }: { status: ShelfLifeResult["status"] }) {
  const { label, tone, icon: Icon } = statuses[status];
  return <ListLabel tone={tone} category="Trạng thái lúc tra" title={`Trạng thái lúc tra: ${label}`}
    data-snapshot-status={status} icon={<Icon />}>{label}</ListLabel>;
}
