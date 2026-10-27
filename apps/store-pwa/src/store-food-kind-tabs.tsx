import type { KphKind } from "@coopfood-kph/kph-rules";
import { StoreStickyTabs } from "./store-sticky-tabs";

export const FOOD_KIND_LABELS: Record<KphKind, string> = { TPCN: "TP khô & khác", TPTS: "TP tươi sống" };

// One kind selector for KPH live/loading and DATE; counts remain feature-owned.
export function StoreFoodKindTabs({ value, counts, onChange, disabled = false, label = "Loại thực phẩm" }: {
  value: KphKind | "unclassified";
  counts: Record<KphKind, number>;
  onChange?: (kind: KphKind) => void;
  disabled?: boolean;
  label?: string;
}) {
  return <StoreStickyTabs><div className="store-tabs" role="group" aria-label={label}>
    {(["TPCN", "TPTS"] as const).map(kind => <button key={kind} type="button" disabled={disabled}
      aria-pressed={value === kind} className={value === kind ? "is-active" : ""} onClick={() => onChange?.(kind)}>
      {FOOD_KIND_LABELS[kind]}<small>{counts[kind]}</small>
    </button>)}
  </div></StoreStickyTabs>;
}
