import { ListLabel, type ListLabelTone } from "@coopfood-kph/ui";
import { CalendarClock, CircleCheck, CircleMinus, Clock3, ShieldCheck, TriangleAlert, Upload, UserRoundCheck, UserRoundX, type LucideIcon } from "lucide-react";
import type { CatalogImportBatch, LifecycleSchedule } from "./lifecycle-admin";

type Presentation = { label: string; tone: ListLabelTone; icon: LucideIcon };
export function AdminListLabel({ category, presentation }: { category: string; presentation: Presentation }) {
  const { label, tone, icon: Icon } = presentation;
  return <ListLabel category={category} tone={tone} title={`${category}: ${label}`} icon={<Icon />}>{label}</ListLabel>;
}
export function userPresentation(active: boolean): Presentation {
  return active ? { label: "Đang hoạt động", tone: "success", icon: UserRoundCheck }
    : { label: "Đã vô hiệu hóa", tone: "neutral", icon: UserRoundX };
}
export function rolePresentation(role: "CHAIN_ADMIN" | "CATALOG_ADMIN"): Presentation {
  return { label: role === "CHAIN_ADMIN" ? "Quản trị chuỗi" : "Quản trị catalog",
    tone: role === "CHAIN_ADMIN" ? "process" : "info", icon: ShieldCheck };
}
export function schedulePresentation(status: LifecycleSchedule["status"], due: boolean): Presentation {
  if (status === "SCHEDULED") return due ? { label: "Đến hạn", tone: "warning", icon: Clock3 }
    : { label: "Đang chờ", tone: "process", icon: CalendarClock };
  if (status === "EXECUTED") return { label: "Đã thực thi", tone: "success", icon: CircleCheck };
  return { label: "Đã hủy", tone: "neutral", icon: CircleMinus };
}
export function batchPresentation(status: CatalogImportBatch["status"]): Presentation {
  if (status === "VALIDATED") return { label: "Hợp lệ", tone: "success", icon: CircleCheck };
  if (status === "REJECTED") return { label: "Có lỗi", tone: "danger", icon: TriangleAlert };
  if (status === "PUBLISHED") return { label: "Đã publish", tone: "info", icon: Upload };
  return { label: "Đang xử lý", tone: "process", icon: Clock3 };
}
export function rowPresentation(status: "VALID" | "WARNING" | "ERROR"): Presentation {
  if (status === "WARNING") return { label: "Cảnh báo", tone: "warning", icon: TriangleAlert };
  return status === "ERROR" ? { label: "Có lỗi", tone: "danger", icon: TriangleAlert }
    : { label: "Hợp lệ", tone: "success", icon: CircleCheck };
}
