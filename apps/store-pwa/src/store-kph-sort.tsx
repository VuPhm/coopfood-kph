import type { ComponentProps } from "react";
import { QuickSortButton, StoreQuickSort } from "./store-quick-sort";

export const KPH_SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất", description: "Ngày phát hiện gần nhất trước" },
  { value: "oldest", label: "Cũ nhất", description: "Ngày phát hiện xa nhất trước" },
  { value: "name", label: "Tên hàng", description: "Theo tên hàng từ A đến Z" },
] as const;

// Keep the live KPH trigger and its loading frame identical.
export function KphSortButton({ sort, ...props }: ComponentProps<"button"> & { sort: string }) {
  return <QuickSortButton {...props} value={sort} options={KPH_SORT_OPTIONS} title="Sắp xếp phiếu" />;
}

export function KphQuickSort({ sort, onChange }: { sort: string; onChange: (value: string) => void }) {
  return <StoreQuickSort value={sort} onChange={onChange} options={KPH_SORT_OPTIONS} title="Sắp xếp phiếu" groupLabel="Thứ tự phiếu" />;
}
