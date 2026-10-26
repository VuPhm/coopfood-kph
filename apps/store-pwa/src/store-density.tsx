import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

export const STORE_DENSITY_KEY = "coopfood.store-ui.density.v1";
export type StoreDensity = "comfortable" | "compact";

export function readStoreDensity(): StoreDensity {
  try { return window.localStorage.getItem(STORE_DENSITY_KEY) === "compact" ? "compact" : "comfortable"; }
  catch { return "comfortable"; }
}

type ReadingAnchor = { element: HTMLElement; top: number };
function captureReadingAnchor(): ReadingAnchor | null {
  if (!window.scrollY) return null;
  const threshold = document.querySelector(".store-page-hero")?.getBoundingClientRect().bottom ?? 72;
  const element = Array.from(document.querySelectorAll<HTMLElement>(".store-app [data-record-id], .store-app [data-date-lot-id]"))
    .find(node => { const box = node.getBoundingClientRect(); return box.width > 0 && box.bottom > threshold && box.top < window.innerHeight; });
  return element ? { element, top: element.getBoundingClientRect().top } : null;
}
type DensityPreference = { density: StoreDensity; setDensity: (density: StoreDensity) => void; saved: boolean; readingAnchor: { current: ReadingAnchor | null } };
const DensityContext = createContext<DensityPreference | null>(null);

// Preference updates only re-render consumers, leaving workspace/draft state intact.
export function StoreDensityProvider({ children }: { children: ReactNode }) {
  const [density, updateDensity] = useState(readStoreDensity);
  const [saved, setSaved] = useState(true);
  const readingAnchor = useRef<ReadingAnchor | null>(null);
  const value = useMemo<DensityPreference>(() => ({ density, saved, readingAnchor, setDensity: next => {
    // Capture before React changes composition, not just before the CSS attribute.
    readingAnchor.current = captureReadingAnchor();
    updateDensity(next);
    try { window.localStorage.setItem(STORE_DENSITY_KEY, next); setSaved(true); }
    catch { setSaved(false); }
  } }), [density, saved]);
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export function useStoreDensity() { return useContext(DensityContext); }

// Loading consumers have no provider yet; resolve the same preference once.
const subscribePrint = (notify: () => void) => {
  const media = window.matchMedia?.("print");
  media?.addEventListener?.("change", notify);
  return () => media?.removeEventListener?.("change", notify);
};
const isPrinting = () => window.matchMedia?.("print")?.matches ?? false;
export function useStoreDensityValue() {
  const preference = useStoreDensity();
  const [initial] = useState(readStoreDensity);
  const printing = useSyncExternalStore(subscribePrint, isPrinting, () => false);
  return printing ? "comfortable" : preference?.density ?? initial;
}

// Lists use the accepted dense composition in either screen preference.
// Printing keeps the original full label composition and never changes storage.
export function useStoreListDensity(): StoreDensity {
  const printing = useSyncExternalStore(subscribePrint, isPrinting, () => false);
  return printing ? "comfortable" : "compact";
}

// The frame owns the lifetime; the document attribute also reaches Radix portals.
// A loading frame outside the provider reads the same preference before paint.
export function StoreDensityScope() {
  const preference = useStoreDensity();
  const [initialDensity] = useState(readStoreDensity);
  const density = preference?.density ?? initialDensity;
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-store-density");
    return () => {
      if (previous === null) root.removeAttribute("data-store-density");
      else root.setAttribute("data-store-density", previous);
    };
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const anchor = preference?.readingAnchor.current ?? captureReadingAnchor();
    if (preference) preference.readingAnchor.current = null;
    root.setAttribute("data-store-density", density);
    if (anchor?.element.isConnected) {
      const delta = anchor.element.getBoundingClientRect().top - anchor.top;
      if (delta) window.scrollBy({ top: delta, behavior: "instant" });
    }
  }, [density, preference?.readingAnchor]);
  return null;
}

export function StoreDensitySetting() {
  const preference = useStoreDensity();
  if (!preference) return null;
  return <section className="store-appearance-settings" aria-labelledby="store-settings-title">
    <h3 id="store-settings-title">Cài đặt</h3>
    <p className="store-appearance-heading">Giao diện</p>
    <button type="button" role="switch" className="store-density-switch" aria-checked={preference.density === "compact"}
      aria-labelledby="store-density-label" aria-describedby="store-density-description"
      onClick={() => preference.setDensity(preference.density === "compact" ? "comfortable" : "compact")}>
      <span><strong id="store-density-label">Chế độ gọn</strong><small id="store-density-description">Gom thao tác, lược bớt lớp hiển thị để tập trung vào nội dung</small></span>
      <span className="store-density-track" aria-hidden="true"><span /></span>
    </button>
    <p className="store-density-storage" role={preference.saved ? undefined : "status"}>{preference.saved ? "Áp dụng ngay · Lưu trên thiết bị này" : "Đang áp dụng trong phiên này; chưa lưu được trên thiết bị."}</p>
  </section>;
}
