import { useEffect, useRef, type ReactNode } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@coopfood-kph/ui";
import { ChevronDown } from "lucide-react";
import { updateSelection, type SelectionAction } from "./store-selection";
import "./store-controls.css";

export function StoreSelectionBar({ value, eligibleIds, visibleIds, onChange, itemLabel = "mục", contextLabel }: {
  value: readonly string[] | null; eligibleIds: readonly string[]; visibleIds: readonly string[];
  onChange: (value: string[] | null) => void; itemLabel?: string; contextLabel?: ReactNode;
}) {
  const master = useRef<HTMLInputElement>(null);
  const chosen = new Set(value ?? eligibleIds);
  const selectedCount = eligibleIds.filter(id => chosen.has(id)).length;
  const visibleCount = visibleIds.filter(id => chosen.has(id)).length;
  const allVisible = visibleIds.length > 0 && visibleCount === visibleIds.length;
  const mixed = visibleCount > 0 && !allVisible;
  useEffect(() => { if (master.current) master.current.indeterminate = mixed; }, [mixed]);
  const apply = (action: SelectionAction) => onChange(updateSelection(value, eligibleIds, visibleIds, action));
  return <div className="store-selection-bar">
    <label className="store-selection-master"><input ref={master} type="checkbox" aria-label={`Chọn tất cả ${itemLabel} đang hiển thị`} aria-checked={mixed ? "mixed" : allVisible} checked={allVisible} disabled={!visibleIds.length} onChange={() => apply(allVisible ? "clear-visible" : "select-visible")} /><span><strong aria-live="polite">Đã chọn {selectedCount} / {eligibleIds.length} {itemLabel}</strong><small>{contextLabel ?? (visibleIds.length === eligibleIds.length ? "Toàn danh mục" : `${visibleIds.length} ${itemLabel} đang hiển thị`)}</small></span></label>
    <DropdownMenu modal={false}><DropdownMenuTrigger className="store-selection-menu" aria-label={`Tùy chọn chọn ${itemLabel}`}>Lựa chọn<ChevronDown size={16} aria-hidden="true" /></DropdownMenuTrigger>
      <DropdownMenuContent className="store-dropdown" aria-label={`Thao tác chọn ${itemLabel}`}>
        <DropdownMenuLabel>Đang hiển thị · {visibleIds.length} {itemLabel}</DropdownMenuLabel>
        <DropdownMenuItem disabled={!visibleIds.length || allVisible} onSelect={() => apply("select-visible")}>Chọn kết quả đang xem</DropdownMenuItem>
        <DropdownMenuItem disabled={!visibleCount} onSelect={() => apply("clear-visible")}>Bỏ chọn kết quả đang xem</DropdownMenuItem>
        <DropdownMenuItem disabled={!visibleIds.length} onSelect={() => apply("invert-visible")}>Đảo lựa chọn đang xem</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Toàn danh mục · {eligibleIds.length} {itemLabel}</DropdownMenuLabel>
        <DropdownMenuItem disabled={!eligibleIds.length || selectedCount === eligibleIds.length} onSelect={() => apply("all")}>Chọn toàn bộ danh mục</DropdownMenuItem>
        <DropdownMenuItem disabled={!selectedCount} onSelect={() => apply("none")}>Bỏ chọn toàn bộ</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}
