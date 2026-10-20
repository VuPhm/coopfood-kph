import { useRef, type RefObject } from "react";
import { Input } from "@coopfood-kph/ui";
import { Search, X } from "lucide-react";
import "./store-form-controls.css";

/** Controlled query; clearing keeps focus in the field. Escape belongs to its page/dialog. */
export function StoreSearchField({ value, onValueChange, label, placeholder, clearLabel = "Xóa tìm kiếm", inputRef, title, className = "" }: {
  value: string; onValueChange: (value: string) => void; label: string; placeholder: string;
  clearLabel?: string; inputRef?: RefObject<HTMLInputElement | null>; title?: string; className?: string;
}) {
  const ownRef = useRef<HTMLInputElement>(null);
  const field = inputRef ?? ownRef;
  return <div className={`store-search-field ${className}`}>
    <label><Search size={18} aria-hidden="true" /><span className="sr-only">{label}</span><Input className="store-search-input" ref={field} inputMode="search" enterKeyHint="search" placeholder={placeholder} value={value} title={title} onChange={event => onValueChange(event.target.value)} /></label>
    {value ? <button type="button" aria-label={clearLabel} onClick={() => { onValueChange(""); field.current?.focus(); }}><X size={18} aria-hidden="true" /></button> : null}
  </div>;
}
