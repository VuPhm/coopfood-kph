import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import type { StorePageHeaderOptions } from "./store-app-header";
export type { StorePageHeaderOptions } from "./store-app-header";

export const StorePageHeaderContext = createContext<((options?: StorePageHeaderOptions) => ReactNode) | null>(null);

/** Common canvas with three slots: app bar, green content, white surface. */
export function StorePageLayout({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`store-page-layout ${className}`} {...props} />;
}
export function StorePageSurface({ className = "", ...props }: ComponentProps<"section">) {
  return <section id="store-page-content" tabIndex={-1} className={`store-page-surface ${className}`} {...props} />;
}
export function StorePageHero({ children, className = "", contentLabel, header, appHeader }: {
  children?: ReactNode; className?: string; contentLabel?: string; header?: StorePageHeaderOptions; appHeader?: ReactNode;
}) {
  const renderHeader = useContext(StorePageHeaderContext);
  return <div className={`store-page-hero ${className}`} onFocusCapture={event => {
    // React portal focus bubbles through this component although its DOM is outside.
    if (!event.currentTarget.contains(event.target)) return;
    // Reveal only the covered part; pointer/keyboard focus on an exposed control
    // must not reset the page. Portal and account focus retain their own anchors.
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.closest(".store-account")) return;
    const cover = event.currentTarget.nextElementSibling;
    if (!(cover instanceof HTMLElement) || !cover.classList.contains("store-page-surface")) return;
    const reveal = () => {
      const hidden = target.getBoundingClientRect().bottom + 8 - cover.getBoundingClientRect().top;
      if (hidden > 1 && window.scrollY > 0) window.scrollBy({ top: -Math.min(window.scrollY, Math.ceil(hidden)), behavior: "instant" });
    };
    reveal();
    window.requestAnimationFrame(() => { if (target.isConnected && document.activeElement === target) reveal(); });
  }}>
    {appHeader ?? renderHeader?.(header)}
    {children ? <div className="store-page-hero-content" role={contentLabel ? "region" : undefined} aria-label={contentLabel}>{children}</div> : null}
  </div>;
}
export function StoreReportPage({ children }: { children: ReactNode }) {
  return <StorePageLayout className="store-report-page"><StorePageHero /><StorePageSurface className="store-report-page-cap">{children}</StorePageSurface></StorePageLayout>;
}
