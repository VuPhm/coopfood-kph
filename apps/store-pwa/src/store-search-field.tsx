import { useId, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Input } from "@coopfood-kph/ui";
import { Search, X, ScanLine, Clock3, ArrowUpLeft } from "lucide-react";
import "./store-search-field.css";

export type SearchItem = { value: string; label: string; detail?: string; keywords?: string };
export type SearchGroup = { label: string; items: readonly SearchItem[] };

/** Suggestions refine the current context; catalog selection still requires exact lookup. */
export function StoreSearchField({ value, onValueChange, label, placeholder, clearLabel = "Xóa tìm kiếm", inputRef, title, disabled = false, className = "", groups = [], onSearch, onScan, scanLabel = "Quét mã" }: {
  value: string; onValueChange: (value: string) => void; label: string; placeholder: string;
  clearLabel?: string; inputRef?: RefObject<HTMLInputElement | null>; title?: string; disabled?: boolean; className?: string;
  groups?: readonly SearchGroup[]; onSearch?: (value: string) => void; onScan?: () => void; scanLabel?: string;
}) {
  const ownRef = useRef<HTMLInputElement>(null), field = inputRef ?? ownRef, root = useRef<HTMLDivElement>(null), id = useId();
  const [open, setOpen] = useState(false), [recent, setRecent] = useState<string[]>([]);
  const menu = useRef<HTMLDivElement>(null), suppressFocus = useRef(false);
  function restoreFocus() { suppressFocus.current = true; field.current?.focus({ preventScroll: true }); suppressFocus.current = false; }
  const nativePopover = typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype;
  useLayoutEffect(() => {
    const panel = menu.current, anchor = root.current;
    if (!open || !panel || !anchor || !nativePopover) return;
    const position = () => {
      const rect = anchor.getBoundingClientRect(), viewport = window.visualViewport;
      const top = viewport?.offsetTop ?? 0, bottom = top + (viewport?.height ?? window.innerHeight);
      const below = bottom - rect.bottom - 16, above = rect.top - top - 16;
      const up = below < 180 && above > below, height = Math.max(80, Math.min(360, up ? above : below));
      Object.assign(panel.style, { position: "fixed", width: `${rect.width}px`, left: `${rect.left}px`, top: up ? "auto" : `${rect.bottom + 8}px`, bottom: up ? `${window.innerHeight - rect.top + 8}px` : "auto", maxHeight: `${height}px`, margin: "0" });
    };
    position(); panel.showPopover();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(position); observer?.observe(anchor);
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !anchor.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", position); window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    return () => { observer?.disconnect(); document.removeEventListener("pointerdown", outside); if (panel.matches(":popover-open")) panel.hidePopover(); window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); window.visualViewport?.removeEventListener("resize", position); };
  }, [open, nativePopover, disabled]);
  const supported = groups.length > 0 || !!onSearch;
  const needle = value.trim().toLocaleLowerCase("vi");
  const matches = groups.map(group => ({ ...group, items: Array.from(new Map(group.items.filter(item => !needle || `${item.label} ${item.value} ${item.detail ?? ""} ${item.keywords ?? ""}`.toLocaleLowerCase("vi").includes(needle)).map(item => [item.value, item])).values()) }));
  const count = matches.reduce((total, group) => total + group.items.length, 0);
  function remember(term: string) {
    if (!term.trim()) return;
    setRecent(current => [term.trim(), ...current.filter(item => item !== term.trim())].slice(0, 5));
  }
  useEffect(() => {
    const form = field.current?.form;
    const submit = () => { remember(value); setOpen(false); };
    form?.addEventListener("submit", submit);
    return () => form?.removeEventListener("submit", submit);
  }, [value]);
  function choose(term: string) {
    remember(term); onValueChange(term); onSearch?.(term); setOpen(false); restoreFocus();
  }
  return <div ref={root} className={`store-search-field ${onScan ? "has-scan" : ""} ${className}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); restoreFocus(); }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && event.target instanceof Element && event.target.closest(".store-search-option")) {
      event.preventDefault(); const options = Array.from(root.current?.querySelectorAll<HTMLButtonElement>(".store-search-option") ?? []), index = options.indexOf(event.target.closest<HTMLButtonElement>(".store-search-option")!);
      if (event.key === "ArrowUp" && index === 0) field.current?.focus(); else options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
    }
    if (event.key === "ArrowDown" && event.target === field.current && supported) { event.preventDefault(); setOpen(true); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(".store-search-option")?.focus()); }
  }}>
    <label><Search size={18} aria-hidden="true" /><span className="sr-only">{label}</span><Input className="store-search-input" ref={field} disabled={disabled} autoComplete="off" inputMode="search" enterKeyHint="search" placeholder={placeholder} value={value} title={title} aria-controls={supported && open ? id : undefined} onClick={() => setOpen(true)} onFocus={() => { if (!suppressFocus.current) setOpen(true); }} onChange={event => { onValueChange(event.target.value); setOpen(true); }} onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { remember(value); setOpen(false); if (onSearch) { event.preventDefault(); event.stopPropagation(); onSearch(value); } } }} /></label>
    {value && !disabled ? <button className="store-search-clear" type="button" aria-label={clearLabel} onClick={() => { onValueChange(""); setOpen(true); field.current?.focus({ preventScroll: true }); }}><X size={18} aria-hidden="true" /></button> : null}
    {onScan ? <button className="store-search-scan" type="button" disabled={disabled} aria-label={scanLabel} onClick={() => { setOpen(false); onScan(); }}><ScanLine size={20} aria-hidden="true" /></button> : null}
    {supported && open && !disabled ? <div ref={menu} popover={nativePopover ? "manual" : undefined} className="store-search-menu" id={id} role="region" aria-label={`Gợi ý ${label}`}>
      {!needle && recent.length ? <section><div className="store-search-group-heading"><h3>Tìm gần đây</h3><button type="button" onClick={() => { setRecent([]); field.current?.focus({ preventScroll: true }); }}>Xóa lịch sử</button></div>{recent.map(term => <button className="store-search-option" key={term} type="button" onClick={() => choose(term)}><Clock3 size={17} aria-hidden="true" /><span><strong>{term}</strong></span><ArrowUpLeft size={16} aria-hidden="true" /></button>)}</section> : null}
      <div className="store-search-menu-title" aria-live="polite">{needle ? `${count} kết quả trong danh sách` : "Đề xuất theo nội dung hiện có"}</div>
      {matches.filter(group => group.items.length).map(group => <section key={group.label} aria-label={group.label}><div className="store-search-group-heading"><h3>{group.label}</h3><span>{group.items.length}</span></div>{group.items.slice(0, 5).map(item => <button className="store-search-option" key={item.value} type="button" onClick={() => choose(item.value)}><Search size={17} aria-hidden="true" /><span><strong>{item.label}</strong>{item.detail ? <small>{item.detail}</small> : null}</span><ArrowUpLeft size={16} aria-hidden="true" /></button>)}{group.items.length > 5 ? <p className="store-search-hint">Hiện 5 / {group.items.length} · nhập thêm để thu gọn</p> : null}</section>)}
      {!count ? <p className="store-search-hint">{needle ? "Chưa có mục khớp. Thử tên khác hoặc kiểm tra mã." : "Chưa có dữ liệu để đề xuất."}</p> : null}
      {needle && onSearch ? <button className="store-search-option store-search-run" type="button" onClick={() => choose(value.trim())}><Search size={18} aria-hidden="true" /><span>Tìm “{value.trim()}”</span></button> : null}
    </div> : null}
  </div>;
}
