import type { ComponentProps } from "react";
import type { KphKind } from "@coopfood-kph/kph-rules";
import { ChevronRight, Leaf, PackagePlus } from "lucide-react";

// One control for the live workspace and its loading frame.
export function KphCreateButton({ kind, className = "", ...props }: ComponentProps<"button"> & { kind: KphKind }) {
  const label = kind === "TPCN" ? "TP khô & khác" : "TP tươi sống";
  const Icon = kind === "TPCN" ? PackagePlus : Leaf;
  return <button type="button" className={`store-create-cta store-create-inline create-${kind.toLowerCase()} ${className}`} aria-label={`Tạo phiếu ${label}`} title={`Tạo phiếu ${label}`} aria-haspopup="dialog" {...props}>
    <Icon size={20} aria-hidden="true" /><span>Tạo {kind}</span><ChevronRight className="store-create-chevron" size={16} aria-hidden="true" />
  </button>;
}
