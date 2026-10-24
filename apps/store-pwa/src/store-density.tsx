import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

export const STORE_DENSITY_KEY = "coopfood.store-ui.density.v1";
export type StoreDensity = "comfortable" | "compact";

export function readStoreDensity(): StoreDensity {
  try { return window.localStorage.getItem(STORE_DENSITY_KEY) === "compact" ? "compact" : "comfortable"; }
  catch { return "comfortable"; }
}

type DensityPreference = { density: StoreDensity; setDensity: (density: StoreDensity) => void; saved: boolean };
const DensityContext = createContext<DensityPreference | null>(null);

// Preference updates only re-render consumers, leaving workspace/draft state intact.
export function StoreDensityProvider({ children }: { children: ReactNode }) {
  const [density, updateDensity] = useState(readStoreDensity);
  const [saved, setSaved] = useState(true);
  const value = useMemo<DensityPreference>(() => ({ density, saved, setDensity: next => {
    updateDensity(next);
    try { window.localStorage.setItem(STORE_DENSITY_KEY, next); setSaved(true); }
    catch { setSaved(false); }
  } }), [density, saved]);
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export function useStoreDensity() { return useContext(DensityContext); }

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
    const threshold = document.querySelector(".store-page-hero")?.getBoundingClientRect().bottom ?? 72;
    const anchor = window.scrollY > 0 ? Array.from(document.querySelectorAll<HTMLElement>(".store-app [data-record-id], .store-app [data-date-lot-id]"))
      .find(element => { const box = element.getBoundingClientRect(); return box.width > 0 && box.bottom > threshold && box.top < window.innerHeight; }) : undefined;
    const top = anchor?.getBoundingClientRect().top;
    root.setAttribute("data-store-density", density);
    if (anchor && top !== undefined) {
      const delta = anchor.getBoundingClientRect().top - top;
      if (delta) window.scrollBy({ top: delta, behavior: "instant" });
    }
  }, [density]);
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
      <span><strong id="store-density-label">Chế độ gọn</strong><small id="store-density-description">Thu gọn khu vực thao tác và khoảng cách để xem nhiều nội dung hơn</small></span>
      <span className="store-density-track" aria-hidden="true"><span /></span>
    </button>
    <p className="store-density-storage" role={preference.saved ? undefined : "status"}>{preference.saved ? "Áp dụng ngay · Lưu trên thiết bị này" : "Đang áp dụng trong phiên này; chưa lưu được trên thiết bị."}</p>
  </section>;
}
