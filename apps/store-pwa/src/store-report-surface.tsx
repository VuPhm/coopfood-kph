import { StorePageHero, StorePageLayout, StorePageSurface, type StorePageHeaderOptions } from "./store-page-hero";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import "./store-report-surface.css";

export function shouldDismissReportPull(distance: number, velocity: number): boolean {
  return distance >= 120 || (distance >= 48 && velocity >= .65);
}

/** A page surface, not a modal. Native page scroll remains the primary gesture. */
export function ReportSurface({ hero, header, children, onDismiss, dismissLabel = "Về menu báo cáo", pullToDismiss = true, className = "" }: {
  hero: ReactNode; header?: StorePageHeaderOptions; children: ReactNode; onDismiss: () => void; dismissLabel?: string; pullToDismiss?: boolean; className?: string;
}) {
  const capRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef(onDismiss);
  const closeRef = useRef<() => void>(() => {});
  useLayoutEffect(() => { dismissRef.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    if (!pullToDismiss) return;
    const cap = capRef.current; const handle = handleRef.current;
    if (!cap || !handle) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0; let timer = 0; let nextY = 0; let suppressUntil = 0; let closing = false;
    let start: { x: number; y: number; lastY: number; lastTime: number; velocity: number; distance: number; locked: boolean; pointer: number | null } | null = null;
    let complete = () => { cap.dataset.phase = "idle"; cap.style.removeProperty("transform"); };
    const stopTimer = () => { clearTimeout(timer); timer = 0; };
    const finishTransition = () => { stopTimer(); complete(); };
    function transition(y: number, dismiss: boolean) {
      cancelAnimationFrame(frame); frame = 0; stopTimer(); start = null;
      closing = dismiss;
      complete = () => {
        if (dismiss) dismissRef.current();
        else { cap!.dataset.phase = "idle"; cap!.style.removeProperty("transform"); }
      };
      if (reduce.matches) { complete(); return; }
      cap!.dataset.phase = dismiss ? "closing" : "settling";
      cap!.style.transform = `translate3d(0, ${y}px, 0)`;
      timer = window.setTimeout(finishTransition, 220);
    }
    const close = () => { if (!closing) transition(window.innerHeight + 32, true); };
    closeRef.current = close;
    function begin(x: number, y: number, target: EventTarget | null, pointer: number | null) {
      if (closing || !(target instanceof Element)) return false;
      if (window.scrollY > 1 && !handle!.contains(target)) return false;
      if (target.closest('input, textarea, select, [role="combobox"], [contenteditable="true"]')) return false;
      if (document.querySelector('[role="dialog"], [role="listbox"], [role="menu"]')) return false;
      stopTimer(); suppressUntil = 0;
      start = { x, y, lastY: y, lastTime: performance.now(), velocity: 0, distance: 0, locked: false, pointer };
      return true;
    }
    function move(x: number, y: number, event: Event) {
      if (!start) return;
      const dy = y - start.y; const dx = Math.abs(x - start.x);
      if (!start.locked) {
        if (dy < -8 || (dx > 12 && dx > Math.abs(dy))) { start = null; return; }
        if (dy < 12 || dy < dx * 1.2) return;
        start.locked = true; cap!.dataset.phase = "dragging";
      }
      if (event.cancelable) event.preventDefault();
      const now = performance.now();
      if (now > start.lastTime) start.velocity = Math.max(0, (y - start.lastY) / (now - start.lastTime));
      start.lastY = y; start.lastTime = now; start.distance = Math.max(0, dy);
      nextY = Math.min(window.innerHeight, Math.max(0, dy) * .85);
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; cap!.style.transform = `translate3d(0, ${nextY}px, 0)`; });
    }
    function end(cancel = false) {
      if (!start) return;
      const current = start; start = null;
      if (!current.locked) return;
      suppressUntil = performance.now() + 350;
      // A released gesture uses its latest position; a long pause is not a flick.
      const velocity = performance.now() - current.lastTime < 100 ? current.velocity : 0;
      if (!cancel && shouldDismissReportPull(current.distance, velocity)) close();
      else transition(0, false);
    }
    const touchStart = (event: TouchEvent) => { if (event.touches.length !== 1) { end(true); return; } const t = event.touches[0]!; begin(t.clientX, t.clientY, event.target, null); };
    const touchMove = (event: TouchEvent) => { if (event.touches.length !== 1) { end(true); return; } const t = event.touches[0]!; move(t.clientX, t.clientY, event); };
    const touchEnd = () => end(); const touchCancel = () => end(true);
    const pointerDown = (event: PointerEvent) => { if (event.pointerType !== "touch" && event.button === 0 && begin(event.clientX, event.clientY, event.target, event.pointerId)) handle!.setPointerCapture(event.pointerId); };
    const pointerMove = (event: PointerEvent) => { if (start?.pointer === event.pointerId) move(event.clientX, event.clientY, event); };
    const pointerEnd = (event: PointerEvent) => { if (start?.pointer === event.pointerId) end(event.type === "pointercancel"); };
    const click = (event: MouseEvent) => { if (performance.now() < suppressUntil) { event.preventDefault(); event.stopPropagation(); } };
    const transitionEnd = (event: TransitionEvent) => { if (event.target === cap && event.propertyName === "transform") finishTransition(); };
    cap.addEventListener("touchstart", touchStart, { passive: true });
    cap.addEventListener("touchmove", touchMove, { passive: false });
    cap.addEventListener("touchend", touchEnd); cap.addEventListener("touchcancel", touchCancel);
    cap.addEventListener("click", click, true); cap.addEventListener("transitionend", transitionEnd);
    handle.addEventListener("pointerdown", pointerDown); handle.addEventListener("pointermove", pointerMove); handle.addEventListener("pointerup", pointerEnd); handle.addEventListener("pointercancel", pointerEnd);
    return () => {
      cancelAnimationFrame(frame); stopTimer(); closeRef.current = () => {};
      cap.removeEventListener("touchstart", touchStart); cap.removeEventListener("touchmove", touchMove); cap.removeEventListener("touchend", touchEnd); cap.removeEventListener("touchcancel", touchCancel);
      cap.removeEventListener("click", click, true); cap.removeEventListener("transitionend", transitionEnd);
      handle.removeEventListener("pointerdown", pointerDown); handle.removeEventListener("pointermove", pointerMove); handle.removeEventListener("pointerup", pointerEnd); handle.removeEventListener("pointercancel", pointerEnd);
    };
  }, [pullToDismiss]);
  return <StorePageLayout className={`report-stage ${className}`}>
    <StorePageHero className="report-stage-hero" {...(header ? { header } : {})}>{hero}</StorePageHero>
    <StorePageSurface ref={capRef} className="report-sliding-cap" data-phase="idle" data-pull-enabled={pullToDismiss} aria-label="Nội dung báo cáo">
      {pullToDismiss ? <button ref={handleRef} type="button" className="report-cap-handle" aria-label={dismissLabel} title="Kéo xuống để chọn loại báo cáo" onClick={() => closeRef.current()}><span aria-hidden="true" /></button> : <nav className="report-cap-navigation" aria-label="Điều hướng mẫu báo cáo"><button type="button" aria-label={dismissLabel} onClick={onDismiss}><ArrowLeft size={18} aria-hidden="true" /><span>Chọn mẫu khác</span></button></nav>}
      {children}
    </StorePageSurface>
  </StorePageLayout>;
}
