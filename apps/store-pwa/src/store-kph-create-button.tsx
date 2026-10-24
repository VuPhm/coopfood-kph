import type { ComponentProps } from "react";
import type { KphKind } from "@coopfood-kph/kph-rules";
import { ChevronRight, Leaf, PackagePlus } from "lucide-react";
import { useStoreDensityValue } from "./store-density";

// One control for the live workspace and its loading frame.
export function KphCreateButton({ kind, className = "", ...props }: ComponentProps<"button"> & { kind: KphKind }) {
  const label = kind === "TPCN" ? "TP khô & khác" : "TP tươi sống";
  const Icon = kind === "TPCN" ? PackagePlus : Leaf;
  const compact = useStoreDensityValue() === "compact";
  if (compact) return <button type="button" className={`store-create-cta store-create-inline create-${kind.toLowerCase()} ${className}`} aria-label={`Tạo phiếu ${label}`} title={`Tạo phiếu ${label}`} aria-haspopup="dialog" {...props}>
    <Icon size={20} aria-hidden="true" /><span>Tạo {kind}</span>
  </button>;
  return <button type="button" className={`store-create-cta create-${kind.toLowerCase()} ${className}`} aria-label={`Tạo phiếu ${label}`} aria-haspopup="dialog" {...props}>
    <span className="store-create-heading">
      <span className="store-create-icon"><Icon size={20} aria-hidden="true" /></span>
      <small>Tạo phiếu</small>
      <ChevronRight className="store-create-chevron" size={18} aria-hidden="true" />
    </span>
    <strong className="store-create-kind-label">{label}</strong>
  </button>;
}
