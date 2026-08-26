export type KphKind = "TPCN" | "TPTS";
export type ConditionCode =
  | "NEAR_EXPIRY"
  | "EXPIRED"
  | "TORN_PACKAGING"
  | "VACUUM_LEAK"
  | "BRUISED_WATERLOGGED"
  | "ROTTEN_MOLDY"
  | "OTHER";
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
    conditions: [
      commonConditions.nearExpiry,
      commonConditions.expired,
      { value: "TORN_PACKAGING", label: "Rách bao bì", tone: "red" },
      { value: "VACUUM_LEAK", label: "Xì chân không", tone: "red" },
      commonConditions.other,
    ],
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
      { value: "BRUISED_WATERLOGGED", label: "Dập úng", tone: "red" },
      { value: "ROTTEN_MOLDY", label: "Thối mốc", tone: "red" },
      commonConditions.nearExpiry,
      commonConditions.expired,
      commonConditions.other,
    ],
    resolutions: [commonResolutions.destroy, commonResolutions.other],
    defaultCondition: "BRUISED_WATERLOGGED",
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
  if ([
    "rách bao bì",
    "torn_packaging",
    "xì chân không",
    "vacuum_leak",
    "dập úng",
    "bruised_waterlogged",
    "thối mốc",
    "rotten_moldy",
  ].includes(norm)) return "red";
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
