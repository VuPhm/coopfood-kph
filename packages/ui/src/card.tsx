import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

export type CardTone = "default" | "soft" | "attention";

const cardTones: Record<CardTone, string> = {
  default: "border-border bg-surface shadow-card",
  soft: "border-brand/15 bg-brand-soft",
  attention: "border-amber/20 bg-amber-soft",
};

export function Card({ tone = "default", className, ...props }: HTMLAttributes<HTMLElement> & { tone?: CardTone }) {
  return <section className={cn("rounded-[var(--cf-radius-card)] border", cardTones[tone], className)} {...props} />;
}

export type BottomNavigationItem = { id: string; label: string; icon: ReactNode };

export function BottomNavigation({
  items,
  activeItem,
  onSelect,
  label = "Điều hướng chính",
  className,
}: {
  items: BottomNavigationItem[];
  activeItem: string;
  onSelect: (itemId: string) => void;
  label?: string;
  className?: string;
}) {
  return <nav className={cn("grid", className)} aria-label={label} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((item) => {
      const active = item.id === activeItem;
      return <button
        key={item.id}
        className={cn("grid min-h-11 content-center justify-items-center gap-1 rounded-lg bg-transparent text-ink-muted", active && "is-active bg-brand-soft text-brand")}
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={() => onSelect(item.id)}
      >{item.icon}<span>{item.label}</span></button>;
    })}
  </nav>;
}

export function SectionTitle({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-start justify-between gap-[var(--cf-space-12)]", className)}>
      <div className="min-w-0">
        <h2 className="m-0 text-[length:var(--cf-font-size-section)] font-semibold leading-[var(--cf-line-height-section)] text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[length:var(--cf-font-size-body)] leading-[var(--cf-line-height-body)] text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
