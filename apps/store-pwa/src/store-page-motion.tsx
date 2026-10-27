import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import type { Screen } from "./store-app-routes";

type Arrival = { route: Screen; startedAt: number; distance: number; duration: number };
const ArrivalContext = createContext<Arrival | null>(null);
// UI-only clock shared by the lightweight loading frame and the ready frame.
// Replacing a lazy page continues the same arrival, never starts another slide.
let currentArrival: Arrival | null = null;
function arrivalFor(route: Screen): Arrival {
  if (currentArrival?.route !== route) {
    const returningHome = route === "home" && currentArrival !== null;
    currentArrival = { route, startedAt: performance.now(), distance: returningHome ? -10 : 16, duration: route === "home" ? 280 : 220 };
  }
  return currentArrival;
}
export function StorePageMotionProvider({ screen, children }: { screen: Screen; children: ReactNode }) {
  const arrival = useMemo(() => arrivalFor(screen), [screen]);
  return <ArrivalContext.Provider value={arrival}>{children}</ArrivalContext.Provider>;
}

/** Finite compositor effects; no per-frame JS, snapshots, delayed navigation or retained pages. */
export function useStorePageMotion() {
  const page = useRef<HTMLDivElement>(null);
  const sharedArrival = useContext(ArrivalContext);
  const arrival = useMemo(() => sharedArrival ?? arrivalFor("login"), [sharedArrival]);
  useLayoutEffect(() => {
    const root = page.current;
    if (!root || typeof root.animate !== "function" || typeof window.matchMedia !== "function") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const print = window.matchMedia("print");
    const elapsed = Math.max(0, performance.now() - arrival.startedAt);
    if (reduced.matches || print.matches || document.hidden || elapsed >= arrival.duration) return;
    const surface = root.querySelector<HTMLElement>(":scope > .store-page-surface");
    if (!surface) return;
    // Transform would change the containing block of a fixed action dock/probe.
    // Keep this consumer as a fade; its dock stays anchored to the viewport.
    const slides = !surface.querySelector(".store-action-anchor");
    const frames: Keyframe[] = slides
      ? [{ transform: `translateY(${arrival.distance}px)`, opacity: .94 }, { transform: "translateY(0px)", opacity: 1 }]
      : [{ opacity: .94 }, { opacity: 1 }];
    const active = [surface.animate(frames, { duration: arrival.duration, easing: "cubic-bezier(.2,.8,.2,1)" })];
    const content = root.querySelector<HTMLElement>(":scope > .store-page-hero > .store-page-hero-content");
    if (content) active.push(content.animate([{ opacity: .94 }, { opacity: 1 }], { duration: 160, easing: "ease-out" }));
    for (const animation of active) animation.currentTime = Math.min(elapsed, Number(animation.effect?.getTiming().duration) || arrival.duration);
    root.dataset.storeEntering = arrival.route;
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      for (const animation of active) animation.cancel();
      delete root.dataset.storeEntering;
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeprint", stop);
      document.removeEventListener("visibilitychange", onPreference);
      root.removeEventListener("focusin", onFocus);
      reduced.removeEventListener("change", onPreference);
      print.removeEventListener("change", onPreference);
    };
    const onScroll = () => { if (window.scrollY > 0) stop(); };
    const onPreference = () => { if (reduced.matches || print.matches || document.hidden) stop(); };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches("input,textarea,select,button,a,[role='combobox']")) stop();
    };
    // Only listen during arrival. User interaction wins immediately over decoration.
    window.addEventListener("wheel", stop, { passive: true, once: true });
    window.addEventListener("touchstart", stop, { passive: true, once: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeprint", stop);
    document.addEventListener("visibilitychange", onPreference);
    root.addEventListener("focusin", onFocus);
    reduced.addEventListener("change", onPreference);
    print.addEventListener("change", onPreference);
    void Promise.allSettled(active.map(animation => animation.finished)).then(stop);
    return stop;
  }, [arrival]);
  return page;
}
