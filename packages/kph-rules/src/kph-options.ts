export type KphKind = "TPCN" | "TPTS";
export type ConditionCode = "NEAR_EXPIRY" | "EXPIRED" | "DAMAGED" | "OTHER";
export type ResolutionCode = "CANCEL" | "EXCHANGE" | "RETURN" | "OTHER";

export type Choice<T extends string> = Readonly<{
  value: T;
  label: string;
  tone: "red" | "orange" | "green" | "blue" | "gray";
}>;

export type KphOptionSet = Readonly<{
  conditions: readonly Choice<ConditionCode>[];
  resolutions: readonly Choice<ResolutionCode>[];
  defaultCondition: ConditionCode;
  defaultResolution: ResolutionCode;
}>;

const commonConditions = {
  nearExpiry: { value: "NEAR_EXPIRY", label: "Cận date", tone: "orange" },
  expired: { value: "EXPIRED", label: "Hết HSD", tone: "gray" },
  other: { value: "OTHER", label: "Khác", tone: "gray" },
} as const;

const commonResolutions = {
  destroy: { value: "CANCEL", label: "HỦY", tone: "red" },
  other: { value: "OTHER", label: "KHÁC", tone: "gray" },
} as const;

export const KPH_OPTIONS: Readonly<Record<KphKind, KphOptionSet>> = {
  TPCN: {
    conditions: [commonConditions.nearExpiry, commonConditions.expired, commonConditions.other],
    resolutions: [
      commonResolutions.destroy,
      { value: "EXCHANGE", label: "ĐỔI", tone: "green" },
      { value: "RETURN", label: "XUẤT TRẢ", tone: "blue" },
      commonResolutions.other,
    ],
    defaultCondition: "NEAR_EXPIRY",
    defaultResolution: "CANCEL",
  },
  TPTS: {
    conditions: [
      { value: "DAMAGED", label: "Hư hỏng", tone: "red" },
      commonConditions.nearExpiry,
      commonConditions.expired,
      commonConditions.other,
    ],
    resolutions: [commonResolutions.destroy, commonResolutions.other],
    defaultCondition: "DAMAGED",
    defaultResolution: "CANCEL",
  },
};

export function resolveChoiceLabel<T extends string>(choice: Choice<T>, detail?: string) {
  if (choice.value !== "OTHER") return choice.label;
  return detail?.trim() || choice.label;
}

export type ChoiceTone = "orange" | "green" | "red" | "blue" | "gray";

export function getConditionTone(condition: string): ChoiceTone {
  const norm = condition.trim().toLowerCase();
  if (norm === "cận date" || norm === "near_expiry") return "orange";
  if (norm === "hư hỏng" || norm === "damaged") return "red";
  if (norm === "hết hsd" || norm === "expired") return "gray";
  return "gray";
}

export function getResolutionTone(resolution: string): ChoiceTone {
  const norm = resolution.trim().toUpperCase();
  if (norm === "HỦY" || norm === "CANCEL") return "red";
  if (norm === "ĐỔI" || norm === "EXCHANGE") return "green";
  if (norm === "XUẤT TRẢ" || norm === "RETURN") return "blue";
  return "gray";
}

export function getApprovalTone(status: string): ChoiceTone {
  const norm = status.trim().toUpperCase();
  if (norm === "PENDING" || norm === "CHỜ DUYỆT") return "orange";
  if (norm === "APPROVED" || norm === "ĐÃ DUYỆT") return "green";
  if (norm === "REJECTED" || norm === "KHÔNG DUYỆT") return "red";
  return "gray";
}
