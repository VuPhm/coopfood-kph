import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { StoreStickyTabs } from "./store-sticky-tabs";
import { KPH_OPTIONS, type KphKind } from "@coopfood-kph/kph-rules";
import { getKphChoicePresentation, KphChoiceContent } from "./store-kph-choice";
import { useMemo } from "react";
import { ListChecks, Maximize, Search, SlidersHorizontal } from "lucide-react";
import { KphSortButton } from "./store-kph-sort";
import { KphCreateButton } from "./store-kph-create-button";
import type { RecordView } from "./record-view";
import { figmaAsset } from "./figma-assets";
import { StoreKphMore, StoreKphList } from "./store-kph-list";
import { useStoreDesktopLayout } from "./use-store-desktop-layout";

// These are existing session records, never fabricated online data. Hidden text
// preserves the actual wrapping and chip widths in each row while code loads.
export function KphWorkspaceSkeleton({ records }: { records: RecordView[] }) {
  const desktop = useStoreDesktopLayout();
  const visible = useMemo(() => records.filter(record => record.kind === "TPTS")
    .sort((a, b) => b.detectedDate.split("/").reverse().join("-").localeCompare(a.detectedDate.split("/").reverse().join("-")) || a.id.localeCompare(b.id)).slice(0, 25), [records]);
  const totalByDate = useMemo(() => {
    const totals = new Map<string, number>();
    for (const record of records) if (record.kind === "TPTS") totals.set(record.detectedDate, (totals.get(record.detectedDate) ?? 0) + 1);
    return totals;
  }, [records]);
  const total = records.filter(record => record.kind === "TPTS").length;
  return <StorePageLayout className="store-kph kph-loading-frame" aria-busy="true" aria-label="Đang tải KPH">
    <p className="sr-only" role="status">Đang tải KPH…</p>
    <StorePageHero className="store-kph-underlay">
      <div className="store-kph-toolbar"><label className="store-kph-search"><Search className="store-kph-search-icon" size={18} aria-hidden="true" /><span className="sr-only">Tìm tên hàng hoặc SKU</span><input disabled aria-label="Tìm tên hàng hoặc SKU" placeholder="Tìm tên hàng hoặc SKU" /></label><button disabled className="store-scan-trigger" aria-label="Tạo phiếu TP tươi sống"><Maximize size={20} aria-hidden="true" /></button></div>
    <section className="store-create-actions"><h2>Tạo phiếu KPH</h2><div className="store-two-col">{(["TPCN", "TPTS"] as const).map(kind => <KphCreateButton key={kind} kind={kind} disabled />)}</div></section>
    </StorePageHero>
    <StorePageSurface className="store-ticket-list" aria-label="Phiếu khai báo">
      <StoreStickyTabs><div className="store-tabs" role="group" aria-label="Loại phiếu">{(["TPCN", "TPTS"] as const).map(kind => <button key={kind} disabled aria-pressed={kind === "TPTS"} className={kind === "TPTS" ? "is-active" : ""}>{kind === "TPCN" ? "TP khô & khác" : "TP tươi sống"}<small>{records.filter(record => record.kind === kind).length}</small></button>)}</div></StoreStickyTabs>
      <div className="store-kph-list-controls">
        <div className="store-list-heading"><h2>Phiếu khai báo</h2><span className="store-result-count">{total} phiếu</span></div>
        <div className="store-kph-list-toolbar"><KphSortButton disabled sort="newest" /><button disabled className="store-compact" aria-pressed="false"><ListChecks size={20} aria-hidden="true" /><span>Chọn</span></button><button disabled className="store-filter" aria-label="Lọc phiếu KPH"><SlidersHorizontal size={20} aria-hidden="true" /></button></div>
      </div>
      <StoreKphList desktop={desktop} visible={visible} totalByDate={totalByDate} loading />
      <StoreKphMore shown={visible.length} total={total} loading />
    </StorePageSurface>
  </StorePageLayout>;
}

export function KphFormSkeleton({ kind, onCancel }: { kind: KphKind; onCancel: () => void }) {
  const options = KPH_OPTIONS[kind];
  const field = (label: string, tall = false) => <div className="grid gap-1"><span className="store-form-skeleton-label text-sm">{label}</span><div className={`store-form-skeleton-input${tall ? " is-note" : ""}`} aria-hidden="true" /></div>;
  const choices = (name: "condition" | "resolution", items: readonly { value: string; label: string }[]) => <div className={`choice-grid${items.length === 5 ? " choice-grid-five" : ""}`} aria-hidden="true">{items.map(choice => <div className="choice-card ui-label-palette" key={choice.value} data-tone={getKphChoicePresentation(name, choice.value).tone} data-choice-value={choice.value}><KphChoiceContent kind={name} value={choice.value} label={choice.label} /></div>)}</div>;
  return <div className="create-dialog-form store-form-skeleton" aria-busy="true" aria-label="Đang tải biểu mẫu">
    <section className="form-section"><h3>Hàng hóa</h3><div className="grid gap-3 sm:grid-cols-2">{["Ngày phát hiện", "Mã SKU / UPC", "Nhà cung cấp", "Tên hàng hóa"].map(label => <div key={label}>{field(label)}</div>)}</div></section>
    <section className="form-section"><h3>Số lượng</h3><div className="grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-end gap-3">{field("Số lượng")}<fieldset className="unit-fieldset"><legend className="text-sm font-bold">Đơn vị</legend><div className="unit-options" aria-hidden="true">{["EA", "kg"].map(unit => <label key={unit}><span className="store-choice-skeleton-text">{unit}</span></label>)}</div></fieldset></div></section>
    <section className="form-section"><h3>Tình trạng</h3>{choices("condition", options.conditions)}</section>
    <section className="form-section"><h3>Xử lý</h3>{choices("resolution", options.resolutions)}<div className="mt-3">{field("Ngày xử lý (nếu có)")}</div></section>
    <section className="form-section"><h3>Ghi nhận</h3>{field("Người phát hiện")}<div className="mt-3"><p className="text-sm font-bold">Ảnh minh chứng <span className="text-danger" aria-hidden="true">*</span></p><p className="mt-1 text-xs text-ink-muted">Cần ít nhất một ảnh, tối đa ba ảnh. Ảnh được giữ đúng thứ tự đã chọn.</p><div className="mt-3 grid grid-cols-2 gap-3" aria-hidden="true"><div className="photo-picker">Chụp ảnh</div><div className="photo-picker">Chọn ảnh</div></div><p className="mt-2 text-xs font-semibold text-ink-muted">Chưa chọn ảnh</p></div><div className="mt-3">{field("Ghi chú", true)}</div></section>
    <footer className="create-dialog-footer"><button type="button" aria-label="Hủy mở phiếu" onClick={onCancel}>Hủy</button><button type="button" disabled>Xem lại</button></footer>
  </div>;
}
