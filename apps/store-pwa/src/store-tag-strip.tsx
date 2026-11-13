import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "./store-tag-strip.css";

export function StoreTagStrip({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const gesture = useRef({ startX: 0, active: false, dragged: false });
  const [edges, setEdges] = useState({ overflow: false, back: false, more: false });
  function measure() {
    const el = strip.current;
    if (!el) return;
    const next = { overflow: el.scrollWidth > el.clientWidth + 1, back: el.scrollLeft > 1, more: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 };
    setEdges(old => old.overflow === next.overflow && old.back === next.back && old.more === next.more ? old : next);
  }
  useLayoutEffect(() => {
    measure();
    const el = strip.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure); observer.observe(el);
    for (const child of el.children) observer.observe(child);
    document.fonts?.ready.then(() => { if (strip.current === el) measure(); });
    return () => observer.disconnect();
  }, [children]);
  return <div className={`store-tag-shell ${className}`} data-back={edges.back || undefined} data-more={edges.more || undefined} onPointerDown={event => { gesture.current = { startX: event.clientX, active: true, dragged: false }; }} onPointerMove={event => { if (gesture.current.active && Math.abs(event.clientX - gesture.current.startX) > 8) gesture.current.dragged = true; }} onPointerUp={() => { gesture.current.active = false; }} onPointerCancel={() => { gesture.current.active = false; gesture.current.dragged = true; }} onClick={event => { if (gesture.current.dragged) { event.preventDefault(); event.stopPropagation(); gesture.current.dragged = false; } }}>
    <div ref={strip} className="store-tag-strip" role="group" aria-label={label} aria-description={edges.overflow ? "Vuốt ngang hoặc dùng phím mũi tên để xem thêm nhãn" : undefined} tabIndex={edges.overflow ? 0 : undefined} onScroll={() => { if (gesture.current.active) gesture.current.dragged = true; measure(); }} onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const el = event.currentTarget;
      const left = event.key === "Home" ? 0 : event.key === "End" ? el.scrollWidth : el.scrollLeft + (event.key === "ArrowRight" ? 1 : -1) * Math.max(80, el.clientWidth * .75);
      el.scrollTo({ left, behavior: "instant" }); measure();
    }}>{children}</div>
  </div>;
}
