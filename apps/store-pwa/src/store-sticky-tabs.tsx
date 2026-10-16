import type { FocusEvent, ReactNode } from "react";

export function StoreStickyTabs({ children }: { children: ReactNode }) {
  return <div className="store-sticky-tabs">{children}</div>;
}

// Only measure on focus: document scrolling and pinning remain native CSS.
export function revealBelowStickyTabs(event: FocusEvent<HTMLElement>) {
  const target = event.target;
  const tabs = event.currentTarget.querySelector<HTMLElement>(".store-sticky-tabs");
  if (!(target instanceof HTMLElement) || !tabs || !event.currentTarget.contains(target) || tabs.contains(target)) return;
  if (!(tabs.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
  const reveal = () => {
    if (!target.isConnected || document.activeElement !== target) return;
    const pinned = tabs.getBoundingClientRect();
    const inset = Number.parseFloat(getComputedStyle(tabs).top) || 0;
    const focused = target.getBoundingClientRect();
    if (pinned.top > inset + 1 || focused.right <= pinned.left || focused.left >= pinned.right) return;
    const clearance = pinned.bottom + 8;
    if (focused.top < clearance) window.scrollBy({ top: focused.top - clearance, behavior: "instant" });
  };
  reveal();
  // Recheck once after native focus/scroll anchoring settles, including tab changes.
  window.requestAnimationFrame(reveal);
}
