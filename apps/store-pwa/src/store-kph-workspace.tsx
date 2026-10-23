import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { StoreStickyTabs, revealBelowStickyTabs } from "./store-sticky-tabs";
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@coopfood-kph/ui";
import { parseDisplayDate, type KphKind } from "@coopfood-kph/kph-rules";
import type { CreatedRecordDraft } from "./create-record-dialog";
import { approvalLabels, type ApprovalStatus, type RecordView } from "./record-view";
import { mockProfile } from "./store-app-mock";
import { figmaAsset } from "./figma-assets";
import { StoreSheet, Summary } from "./store-sheet";
import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { EvidenceImageViewer } from "./image-viewer";
import { KPH_BATCH_SIZE, KPH_DATE_SHORTCUTS, kphDateRange } from "./store-kph-history";
import { StoreKphMore, StoreKphList } from "./store-kph-list";
import { KphQuickSort, KPH_SORT_OPTIONS } from "./store-kph-sort";
import { ArrowDownWideNarrow, CalendarDays, Check, CircleCheck, ListChecks, Maximize, Search, SlidersHorizontal } from "lucide-react";
import { KphCreateControl, preloadKphCreateForm as preloadCreateForm, type KphCreateHandle } from "./store-kph-create-control";
import { kphRecordFromDraft } from "./store-kph-draft-record";
import "./store-kph-create-forms.css";
import { KphCreateButton } from "./store-kph-create-button";
import { useStoreDesktopLayout } from "./use-store-desktop-layout";

function dateIso(value: string) { try { return parseDisplayDate(value); } catch { return null; } }
const nameCollator = new Intl.Collator("vi");

const labels: Record<KphKind, string> = { TPCN: "TP khô & khác", TPTS: "TP tươi sống" };
export const KphWorkspace = memo(function KphWorkspace({ records, onRecordsChange, onNotice }: {
  records: RecordView[]; onRecordsChange: (records: RecordView[]) => void; onNotice: (message: string) => void;
}) {
  const desktop = useStoreDesktopLayout();
  const [kind, setKind] = useState<KphKind>("TPTS");
  const createDialogRef = useRef<KphCreateHandle>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);
  const [collapsedDates, setCollapsedDates] = useState<string[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [approval, setApproval] = useState<"ALL" | ApprovalStatus>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const nextFocusId = useRef<string | null>(null);
  const [shownCount, setShownCount] = useState(KPH_BATCH_SIZE);
  const [active, setActive] = useState<RecordView | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
  // Record URLs outlive workspace navigation. StoreApp owns the records in memory.
  const latestRecords = useRef(records); latestRecords.current = records;
  useEffect(() => { setSelection([]); setCollapsedDates([]); setShownCount(KPH_BATCH_SIZE); setActive(null); }, [kind, approval, from, to, sort, query]);
  const fromIso = from ? dateIso(from) : null, toIso = to ? dateIso(to) : null;
  const filterError = (from && !fromIso) || (to && !toIso) ? "Nhập ngày hợp lệ theo dd/mm/yyyy" : fromIso && toIso && fromIso > toIso ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" : "";
  // Parse/normalize each record once per data update, not in every sort comparison.
  const indexed = useMemo(() => records.map(record => ({ record,
    detected: dateIso(record.detectedDate) ?? "",
    search: `${record.productName} ${record.sku} ${record.barcode ?? ""} ${record.supplier}`.toLocaleLowerCase("vi"),
  })), [records]);
  const dateFiltered = useMemo(() => filterError ? [] : indexed.filter(item => (!fromIso || item.detected >= fromIso) && (!toIso || item.detected <= toIso)), [indexed, filterError, fromIso, toIso]);
  const typeTotals = useMemo(() => dateFiltered.reduce((totals, { record }) => { totals[record.kind]++; return totals; }, { TPCN: 0, TPTS: 0 }), [dateFiltered]);
  const filtered = useMemo(() => {
    const needle = query.toLocaleLowerCase("vi");
    return dateFiltered.filter(({ record, search }) => record.kind === kind && (approval === "ALL" || record.approvalStatus === approval) && search.includes(needle))
      .sort((a, b) => {
        if (sort === "name") return nameCollator.compare(a.record.productName, b.record.productName) || a.record.id.localeCompare(b.record.id);
        const delta = b.detected.localeCompare(a.detected);
        return (sort === "oldest" ? -delta : delta) || a.record.id.localeCompare(b.record.id);
      }).map(({ record }) => record);
  }, [dateFiltered, kind, approval, sort, query]);
  const visible = useMemo(() => filtered.slice(0, shownCount), [filtered, shownCount]);
  useLayoutEffect(() => {
    if (!nextFocusId.current) return;
    const row = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-record-id]") ?? [])
      .find(element => element.dataset.recordId === nextFocusId.current);
    row?.querySelector<HTMLElement>(".store-ticket-open, .store-kph-row-open")?.focus({ preventScroll: true });
    nextFocusId.current = null;
  }, [visible]);
  const totalByDate = useMemo(() => {
    const totals = new Map<string, number>();
    for (const record of filtered) totals.set(record.detectedDate, (totals.get(record.detectedDate) ?? 0) + 1);
    return totals;
  }, [filtered]);
  const eligible = visible.filter(r => selection.includes(r.id) && r.approvalStatus === "APPROVED");
  // Keep modal props stable when only history/filter or account state changes.
  const save = useCallback(async (draft: CreatedRecordDraft) => {
    const record = kphRecordFromDraft(draft);
    onRecordsChange([record, ...latestRecords.current]); setKind(draft.kind); setApproval("ALL"); setFrom(""); setTo(""); setShownCount(KPH_BATCH_SIZE); setSelection([]); setCollapsedDates([]);
    onNotice("Đã tạo phiếu trong phiên dữ liệu mẫu; chưa gửi lên hệ thống.");
  }, [onRecordsChange, onNotice]);
  function review(status: ApprovalStatus) {
    if (!active) return;
    const next = { ...active, approvalStatus: status, reviewedBy: mockProfile.fullName };
    onRecordsChange(records.map(r => r.id === next.id ? next : r)); setActive(next);
    onNotice("Đã cập nhật trạng thái trong dữ liệu mẫu.");
  }
  async function download() {
    if (!eligible.length || exporting) return;
    setExporting(true); setError("");
    try {
      const { buildKphWorkbook } = await import("./excel-export");
      const workbook = await buildKphWorkbook(kind, eligible, mockProfile);
      const bytes = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a"); link.href = url; link.download = `KPH-MAU-${kind}.xlsx`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportOpen(false); onNotice("Đã tải file Excel từ dữ liệu mẫu.");
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể xuất Excel. Thử lại."); }
    finally { setExporting(false); }
  }

  return <StorePageLayout className="store-kph">
    <StorePageHero className="store-kph-underlay">
      <div className="store-kph-toolbar"><label className="store-kph-search"><Search className="store-kph-search-icon" size={18} aria-hidden="true" /><span className="sr-only">Tìm tên hàng hoặc SKU</span><input aria-label="Tìm tên hàng hoặc SKU" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên hàng hoặc SKU" /></label><button className="store-scan-trigger" aria-label={`Tạo phiếu ${labels[kind]}`} onPointerEnter={preloadCreateForm} onFocus={preloadCreateForm} onClick={() => createDialogRef.current?.open(kind)}><Maximize size={20} aria-hidden="true" /></button></div>
    <section className="store-create-actions"><h2>Tạo phiếu KPH</h2><div className="store-two-col">{(["TPCN", "TPTS"] as const).map(k => <KphCreateButton key={k} kind={k} onPointerEnter={preloadCreateForm} onFocus={preloadCreateForm} onClick={() => createDialogRef.current?.open(k)} />)}</div></section>
    </StorePageHero>
    <StorePageSurface className="store-ticket-list" aria-label="Phiếu khai báo" onFocusCapture={revealBelowStickyTabs}>
      <StoreStickyTabs><div className="store-tabs" role="group" aria-label="Loại phiếu">{(["TPCN", "TPTS"] as const).map(k => <button key={k} aria-pressed={kind === k} className={kind === k ? "is-active" : ""} onClick={() => setKind(k)}>{labels[k]}<small>{typeTotals[k]}</small></button>)}</div></StoreStickyTabs>
      <div className="store-kph-list-controls">
        <div className="store-list-heading"><h2>Phiếu khai báo</h2><span className="store-result-count">{filtered.length} phiếu</span></div>
        <div className="store-kph-list-toolbar"><KphQuickSort sort={sort} onChange={setSort} /><button className="store-compact" aria-pressed={selectionMode} onClick={() => { setSelectionMode(!selectionMode); setSelection([]); }}><ListChecks size={20} aria-hidden="true" /><span>{selectionMode ? "Xong" : "Chọn"}</span></button><KphFilterControl from={from} onFromChange={setFrom} to={to} onToChange={setTo} approval={approval} onApprovalChange={setApproval} sort={sort} onSortChange={setSort} filterError={filterError} groupByDate={groupByDate} onGroupByDateChange={value => { setGroupByDate(value); setCollapsedDates([]); }} /></div>
      </div>
      {selectionMode ? <div className="store-batch"><label><input type="checkbox" aria-label="Chọn tất cả" checked={visible.length > 0 && visible.every(r => selection.includes(r.id))} onChange={e => {
        const visibleIds = new Set(visible.map(r => r.id));
        setSelection(e.target.checked ? [...new Set([...selection, ...visibleIds])] : selection.filter(id => !visibleIds.has(id)));
      }} />Chọn tất cả đã hiện</label><span>{selection.length} đã chọn</span><small>Chỉ chọn phiếu đã hiển thị</small><Button className="store-export" disabled={!selection.length} onClick={() => { setError(""); setExportOpen(true); }}><img src={figmaAsset("124-445", "imgFileDown")} alt="" />Xuất Excel</Button></div> : null}
      {filterError ? <p className="store-error" role="alert">{filterError}</p> : null}
      <div ref={listRef}><StoreKphList desktop={desktop} visible={visible} totalByDate={totalByDate} groupByDate={groupByDate} collapsedDates={collapsedDates} onToggleDate={date => setCollapsedDates(dates => dates.includes(date) ? dates.filter(value => value !== date) : [...dates, date])} selectionMode={selectionMode} selection={selection} setSelection={setSelection} setActive={setActive} /></div>
      {!visible.length ? <p className="store-muted store-empty">Không có phiếu phù hợp bộ lọc.</p> : null}
      <StoreKphMore shown={visible.length} total={filtered.length} onMore={() => { nextFocusId.current = filtered[visible.length]?.id ?? null;
        const newDates = new Set(filtered.slice(visible.length, shownCount + KPH_BATCH_SIZE).map(record => record.detectedDate));
        setCollapsedDates(dates => dates.filter(date => !newDates.has(date)));
        setShownCount(count => count + KPH_BATCH_SIZE); }} />
    </StorePageSurface>
    <KphCreateControl ref={createDialogRef} onSaved={save} />

    <StoreSheet open={exportOpen} onOpenChange={open => { if (!exporting) setExportOpen(open); }} className="store-kph-sheet store-kph-export" title="Xuất Excel" description="Xác nhận xuất các phiếu đủ điều kiện">
      <Summary rows={[["Cửa hàng", mockProfile.storeName], ["Loại phiếu", labels[kind]], ["Đủ điều kiện", `${eligible.length} phiếu đã duyệt`], ["Không đưa vào file", `${selection.length - eligible.length} phiếu`]]} />
      <p className="store-muted">Chỉ phiếu đã gửi và đã duyệt được đưa vào file. File này dùng dữ liệu mẫu.</p>{error ? <p className="store-error" role="alert">{error}</p> : null}
      <div className="store-sheet-actions"><Button variant="ghost" disabled={exporting} onClick={() => setExportOpen(false)}>Hủy</Button><Button className="store-button" disabled={!eligible.length || exporting} onClick={() => void download()}>{exporting ? "Đang xuất…" : "Tải xuống"}</Button></div>
    </StoreSheet>
    <StoreSheet className="store-kph-sheet store-kph-detail" open={active !== null} onOpenChange={open => { if (!open) setActive(null); }} title="Chi tiết phiếu KPH" description="Nội dung và trạng thái phiếu trong dữ liệu mẫu">
      {active ? <><p className={`store-kph-detail-kind kind-${active.kind.toLowerCase()}`}>{active.kind === "TPCN" ? "Thực phẩm khô & khác" : "Thực phẩm tươi sống"} · {active.id}</p><section><h3>Hàng hóa</h3><Summary rows={[["Tên hàng hóa", active.productName], ["SKU", active.sku || "—"], ["UPC", active.barcode || "—"], ["Nhà cung cấp", active.supplier || "—"], ["Số lượng", active.quantity]]} /></section><section><h3>Phát hiện & xử lý</h3><Summary rows={[["Ngày phát hiện", active.detectedDate], ["Người phát hiện", active.detectedBy], ["Tình trạng", active.condition], ["Biện pháp", active.resolution], ["Trạng thái duyệt", approvalLabels[active.approvalStatus]]]} /></section><section><h3>Ghi nhận</h3><Summary rows={[["Ghi chú", active.note || "Không có"]]} /><p className="store-evidence-count">Ảnh minh chứng · {active.photos.length}/3</p><div className="store-review-photos">{active.photos.map((p, index) => <button key={p.id} aria-label={`Xem ảnh minh chứng ${index + 1}`} onClick={() => setImage(p)}><img src={p.src} alt={p.alt} /><span>{index + 1}</span></button>)}</div>{!active.photos.length ? <p className="store-muted">Phiếu mẫu chưa có ảnh minh chứng.</p> : null}</section><div className="store-sheet-actions"><Button variant="ghost" onClick={() => review("REJECTED")}>Không duyệt</Button><Button className="store-button" onClick={() => review("APPROVED")}>Duyệt phiếu</Button></div></> : null}
    </StoreSheet>
    <EvidenceImageViewer image={image} open={image !== null} onOpenChange={open => { if (!open) setImage(null); }} />
  </StorePageLayout>;
});

// Opening filters updates this control only; history data changes still belong to the workspace.
const KphFilterControl = memo(function KphFilterControl({ from, onFromChange, to, onToChange, approval, onApprovalChange, sort, onSortChange, filterError, groupByDate, onGroupByDateChange }: {
  from: string; onFromChange: (value: string) => void;
  to: string; onToChange: (value: string) => void;
  approval: "ALL" | ApprovalStatus; onApprovalChange: (value: "ALL" | ApprovalStatus) => void;
  sort: string; onSortChange: (value: string) => void; filterError: string;
  groupByDate: boolean; onGroupByDateChange: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const summaryId = useId();
  const activeCount = Number(Boolean(from)) + Number(Boolean(to)) + Number(approval !== "ALL") + Number(sort !== "newest") + Number(!groupByDate);
  return <>
    <button className={`store-filter ${activeCount ? "is-filtered" : ""}`} aria-label="Lọc phiếu KPH" aria-describedby={summaryId} onClick={() => setOpen(true)}><SlidersHorizontal size={20} aria-hidden="true" />{activeCount ? <span className="store-filter-count" aria-hidden="true">{activeCount}</span> : null}</button>
    <span id={summaryId} className="sr-only">{activeCount ? `${activeCount} tiêu chí lọc, sắp xếp hoặc trình bày đang dùng` : "Chưa có bộ lọc"}</span>
    <StoreSheet open={open} onOpenChange={setOpen} className="store-kph-sheet store-kph-filter" title="Lọc & sắp xếp" description="Bộ lọc phiếu áp dụng ngay khi thay đổi">
      <section className="store-kph-filter-section" aria-labelledby="kph-filter-dates"><h3 id="kph-filter-dates"><CalendarDays size={18} aria-hidden="true" />Ngày phát hiện hàng KPH</h3>
        <div className="store-kph-date-shortcuts" role="group" aria-label="Lọc nhanh ngày phát hiện">{KPH_DATE_SHORTCUTS.map(shortcut => {
          const range = kphDateRange(shortcut.value);
          return <button key={shortcut.value} type="button" aria-pressed={from === range.from && to === range.to} onClick={() => {
            const next = kphDateRange(shortcut.value);
            onFromChange(next.from); onToChange(next.to);
          }}>{shortcut.label}</button>;
        })}</div>
        <div className="store-date-range"><div className="store-field"><label htmlFor="filter-from">Từ ngày</label><CalendarInput id="filter-from" label="Từ ngày" initialMonth={formatBusinessDate(new Date()).iso} value={from} onValueChange={onFromChange} /></div><span aria-hidden="true">→</span><div className="store-field"><label htmlFor="filter-to">Đến ngày</label><CalendarInput id="filter-to" label="Đến ngày" initialMonth={formatBusinessDate(new Date()).iso} value={to} onValueChange={onToChange} /></div></div>
        {filterError ? <p className="store-error" role="alert">{filterError}</p> : null}
      </section>
      <section className="store-kph-filter-section" aria-labelledby="kph-filter-status"><h3 id="kph-filter-status"><CircleCheck size={18} aria-hidden="true" />Trạng thái duyệt</h3><div className="store-choices" role="group" aria-label="Trạng thái duyệt">{([ ["ALL", "Tất cả"], ["PENDING", "Chờ duyệt"], ["APPROVED", "Đã duyệt"], ["REJECTED", "Không duyệt"] ] as const).map(([key, label]) => <button key={key} aria-pressed={approval === key} className={approval === key ? "is-selected" : ""} onClick={() => onApprovalChange(key)}><span>{label}</span><Check size={16} aria-hidden="true" className={approval === key ? "" : "is-hidden"} /></button>)}</div></section>
      <section className="store-kph-filter-section" aria-labelledby="kph-filter-sort"><h3 id="kph-filter-sort"><ArrowDownWideNarrow size={18} aria-hidden="true" />Sắp xếp</h3><div className="store-choices store-kph-filter-sort" role="group" aria-label="Thứ tự phiếu">{KPH_SORT_OPTIONS.map(({value, label}) => <button key={value} aria-pressed={sort === value} className={sort === value ? "is-selected" : ""} onClick={() => onSortChange(value)}><span>{label}</span><Check size={16} aria-hidden="true" className={sort === value ? "" : "is-hidden"} /></button>)}</div></section>
      <section className="store-kph-filter-section" aria-label="Trình bày danh sách"><button type="button" role="switch" aria-checked={groupByDate} aria-label="Nhóm theo ngày" className="store-kph-group-option" onClick={() => onGroupByDateChange(!groupByDate)}><span><strong>Nhóm theo ngày</strong><small>Thu gọn hoặc mở từng ngày</small></span><span className="store-kph-switch-track" aria-hidden="true"><span /></span></button></section>
      <p className="store-muted">Thay đổi áp dụng ngay. Lựa chọn phiếu được đặt lại khi đổi loại phiếu, bộ lọc hoặc sắp xếp. Hiển thị thêm giữ các phiếu đang chọn.</p>
      <div className="store-kph-filter-footer"><button className="store-reset-filter" onClick={() => { onFromChange(""); onToChange(""); onApprovalChange("ALL"); onSortChange("newest"); onGroupByDateChange(true); }}>Đặt lại bộ lọc</button><Button className="store-button" onClick={() => setOpen(false)}>Xong</Button></div>
    </StoreSheet>
  </>;
});
