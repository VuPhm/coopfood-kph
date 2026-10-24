import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import "./store-form-controls.css";

export function StoreSettingsGroup({ label, children, columns = 1, className = "" }: { label: string; children: ReactNode; columns?: 1 | 2; className?: string }) {
  return <section className={`store-settings-group ${className}`} aria-label={label} data-columns={columns}>{children}</section>;
}

export function StoreSettingsRow({ label, value, icon, onClick, ariaLabel, valueId, badge }: {
  label: string; value: ReactNode; icon?: ReactNode; onClick: () => void; ariaLabel?: string; valueId?: string; badge?: number;
}) {
  return <button type="button" className="store-settings-row" aria-label={ariaLabel} aria-describedby={valueId} onClick={onClick}>
    {icon}<span><small>{label}</small><strong id={valueId}>{value}</strong></span>
    {badge ? <b className="store-settings-badge">{badge}</b> : null}<ChevronRight size={18} aria-hidden="true" />
  </button>;
}
