import { ListLabel, type ListLabelTone } from "@coopfood-kph/ui";
import { CalendarCheck, CalendarClock, CalendarX2, Check, CircleCheck, CircleHelp, Clock3, TriangleAlert, type LucideIcon } from "lucide-react";
import { DATE_PHASE_LABELS, type DatePhase } from "./store-date-assessment";
import type { MockDateLotStatus } from "./store-app-mock";

const phases: Record<DatePhase, { tone: ListLabelTone; icon: LucideIcon }> = {
  SAFE: { tone: "success", icon: CalendarCheck }, WARNING: { tone: "warning", icon: Clock3 },
  DANGER: { tone: "warning", icon: CalendarClock }, EXPIRED: { tone: "danger", icon: CalendarX2 },
  BEFORE_NSX: { tone: "info", icon: CalendarClock }, MISSING: { tone: "neutral", icon: CircleHelp },
  INVALID: { tone: "danger", icon: TriangleAlert },
};
export function DateConditionLabel({ phase }: { phase: DatePhase }) {
  const { tone, icon: Icon } = phases[phase];
  return <ListLabel tone={tone} category="DATE" title={`Tình trạng DATE: ${DATE_PHASE_LABELS[phase]}`}
    data-date-phase={phase} className="store-date-condition" icon={<Icon />}>{DATE_PHASE_LABELS[phase]}</ListLabel>;
}

export function getDatePhaseTone(phase: DatePhase): ListLabelTone { return phases[phase].tone; }

const processing: Record<MockDateLotStatus, { label: string; tone: ListLabelTone; icon: LucideIcon }> = {
  open: { label: "Mở", tone: "warning", icon: Clock3 },
  acknowledged: { label: "Đã ghi nhận", tone: "info", icon: Check },
  resolved: { label: "Đã xử lý", tone: "success", icon: CircleCheck },
};
export function DateProcessingLabel({ status }: { status: MockDateLotStatus }) {
  const { label, tone, icon: Icon } = processing[status];
  return <ListLabel tone={tone} category="Xử lý" title={`Trạng thái xử lý: ${label}`}
    data-processing-status={status} icon={<Icon />}>{label}</ListLabel>;
}
