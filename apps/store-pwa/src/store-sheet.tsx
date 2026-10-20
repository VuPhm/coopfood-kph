import type { ReactNode, RefObject } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@coopfood-kph/ui";

export function StoreSheet({ open, onOpenChange, title, description, children, className, initialFocusRef }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode; className?: string; initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={`store-sheet ${className ?? ""}`} onOpenAutoFocus={event => { if (initialFocusRef?.current) { event.preventDefault(); initialFocusRef.current.focus({ preventScroll: true }); } }}>
    <DialogHeader className="store-sheet-heading"><DialogTitle>{title}</DialogTitle></DialogHeader>
    <DialogDescription className="sr-only">{description}</DialogDescription>
    <div className="store-modal-body">{children}</div>
  </DialogContent></Dialog>;
}

export function Summary({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) {
  return <dl className="store-summary">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
