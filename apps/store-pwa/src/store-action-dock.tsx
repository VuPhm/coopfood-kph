import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./store-action-dock.css";

type Placement = { floating: boolean; left: number; width: number; height: number; keyboard: boolean };

/** One set of actions: floats within the content width, then settles at its original place. */
export function StoreActionDock({ children, summary, label, className }: { children: ReactNode; summary: ReactNode; label: string; className?: string }) {
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const inset = useRef<HTMLSpanElement>(null);
  const [placement, setPlacement] = useState<Placement>({ floating: false, left: 0, width: 0, height: 0, keyboard: false });
  useLayoutEffect(() => {
    const container = anchor.current; const dock = panel.current; const probe = inset.current;
    if (!container || !dock || !probe) return;
    const boundary = container.parentElement;
    const app = container.closest<HTMLElement>(".store-app");
    const utility = app?.querySelector<HTMLElement>(".store-quick-fab");
    const previousUtilityClearance = app?.style.getPropertyValue("--store-floating-action-clearance") ?? "";
    const previousClearance = boundary?.style.getPropertyValue("--store-action-clearance") ?? "";
    const previousBoundary = boundary?.getAttribute("data-store-action-boundary");
    boundary?.setAttribute("data-store-action-boundary", "");
    let frame = 0;
    let focusFrame = 0;
    function measure() {
      if (!container || !dock || !probe) return;
      const rect = container.getBoundingClientRect();
      const height = dock.getBoundingClientRect().height;
      const bottom = Number.parseFloat(getComputedStyle(probe).bottom) || 0;
      const viewport = window.visualViewport;
      const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]') ?? false;
      const keyboard = !!viewport && editing && viewport.height < window.innerHeight - 150;
      const floating = rect.top + height > window.innerHeight - bottom + 1 || rect.bottom < 0;
      const next = { floating, left: rect.left, width: rect.width, height, keyboard };
      const clearance = `${height + bottom + 16}px`;
      // The inline dock can still share the utility's bottom strip after focus restores.
      // Keep its actions reachable; reuse the current scroll/resize measurement.
      const utilityHeight = utility?.getBoundingClientRect().height ?? 48;
      const inlineNearBottom = !floating && rect.top < window.innerHeight && rect.bottom > window.innerHeight - bottom - utilityHeight - 12;
      const utilityClearance = keyboard ? "0px" : floating ? `${height + bottom + 12}px` : inlineNearBottom ? `${window.innerHeight - rect.top + 12}px` : "0px";
      if (app?.style.getPropertyValue("--store-floating-action-clearance") !== utilityClearance) app?.style.setProperty("--store-floating-action-clearance", utilityClearance);
      if (boundary?.style.getPropertyValue("--store-action-clearance") !== clearance) boundary?.style.setProperty("--store-action-clearance", clearance);
      setPlacement(current => Object.keys(next).every(key => current[key as keyof Placement] === next[key as keyof Placement]) ? current : next);
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    function keepFocusedControlVisible(event: FocusEvent) {
      schedule();
      const target = event.target;
      if (!(target instanceof HTMLElement) || !boundary?.contains(target) || dock?.contains(target)) return;
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        if (!dock || !target.isConnected || getComputedStyle(dock).position !== "fixed") return;
        const item = target.getBoundingClientRect(); const actions = dock.getBoundingClientRect();
        if (item.bottom > actions.top - 12 && item.top < actions.bottom) {
          window.scrollBy({ top: item.bottom - actions.top + 16, behavior: "instant" });
        }
      });
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(container); observer.observe(dock);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    document.addEventListener("focusin", keepFocusedControlVisible); document.addEventListener("focusout", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame); cancelAnimationFrame(focusFrame); observer.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", keepFocusedControlVisible); document.removeEventListener("focusout", schedule);
      if (previousUtilityClearance) app?.style.setProperty("--store-floating-action-clearance", previousUtilityClearance);
      else app?.style.removeProperty("--store-floating-action-clearance");
      if (previousBoundary == null) boundary?.removeAttribute("data-store-action-boundary");
      else boundary?.setAttribute("data-store-action-boundary", previousBoundary);
      if (previousClearance) boundary?.style.setProperty("--store-action-clearance", previousClearance);
      else boundary?.style.removeProperty("--store-action-clearance");
    };
  }, []);
  return <div ref={anchor} className={`store-action-anchor ${className ?? ""}`} style={{ minHeight: placement.height || undefined }}>
    <span ref={inset} className="store-action-inset" aria-hidden="true" />
    <footer ref={panel} className="store-action-dock" role="region" aria-label={label} data-floating={placement.floating} data-keyboard={placement.keyboard}
      style={{ "--dock-left": `${placement.left}px`, "--dock-width": `${placement.width}px` } as CSSProperties}>
      <div className="store-action-summary">{summary}</div>
      <div className="store-action-buttons">{children}</div>
    </footer>
  </div>;
}
