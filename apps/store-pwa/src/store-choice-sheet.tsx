import "./store-form-controls.css";
import { useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@coopfood-kph/ui";
import { StoreSheet } from "./store-sheet";
import { StoreSearchField } from "./store-search-field";
import "./store-form-controls.css";

export type StoreChoiceOption = { value: string; label: string; description?: string };
type ChoiceProps = {
  value: string; options: StoreChoiceOption[]; onApply: (value: string) => void;
  title: string; description: string; searchLabel: string; searchPlaceholder: string;
  applyLabel?: string; itemLabel?: string; emptyLabel?: string; className?: string;
};

/** Only the committed value belongs to the caller. Pending query/choice die on close. */
export function StoreChoiceSheet({ open, onOpenChange, ...props }: ChoiceProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const start = useRef<HTMLDivElement>(null);
  return <StoreSheet open={open} onOpenChange={onOpenChange} title={props.title} description={props.description} initialFocusRef={start} className={`store-control-surface store-choice-sheet ${props.className ?? ""}`}>
    {open ? <ChoiceContent key={props.value} {...props} startRef={start} onCancel={() => onOpenChange(false)} onApply={value => { props.onApply(value); onOpenChange(false); }} /> : null}
  </StoreSheet>;
}

function ChoiceContent({ value, options, onApply, searchLabel, searchPlaceholder, applyLabel = "Áp dụng", itemLabel = "mục", emptyLabel = "Không tìm thấy lựa chọn phù hợp.", startRef, onCancel }: ChoiceProps & { startRef: RefObject<HTMLDivElement | null>; onCancel: () => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !list.contains(active)) return;
        const bounds = list.getBoundingClientRect();
        const row = active.closest(".store-choice-option")?.getBoundingClientRect();
        const item = row && row.height <= bounds.height - 8 ? row : active.getBoundingClientRect();
        if (item.bottom > bounds.bottom - 4) list.scrollTop += item.bottom - bounds.bottom + 4;
        else if (item.top < bounds.top + 4) list.scrollTop -= bounds.top - item.top + 4;
      });
    });
    observer.observe(list);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  const groupName = useId();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(value);
  const needle = query.trim().toLocaleLowerCase("vi");
  const matches = options.filter(option => !needle || option.label.toLocaleLowerCase("vi").includes(needle));
  const chosen = matches.find(option => option.value === pending);
  return <>
    <div className="store-choice-search" ref={startRef} tabIndex={-1} role="group" aria-label="Tìm và chọn">
      <StoreSearchField value={query} onValueChange={setQuery} label={searchLabel} placeholder={searchPlaceholder} groups={[{label:"Lựa chọn hiện có",items:options.map(option=>({value:option.label,label:option.label,...(option.description?{detail:option.description}:{})}))}]} />
      <p aria-live="polite">{matches.length} {itemLabel}</p>
    </div>
    <div className="store-choice-results" ref={listRef} role="region" aria-label="Danh sách lựa chọn">
      <fieldset className="store-choice-options"><legend className="sr-only">Các lựa chọn</legend>{matches.map(option => <label key={option.value} className="store-choice-option">
        <span><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}</span>
        <input type="radio" name={groupName} aria-label={option.label} value={option.value} checked={pending === option.value} onChange={() => setPending(option.value)} />
      </label>)}</fieldset>
      {!matches.length ? <p className="store-choice-empty" role="status">{emptyLabel}</p> : null}
    </div>
    <div className="store-choice-actions"><Button className="store-choice-cancel" variant="secondary" onClick={onCancel}>Hủy</Button><Button className="store-choice-confirm" disabled={!chosen || chosen.value === value} onClick={() => { if (chosen) onApply(chosen.value); }}>{applyLabel}</Button></div>
  </>;
}
