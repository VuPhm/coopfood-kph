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
    // Account/settings opens above the current work; preserve its scroll anchor.
    if (!(event.target instanceof Element && event.target.closest(".store-account"))) window.scrollTo({ top: 0, behavior: "instant" });
  }}>
    {appHeader ?? renderHeader?.(header)}
    {children ? <div className="store-page-hero-content" role={contentLabel ? "region" : undefined} aria-label={contentLabel}>{children}</div> : null}
  </div>;
}
export function StoreReportPage({ children }: { children: ReactNode }) {
  return <StorePageLayout className="store-report-page"><StorePageHero /><StorePageSurface className="store-report-page-cap">{children}</StorePageSurface></StorePageLayout>;
}
