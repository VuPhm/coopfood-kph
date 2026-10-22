import { KPH_OPTIONS, type ConditionCode, type ResolutionCode } from "@coopfood-kph/kph-rules";
import { ListLabel, type ListLabelTone } from "@coopfood-kph/ui";
import { ArrowLeftRight, Ban, CalendarX2, CircleCheck, CircleHelp, CircleMinus, Clock3, TriangleAlert, Undo2, type LucideIcon } from "lucide-react";

import { approvalLabels, type ApprovalStatus } from "./record-view";

export type KphLabelKind = "condition" | "resolution" | "approval";
type Presentation = { tone: ListLabelTone; icon: LucideIcon };
const neutral: Presentation = { tone: "neutral", icon: CircleHelp };
const conditions: Record<ConditionCode, Presentation> = {
  NEAR_EXPIRY: { tone: "warning", icon: Clock3 },
  EXPIRED: { tone: "danger", icon: CalendarX2 },
  TORN_PACKAGING: { tone: "warning", icon: TriangleAlert },
  VACUUM_LEAK: { tone: "warning", icon: TriangleAlert },
  BRUISED_WATERLOGGED: { tone: "warning", icon: TriangleAlert },
  ROTTEN_MOLDY: { tone: "warning", icon: TriangleAlert },
  OTHER: neutral,
};
const resolutions: Record<ResolutionCode, Presentation> = {
  CANCEL: { tone: "neutral", icon: Ban },
  EXCHANGE: { tone: "info", icon: ArrowLeftRight },
  RETURN: { tone: "process", icon: Undo2 },
  OTHER: neutral,
};
const approvals: Record<ApprovalStatus, Presentation> = {
  PENDING: { tone: "warning", icon: Clock3 },
  APPROVED: { tone: "success", icon: CircleCheck },
  REJECTED: { tone: "neutral", icon: CircleMinus },
};
const categories: Record<KphLabelKind, string> = { condition: "Tình trạng", resolution: "Biện pháp", approval: "Trạng thái duyệt" };
const normalize = (value: string) => value.normalize("NFC").trim().toLocaleUpperCase("vi");
const entries = Object.values(KPH_OPTIONS);
const aliases: Record<KphLabelKind, ReadonlyMap<string, Presentation>> = {
  condition: new Map(entries.flatMap(set => set.conditions.flatMap(choice => [
    [normalize(choice.value), conditions[choice.value]], [normalize(choice.label), conditions[choice.value]],
  ] as const))),
  resolution: new Map(entries.flatMap(set => set.resolutions.flatMap(choice => [
    [normalize(choice.value), resolutions[choice.value]], [normalize(choice.label), resolutions[choice.value]],
  ] as const))),
  approval: new Map((Object.keys(approvals) as ApprovalStatus[]).flatMap(value => [
    [normalize(value), approvals[value]], [normalize(approvalLabels[value]), approvals[value]],
  ] as const)),
};

// Presentation only. Unknown/OTHER free text stays verbatim and receives no inferred status.
export function getKphLabelPresentation(kind: KphLabelKind, value: string): Presentation {
  return aliases[kind].get(normalize(value)) ?? neutral;
}

export function KphListLabel({ kind, value, className }: { kind: KphLabelKind; value: string; className?: string }) {
  const { tone, icon: Icon } = getKphLabelPresentation(kind, value);
  return <ListLabel tone={tone} category={categories[kind]} title={`${categories[kind]}: ${value}`}
    data-label-kind={kind} data-custom-detail={(kind !== "approval" && !aliases[kind].has(normalize(value))) || undefined} className={className} icon={<Icon />}>{value}</ListLabel>;
}
