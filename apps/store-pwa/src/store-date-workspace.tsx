import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { StoreStickyTabs, revealBelowStickyTabs } from "./store-sticky-tabs";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button, Input, ListItemMarker } from "@coopfood-kph/ui";
import { ArrowDownWideNarrow, CalendarDays, Check, ChevronDown, ChevronRight, CircleCheck, Package, Search, SlidersHorizontal } from "lucide-react";
import { acknowledgeDateLot, dateLotKphSeed } from "./store-date-actions";
import { KphCreateControl, type KphCreateHandle } from "./store-kph-create-control";
import { KphCreateButton } from "./store-kph-create-button";
import type { CreatedRecordDraft } from "./create-record-dialog";
import { StoreSheet } from "./store-sheet";
import { figmaAsset } from "./figma-assets";
import { addDays, formatDisplayDate, type KphKind, type LocalDate } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { StoreQuickSort } from "./store-quick-sort";
import { assessDateLot, remainingShelfPercent, DATE_PHASE_LABELS, needsDateAttention, type DatePhase } from "./store-date-assessment";
import { DateConditionLabel, DateProcessingLabel, getDatePhaseTone } from "./store-date-label";
import { ShelfLifeTimeline } from "./store-shelf-timeline";
import { mockBarcodeLookup, mockCatalogProducts, mockProductMetadata, mockProfile, type MockDateLot, type MockDateLotStatus } from "./store-app-mock";

type ActiveDateStatus = Exclude<MockDateLotStatus, "resolved">;
const statuses: Record<ActiveDateStatus, string> = { open: "Mở", acknowledged: "Đã ghi nhận" };
const DATE_SORT_OPTIONS = [
  { value: "default", label: "Mặc định", description: "Giữ thứ tự danh sách ban đầu" },
  { value: "expiry", label: "HSD gần nhất", description: "Lô có hạn sử dụng gần nhất trước" },
  { value: "name", label: "Tên hàng", description: "Theo tên hàng từ A đến Z" },
] as const;
type DateSort = typeof DATE_SORT_OPTIONS[number]["value"];
const displayDate = (date: string) => date.split("-").reverse().join("/");
const normalize = (value: string) => value.trim().toLocaleLowerCase("vi");
function findProduct(query: string, lots: MockDateLot[]) {
  const term = normalize(query);
  if (!term) return undefined;
  const lot = lots.find(item => normalize(item.id) === term);
  return mockCatalogProducts.find(item => item.barcode === term || item.skuCode === term || normalize(item.name) === term || item.skuCode === lot?.sku);
}
function remainingText(remaining: number | null) {
  if (remaining === null) return "Kiểm tra HSD";
  return remaining < 0 ? `Quá ${Math.abs(remaining)} ngày` : remaining === 0 ? "HSD hôm nay" : `Còn ${remaining} ngày`;
}

export function DateWorkspace({ lots, onLotsChange, today: businessToday, onCreateKph, initialLotId }: { lots: MockDateLot[]; onLotsChange: (lots: MockDateLot[]) => void; today?: LocalDate; onCreateKph: (draft: CreatedRecordDraft) => Promise<string>; initialLotId?: string | undefined }) {
  const [query, setQuery] = useState(initialLotId ?? "");
  const [tab, setTab] = useState(initialLotId ? "tracking" : "alerts");
  const [status, setStatus] = useState<ActiveDateStatus>("open");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<DateSort>("default");
  const [phaseFilter, setPhaseFilter] = useState<DatePhase | "all">("all");
  const filterSummaryId = useId();
  const activeFilterCount = Number(tab === "alerts" && status !== "open") + Number(sort !== "default") + Number(phaseFilter !== "all");
  const [activeId, setActiveId] = useState(initialLotId ?? "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(min-width: 900px)").matches);
  const product = findProduct(query, lots);
  const metadata = product ? mockProductMetadata[product.id] : undefined;
  const active = lots.find(lot => lot.id === activeId && lot.status !== "resolved");
  const today = businessToday ?? formatBusinessDate(new Date()).iso;
  const [reminderPicking, setReminderPicking] = useState(false);
  const [actionNotice, setActionNotice] = useState("");
  const [reminderDays, setReminderDays] = useState<1 | 7>(1);
  const [kindChoice, setKindChoice] = useState<MockDateLot | null>(null);
  const createRef = useRef<KphCreateHandle>(null);
  const processingLot = useRef<MockDateLot | null>(null);
  const createFrame = useRef(0);
  const latestLots = useRef(lots); latestLots.current = lots;
  useEffect(() => { setReminderPicking(false); setReminderDays(1); }, [activeId]);
  useEffect(() => () => window.cancelAnimationFrame(createFrame.current), []);
  const assessments = useMemo(() => new Map(lots.map(lot => [lot.id, assessDateLot(lot, today)])), [lots, today]);
  const requiresAttention = (lot: MockDateLot) => needsDateAttention(assessments.get(lot.id)!) || !!(lot.remindOn && lot.remindOn <= today);
  const trackedLots = lots.filter(lot => lot.status !== "resolved");
  const attentionLots = trackedLots.filter(lot => requiresAttention(lot) && lot.status !== "resolved");
  const count = (value: ActiveDateStatus) => trackedLots.filter(lot => lot.status === value && requiresAttention(lot)).length;
  const needle = normalize(query);
  const visible = trackedLots.filter(lot => (tab === "tracking" || (lot.status === status && requiresAttention(lot))) &&
    (phaseFilter === "all" || assessments.get(lot.id)!.phase === phaseFilter) &&
    (!needle || `${lot.name} ${lot.sku} ${lot.id}`.toLocaleLowerCase("vi").includes(needle) || (product?.barcode === needle && lot.sku === product.skuCode)))
    .sort((a, b) => sort === "expiry" ? a.date.localeCompare(b.date) : sort === "name" ? a.name.localeCompare(b.name, "vi") : 0);

  function changeQuery(value: string) {
    requestId.current++;
    setQuery(value); setMessage(""); setBusy(false);
    if (value.trim()) setTab("tracking");
  }
  async function search(value = query) {
    const term = value.trim();
    changeQuery(term);
    if (!term) { setMessage("Nhập SKU, barcode, tên hàng hoặc số lô cần tìm."); return; }
    const exactProduct = findProduct(term, lots);
    if (!exactProduct && lots.some(lot => `${lot.name} ${lot.sku} ${lot.id}`.toLocaleLowerCase("vi").includes(normalize(term)))) return;
    const current = ++requestId.current;
    setBusy(true);
    try {
      const result = await mockBarcodeLookup(exactProduct?.barcode ?? term);
      if (current !== requestId.current) return;
      if (result.status !== "FOUND") setMessage("Không tìm thấy mã hàng. Quét lại hoặc nhập mã khác; không suy đoán sản phẩm.");
    } catch (error) {
      if (current === requestId.current) setMessage(error instanceof Error ? error.message : "Chưa thể tra cứu danh mục. Thử lại.");
    } finally { if (current === requestId.current) setBusy(false); }
  }
  function confirmReminder() {
    if (!active || active.status === "resolved") return;
    onLotsChange(lots.map(lot => lot.id === active.id ? acknowledgeDateLot(lot, today, reminderDays) : lot));
    setActionNotice(`Đã hẹn báo lại ${formatDisplayDate(addDays(today, reminderDays))}.`);
    setReminderPicking(false);
    if (!desktop) setActiveId("");
  }
  function startProcessing(lot: MockDateLot, chosenKind?: KphKind) {
    if (lot.status === "resolved" || lot.kphRecordId) return;
    const { kind, seed } = dateLotKphSeed(lot, today);
    const opener = desktop ? document.activeElement as HTMLElement : Array.from(document.querySelectorAll<HTMLElement>("[data-date-lot-id]")).find(el => el.dataset.dateLotId === lot.id);
    if (!desktop) setActiveId("");
    if (!kind && !chosenKind) { setKindChoice(lot); return; }
    processingLot.current = lot;
    setKindChoice(null);
    createFrame.current = window.requestAnimationFrame(() => createRef.current?.open(chosenKind ?? kind!, seed, opener));
  }
  async function finishKph(draft: CreatedRecordDraft) {
    const source = processingLot.current;
    if (!source || draft.skuCode !== source.sku) throw new Error("Mã hàng trên phiếu phải khớp lô DATE. Hủy để mở lại phiếu từ đúng lô.");
    const recordId = await onCreateKph(draft);
    onLotsChange(latestLots.current.map(lot => lot.id === source.id ? { ...lot, status: "resolved", kphRecordId: recordId } : lot));
    processingLot.current = null;
    setActiveId("");
  }
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(min-width: 900px)");
    const update = () => setDesktop(media.matches);
    update(); media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  useEffect(() => { if (activeId && !visible.some(lot => lot.id === activeId)) setActiveId(""); }, [activeId, visible]);
  useEffect(() => () => { requestId.current++; }, []);

  function detail(lot: MockDateLot) {
    const assessment = assessments.get(lot.id)!;
    const result = assessment.result;
    const percent = remainingShelfPercent(assessment);
    return <>
      <section className="store-date-lot-heading" aria-label="Thông tin lô"><h3>{lot.name}</h3><p><span>SKU {lot.sku}</span><span>Lô {lot.id}</span></p></section>
      <section className="store-date-milestones" aria-label="Mốc DATE của lô">
        <div className="store-date-detail-state"><div className="store-date-milestone-labels"><DateConditionLabel phase={assessment.phase} />{!desktop ? <DateProcessingLabel status={lot.status} /> : null}</div></div><div className="store-date-detail-metrics"><p className={`store-date-remaining${assessment.phase === "EXPIRED" ? " is-expired" : ""}`}><span>Hạn sử dụng</span><strong>{remainingText(assessment.remainingDays)}</strong></p><p className="store-date-percent" data-tone={getDatePhaseTone(assessment.phase)}><span>HSD còn lại</span><strong>{percent === null ? "Chưa đủ dữ liệu" : `${percent}%`}</strong></p></div><div className="store-date-timeline-content">
        {result && assessment.nsx ? <>
          <ShelfLifeTimeline nsx={assessment.nsx} hsd={lot.date} today={today} result={result} />
          <dl className="store-date-milestone-facts"><div><dt>NSX</dt><dd>{formatDisplayDate(assessment.nsx)}</dd></div><div><dt>Cảnh báo</dt><dd>{result.warningDate ? formatDisplayDate(result.warningDate) : "Không áp dụng"}</dd></div><div className={assessment.phase === "EXPIRED" ? "" : "is-primary"}><dt>Hạn lùi</dt><dd>{formatDisplayDate(result.withdrawalDate)}</dd></div><div className={assessment.phase === "EXPIRED" ? "is-expired" : ""}><dt>HSD</dt><dd>{displayDate(lot.date)}</dd></div></dl>
        </> : <div className="store-date-missing-dates"><p>{assessment.message}</p><dl className="store-date-milestone-facts">{lot.manufactured ? <div><dt>NSX</dt><dd>{lot.manufactured}</dd></div> : null}<div><dt>HSD</dt><dd>{displayDate(lot.date)}</dd></div></dl></div>}
        </div>
      </section>
      {lot.remindOn && lot.status !== "resolved" ? <p className="store-date-remind-note">{lot.remindOn > today ? "Báo lại" : "Đã đến lịch báo lại"} {formatDisplayDate(lot.remindOn)}</p> : null}
      {lot.kphRecordId ? <p className="store-date-remind-note" role="status">Đã tạo phiếu KPH cho lô này.</p> : null}
      {reminderPicking ? <fieldset className="store-date-reminder-choices"><legend>Báo lại sau</legend>{([1,7] as const).map(days => <label key={days}><input type="radio" name="date-reminder" checked={reminderDays === days} onChange={() => setReminderDays(days)} /><span>{days === 1 ? "1 ngày" : "1 tuần"}<small>{formatDisplayDate(addDays(today, days))}</small></span></label>)}</fieldset> : null}
      <div className="store-sheet-actions">{reminderPicking ? <><Button className="store-button store-date-reminder-cancel" variant="ghost" onClick={() => setReminderPicking(false)}>Hủy</Button><Button className="store-button" onClick={confirmReminder}>Hẹn báo lại</Button></> : <><Button className="store-date-acknowledge" disabled={lot.status === "resolved"} onClick={() => { setReminderDays(1); setReminderPicking(true); window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".store-date-reminder-choices input:checked")?.focus()); }}>{lot.remindOn && lot.status === "acknowledged" ? "Đổi lịch nhắc" : "Ghi nhận"}</Button><Button className="store-button" disabled={lot.status === "resolved"} onClick={() => startProcessing(lot)}>{lot.status === "resolved" ? "Đã xử lý" : "Xử lý"}</Button></>}</div>
    </>;
  }
  return <StorePageLayout className="store-date">
    <StorePageHero className="store-date-search-panel" contentLabel="Tra mã hàng">
      <form className="store-date-search-form" onSubmit={event => { event.preventDefault(); void search(); }}>
        <label className="store-date-search-wrap"><Search className="store-date-search-icon" size={18} aria-hidden="true" /><span className="sr-only">Tìm SKU, barcode, tên hàng hoặc lô</span><Input className="store-date-search" placeholder="Mã hàng, lô" autoComplete="off" value={query} onChange={event => changeQuery(event.target.value)} /></label>
        <button type="button" className="store-date-scan" aria-label="Quét mã để tìm lô DATE" onClick={() => setScannerOpen(true)}><img className="store-date-scan-icon" data-figma-asset-slot="date-scan" src={figmaAsset("279-1398", "imgFeatherMaximize")} alt="" /></button>
        <Button className="store-button" type="submit" disabled={busy} aria-label={busy ? "Đang tìm…" : "Tìm mã hàng"} aria-busy={busy}>{busy ? "Tìm…" : "Tìm"}</Button>
      </form>
      {message ? <p className="store-date-message" role="status">{message}</p> : null}
    </StorePageHero>
    <StorePageSurface className="store-date-workspace" onFocusCapture={revealBelowStickyTabs}>
      {product ? <section className="store-date-product" aria-label="Thông tin mã hàng"><details key={product.id}><summary className="store-date-product-heading" aria-label={`Thông tin mã hàng: ${product.name}`}><div><h2>{product.name}</h2><p>SKU {product.skuCode} · UPC {product.barcode}</p></div><ChevronDown size={18} aria-hidden="true" /></summary><dl><div><dt>Nhóm hàng</dt><dd>{metadata?.group ?? "Chưa có dữ liệu"}</dd></div><div><dt>Nhà cung cấp</dt><dd>{product.primarySupplier.code} · {product.primarySupplier.name}</dd></div><div><dt>Đơn vị</dt><dd>{metadata?.unit ?? "Chưa có dữ liệu"}</dd></div><div><dt>Cửa hàng</dt><dd>{mockProfile.storeName}</dd></div></dl></details></section> : null}
      <section className="store-date-browser" aria-label="Danh sách lô DATE">
        <StoreStickyTabs><div className="store-tabs" role="group" aria-label="Quản lý DATE">{[["alerts", "Cảnh báo", attentionLots.length], ["tracking", "Theo dõi DATE", trackedLots.length]].map(([key, label, n]) => <button key={key} aria-pressed={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(String(key))}>{label}<small>{n}</small></button>)}</div></StoreStickyTabs>
        <div className="store-date-list-controls">
          <div className="store-date-list-heading"><div><h2>{tab === "alerts" ? "Cần xử lý" : "Theo dõi DATE"}</h2><p className="store-date-result-count">{visible.length} / {trackedLots.length} lô</p></div><button className="store-date-add" disabled title="Chức năng chưa sẵn sàng trong bản dùng thử" aria-describedby="store-date-add-help"><CalendarDays size={18} aria-hidden="true" />Thêm theo dõi</button></div>
          <div className="store-date-toolbar"><StoreQuickSort value={sort} onChange={value => setSort(value as DateSort)} options={DATE_SORT_OPTIONS} title="Sắp xếp lô DATE" groupLabel="Thứ tự lô" /><button className={`store-filter ${activeFilterCount ? "is-filtered" : ""}`} aria-label="Lọc DATE" aria-describedby={filterSummaryId} onClick={() => setFilterOpen(true)}><SlidersHorizontal size={20} aria-hidden="true" />{activeFilterCount ? <span className="store-filter-count" aria-hidden="true">{activeFilterCount}</span> : null}</button></div>
          <span className="sr-only" id={filterSummaryId}>{activeFilterCount ? `${activeFilterCount} tiêu chí lọc hoặc sắp xếp đang dùng` : "Đang dùng bộ lọc mặc định"}</span>
          <span className="sr-only" id="store-date-add-help">Chức năng chưa sẵn sàng trong bản dùng thử</span>
          {tab === "alerts" ? <div className="store-date-statuses">{Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key} className={status === key ? "is-selected" : ""} onClick={() => setStatus(key as ActiveDateStatus)}><span>{label}</span><small>{count(key as ActiveDateStatus)}</small></button>)}</div> : null}
        </div>
        {actionNotice ? <p className="store-date-action-notice" role="status">{actionNotice}</p> : null}
        <div className="store-date-lots">{visible.map(lot => {
          const assessment = assessments.get(lot.id)!;
          const percent = remainingShelfPercent(assessment);
          return <button key={lot.id} data-date-lot-id={lot.id} aria-pressed={activeId === lot.id}
            className={`store-date-lot ui-list-marker-card ${activeId === lot.id ? "is-active" : ""}`} onClick={() => setActiveId(lot.id)}>
            <ListItemMarker variant="bar" tone={getDatePhaseTone(assessment.phase)} />
            <span className="store-date-lot-main">
              <strong>{lot.name}</strong>
              <small className="store-date-lot-identifiers"><span>SKU {lot.sku}</span>{" · "}<span>Lô {lot.id}</span></small>
              <small className="store-date-lot-dates">{lot.manufactured ? <span>NSX {lot.manufactured}</span> : null}<span>HSD {displayDate(lot.date)}</span></small>
            </span>
            <span className="store-date-lot-end">
              <strong className="store-date-percent" data-tone={getDatePhaseTone(assessment.phase)}>
                {percent === null ? assessment.phase === "INVALID" ? "Kiểm tra ngày" : "Chưa đủ dữ liệu" : <><span className="store-date-percent-caption">Còn </span><span className="store-date-percent-value">{percent}%</span><span className="sr-only"> HSD</span></>}
              </strong>
            </span>
            <span className="store-date-lot-footer">
              <span className="store-date-lot-labels">
                <DateConditionLabel phase={assessment.phase} /><DateProcessingLabel status={lot.status} />
                {lot.remindOn && lot.status !== "resolved" ? <span className="store-date-remind-label">Báo lại {formatDisplayDate(lot.remindOn)}</span> : null}
              </span>
              <span className="store-date-lot-action">{lot.status === "resolved" ? "Xem chi tiết" : "Xử lý"}<ChevronRight size={16} aria-hidden="true" /></span>
            </span>
          </button>;
        })}{!visible.length ? <section className="store-date-empty"><Package size={28} aria-hidden="true" /><h3>Không có lô phù hợp</h3><p>{product ? "Mã hàng đã nhận diện. Thử trạng thái khác hoặc bỏ lọc để xem các lô." : "Thử mã hàng, tên hoặc số lô khác; bạn cũng có thể quét lại."}</p><Button variant="ghost" onClick={() => { changeQuery(""); setTab("tracking"); setPhaseFilter("all"); }}>Xem tất cả lô</Button></section> : null}</div>
      </section>
      {desktop ? <section className="store-date-detail" aria-label="Chi tiết lô DATE">{active ? <><div className="store-date-detail-heading"><h2>Chi tiết lô DATE</h2><DateProcessingLabel status={active.status} /></div>{detail(active)}</> : <div className="store-date-detail-placeholder"><CalendarDays size={32} aria-hidden="true" /><h2>Chọn một lô để xem chi tiết</h2><p>Thông tin sản phẩm, ngày và thao tác xử lý sẽ hiển thị tại đây.</p></div>}</section> : null}
    </StorePageSurface>
    <KphCreateControl ref={createRef} onSaved={finishKph} />
    <StoreSheet className="store-date-sheet store-date-kind-sheet" open={!!kindChoice} onOpenChange={open => { if (!open) { const row = Array.from(document.querySelectorAll<HTMLElement>("[data-date-lot-id]")).find(el => el.dataset.dateLotId === kindChoice?.id); setKindChoice(null); window.requestAnimationFrame(() => row?.focus()); } }} title="Chọn loại phiếu KPH" description="Chưa có phân loại hàng; chọn biểu mẫu phù hợp.">{kindChoice ? <><p>{kindChoice.name} · SKU {kindChoice.sku}</p><div className="store-two-col">{(["TPCN","TPTS"] as const).map(kind => <KphCreateButton key={kind} kind={kind} onClick={() => startProcessing(kindChoice, kind)} />)}</div></> : null}</StoreSheet>
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={value => { void search(value); }} presentation="screen" />
    <StoreSheet className="store-date-sheet store-date-filter" open={filterOpen} onOpenChange={setFilterOpen} title="Lọc DATE" description="Bộ lọc và sắp xếp áp dụng ngay khi thay đổi">
      <section className="store-date-filter-section" aria-labelledby="date-filter-phase"><h3 id="date-filter-phase"><CalendarDays size={18} aria-hidden="true" />Tình trạng DATE</h3>
        <div className="store-choices" role="group" aria-label="Tình trạng DATE">{([ ["all", "Tất cả tình trạng"], ...Object.entries(DATE_PHASE_LABELS)]).map(([key, label]) => <button key={key} aria-pressed={phaseFilter === key} className={phaseFilter === key ? "is-selected" : ""} onClick={() => setPhaseFilter(key as DatePhase | "all")}><span>{label}</span><Check size={16} aria-hidden="true" className={phaseFilter === key ? "" : "is-hidden"} /></button>)}</div>
      </section>
      <section className="store-date-filter-section" aria-labelledby="date-filter-status"><h3 id="date-filter-status"><CircleCheck size={18} aria-hidden="true" />Trạng thái xử lý</h3>
        <div className="store-choices" role="group" aria-label="Trạng thái xử lý">
          <button aria-pressed={tab === "tracking"} className={tab === "tracking" ? "is-selected" : ""} onClick={() => setTab("tracking")}><span>Tất cả</span><Check size={16} aria-hidden="true" className={tab === "tracking" ? "" : "is-hidden"} /></button>
          {Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key && tab === "alerts"} className={status === key && tab === "alerts" ? "is-selected" : ""} onClick={() => { setStatus(key as ActiveDateStatus); setTab("alerts"); }}><span>{label}</span><Check size={16} aria-hidden="true" className={status === key && tab === "alerts" ? "" : "is-hidden"} /></button>)}
        </div>
      </section>
      <section className="store-date-filter-section" aria-labelledby="date-filter-sort"><h3 id="date-filter-sort"><ArrowDownWideNarrow size={18} aria-hidden="true" />Sắp xếp</h3><div className="store-choices store-date-filter-sort" role="group" aria-label="Thứ tự lô">{DATE_SORT_OPTIONS.map(option => <button key={option.value} aria-pressed={sort === option.value} className={sort === option.value ? "is-selected" : ""} onClick={() => setSort(option.value)}><span>{option.label}</span><Check size={16} aria-hidden="true" className={sort === option.value ? "" : "is-hidden"} /></button>)}</div></section>
      <p className="store-muted">Thay đổi áp dụng ngay trên các lô phù hợp với mã đang tìm.</p>
      <div className="store-date-filter-footer"><button className="store-date-reset-filter" onClick={() => { setStatus("open"); setTab("alerts"); setSort("default"); setPhaseFilter("all"); }}>Đặt lại bộ lọc</button><Button className="store-button" onClick={() => setFilterOpen(false)}>Xong</Button></div>
    </StoreSheet>
    {!desktop ? <StoreSheet className="store-date-sheet store-date-lot-sheet" open={!!active} onOpenChange={open => { if (!open) setActiveId(""); }} title="Chi tiết lô DATE" description="Ngày và trạng thái xử lý của lô">{active ? detail(active) : null}</StoreSheet> : null}
  </StorePageLayout>;
}
