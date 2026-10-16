import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@coopfood-kph/ui";
import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ComponentProps } from "react";

export type QuickSortOption = { value: string; label: string; description: string };

// Shared geometry for live dropdowns and loading frames.
export function QuickSortButton({ value, options, title, ...props }: Omit<ComponentProps<"button">, "value"> & { value: string; options: readonly QuickSortOption[]; title: string }) {
  const label = options.find(option => option.value === value)?.label ?? options[0]?.label;
  return <button type="button" className="store-quick-sort-trigger" aria-label={`${title}: ${label}`} {...props}>
    <ArrowDownWideNarrow size={18} aria-hidden="true" /><span>{label}</span><ChevronDown size={16} aria-hidden="true" />
  </button>;
}

export function StoreQuickSort({ value, onChange, options, title, groupLabel }: { value: string; onChange: (value: string) => void; options: readonly QuickSortOption[]; title: string; groupLabel: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({ left: 16, top: 16 });
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  function place() {
    const anchor = trigger.current?.getBoundingClientRect();
    if (!anchor) return;
    const width = Math.min(280, window.innerWidth - 32);
    const height = content.current?.getBoundingClientRect().height ?? (64 + options.length * 66);
    const below = anchor.bottom + 8;
    const preferredTop = below + height <= window.innerHeight - 16 ? below : anchor.top - height - 8;
    const next = { width, left: Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16)),
      top: Math.max(16, Math.min(preferredTop, window.innerHeight - height - 16)) };
    setPosition(current => current.width === next.width && current.left === next.left && current.top === next.top ? current : next);
  }
  // Close a non-modal popup before the outside click proceeds, including rapid reopens.
  // Keep pointer events inside the popup/trigger with Radix; Escape/focus remain primitive-owned.
  useLayoutEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!(event.target instanceof Node) || content.current?.contains(event.target) || trigger.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open]);
  return <Dialog modal={false} open={open} onOpenChange={next => { if (next) place(); setOpen(next); }}>
    <DialogTrigger asChild><QuickSortButton ref={trigger} value={value} options={options} title={title} /></DialogTrigger>
    <DialogContent ref={content} className="store-quick-sort-popup" style={position} closeTone="neutral" closeLabel="Đóng sắp xếp"
      onOpenAutoFocus={event => { event.preventDefault(); place(); content.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus(); }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription className="sr-only">Chọn thứ tự danh sách. Lựa chọn áp dụng ngay.</DialogDescription>
      <div className="store-quick-sort-options" role="group" aria-label={groupLabel} onKeyDown={event => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }}>
        {options.map(option => <button type="button" key={option.value} aria-pressed={value === option.value}
          onClick={() => { onChange(option.value); setOpen(false); }}>
          <span><strong>{option.label}</strong><small>{option.description}</small></span>
          <Check size={18} aria-hidden="true" className={value === option.value ? "" : "is-hidden"} />
        </button>)}
      </div>
    </DialogContent>
  </Dialog>;
}
