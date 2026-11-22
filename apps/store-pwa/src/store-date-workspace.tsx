import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { revealBelowStickyTabs } from "./store-sticky-tabs";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button, Field, Input, ListItemMarker } from "@coopfood-kph/ui";
import { ArrowDownWideNarrow, CalendarDays, Check, ChevronDown, ChevronRight, CircleCheck, Package, Search, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { acknowledgeDateLot, dateLotKphSeed } from "./store-date-actions";
import { KphCreateControl, type KphCreateHandle } from "./store-kph-create-control";
import { KphCreateButton } from "./store-kph-create-button";
import type { CreatedRecordDraft } from "./create-record-dialog";
import { StoreSheet } from "./store-sheet";
import { DateCreateButton, DateGroupFilter, DateGroupChip, DEFAULT_DATE_GROUPS } from "./store-date-groups";
import { DateIntake } from "./store-date-intake";
import { StoreProductName } from "./store-product-name";
import { StoreTagStrip } from "./store-tag-strip";
import { useStoreDesktopLayout } from "./use-store-desktop-layout";
import { figmaAsset } from "./figma-assets";
import { addDays, formatDisplayDate, parseDisplayDate, type KphKind, type LocalDate } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
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

const EMPTY_DATE_LOTS: MockDateLot[] = [];
type DateWorkspaceProps = { today?: LocalDate; initialLotId?: string | undefined } & (
  | { mode?: "prototype"; lots: MockDateLot[]; onLotsChange: (lots: MockDateLot[]) => void; onCreateKph: (draft: CreatedRecordDraft) => Promise<string> }
  | { mode: "session"; lots: MockDateLot[]; onLotsChange: (lots: MockDateLot[]) => void; lookupContent: ReactNode; suspended?: boolean }
  | { mode: "unconnected"; lookupContent: ReactNode }
);

export function DateWorkspace(props: DateWorkspaceProps) {
  const unconnected = props.mode === "unconnected";
  const sessionOnly = props.mode === "session";
  const suspended = sessionOnly && !!props.suspended;
  const lots = props.mode === "unconnected" ? EMPTY_DATE_LOTS : props.lots;
  const onLotsChange = props.mode === "prototype" || props.mode === undefined ? props.onLotsChange : undefined;
  const onCreateKph = props.mode === "prototype" || props.mode === undefined ? props.onCreateKph : undefined;
  const { today: businessToday, initialLotId } = props;
  const [query, setQuery] = useState(initialLotId ?? "");
  const [groupFilter, setGroupFilter] = useState("all");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [status, setStatus] = useState<ActiveDateStatus | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<DateSort>("default");
  const [phaseFilter, setPhaseFilter] = useState<DatePhase | "all">("all");
  const filterSummaryId = useId();
  const activeFilterCount = Number(status !== "all") + Number(attentionOnly) + Number(sort !== "default") + Number(phaseFilter !== "all");
  const [activeId, setActiveId] = useState(initialLotId ?? "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const desktop = useStoreDesktopLayout();
  const product = unconnected || sessionOnly ? undefined : findProduct(query, lots);
  const metadata = product ? mockProductMetadata[product.id] : undefined;
  const active = lots.find(lot => lot.id === activeId && lot.status !== "resolved");
  const today = businessToday ?? formatBusinessDate(new Date()).iso;
  const [reminderPicking, setReminderPicking] = useState(false);
  const [actionNotice, setActionNotice] = useState("");
  const [reminderDays, setReminderDays] = useState<1 | 7>(1);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState<Record<string, string>>({});
  const [manualError, setManualError] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
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
  const kindLots = trackedLots.filter(lot => groupFilter === "all" || (lot.group?.id ?? "unclassified") === groupFilter);
  const attentionCount = kindLots.filter(lot => lot.status === "open" && requiresAttention(lot)).length;
  const needle = normalize(query);
  const visible = kindLots.filter(lot => (!attentionOnly || (lot.status === "open" && requiresAttention(lot))) &&
    (status === "all" || lot.status === status) && (phaseFilter === "all" || assessments.get(lot.id)!.phase === phaseFilter) &&
    (!needle || `${lot.name} ${lot.sku} ${lot.id}`.toLocaleLowerCase("vi").includes(needle) || (product?.barcode === needle && lot.sku === product.skuCode)))
    .sort((a, b) => sort === "expiry" ? a.date.localeCompare(b.date) : sort === "name" ? a.name.localeCompare(b.name, "vi") : 0);

  function changeQuery(value: string) {
    requestId.current++;
    setQuery(value); setMessage(""); setBusy(false);
    if (value.trim()) {
      setAttentionOnly(false); setStatus("all");
      const exactLot = lots.find(lot => normalize(lot.id) === normalize(value) || lot.sku === value.trim());
      if (exactLot) setGroupFilter(exactLot.group?.id ?? "unclassified");
    }
  }
  async function search(value = query) {
    if (unconnected || sessionOnly) return;
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
    if (unconnected || sessionOnly || !onLotsChange || !active || active.status === "resolved") return;
    onLotsChange(lots.map(lot => lot.id === active.id ? acknowledgeDateLot(lot, today, reminderDays) : lot));
    setActionNotice(`Đã hẹn báo lại ${formatDisplayDate(addDays(today, reminderDays))}.`);
    setReminderPicking(false);
    setActiveId("");
  }
  function startProcessing(lot: MockDateLot, chosenKind?: KphKind) {
    if (unconnected || sessionOnly || lot.status === "resolved" || lot.kphRecordId) return;
    const { kind, seed } = dateLotKphSeed(lot, today);
    const row = Array.from(document.querySelectorAll<HTMLElement>("[data-date-lot-id]")).find(el => el.dataset.dateLotId === lot.id);
    const opener = row?.querySelector<HTMLElement>(".store-kph-row-open") ?? row;
    setActiveId("");
    if (!kind && !chosenKind) { setKindChoice(lot); return; }
    processingLot.current = lot;
    setKindChoice(null);
    createFrame.current = window.requestAnimationFrame(() => createRef.current?.open(chosenKind ?? kind!, seed, opener));
  }
  async function finishKph(draft: CreatedRecordDraft) {
    if (unconnected || !onCreateKph || !onLotsChange) throw new Error("DATE chưa kết nối; chưa thể tạo phiếu từ lô.");
    const source = processingLot.current;
    if (!source || draft.skuCode !== source.sku) throw new Error("Mã hàng trên phiếu phải khớp lô DATE. Hủy để mở lại phiếu từ đúng lô.");
    const recordId = await onCreateKph(draft);
    onLotsChange(latestLots.current.map(lot => lot.id === source.id ? { ...lot, status: "resolved", kphRecordId: recordId } : lot));
    processingLot.current = null;
    setActiveId("");
  }
  useEffect(() => { if (activeId && !visible.some(lot => lot.id === activeId)) setActiveId(""); }, [activeId, visible]);
  useEffect(() => () => { requestId.current++; }, []);

  function detail(lot: MockDateLot) {
    const assessment = assessments.get(lot.id)!;
    const result = assessment.result;
    const percent = remainingShelfPercent(assessment);
    return <>
      <section className="store-date-lot-heading" aria-label="Thông tin lô"><h3>{lot.name}</h3><p><span>SKU {lot.sku}</span><span>Lô {lot.id}</span></p></section>
      <section className="store-date-milestones" aria-label="Mốc DATE của lô">
        <div className="store-date-detail-state"><div className="store-date-milestone-labels"><DateGroupChip group={lot.group} /><DateConditionLabel phase={assessment.phase} /><DateProcessingLabel status={lot.status} /></div></div><div className="store-date-detail-metrics"><p className={`store-date-remaining${assessment.phase === "EXPIRED" ? " is-expired" : ""}`}><span>Hạn sử dụng</span><strong>{remainingText(assessment.remainingDays)}</strong></p><p className="store-date-percent" data-tone={getDatePhaseTone(assessment.phase)}><span>HSD còn lại</span><strong>{percent === null ? "Chưa đủ dữ liệu" : `${percent}%`}</strong></p></div><div className="store-date-timeline-content">
        {result && assessment.nsx ? <>
          <ShelfLifeTimeline nsx={assessment.nsx} hsd={lot.date} today={today} result={result} />
          <dl className="store-date-milestone-facts"><div><dt>NSX</dt><dd>{formatDisplayDate(assessment.nsx)}</dd></div><div><dt>Cảnh báo</dt><dd>{result.warningDate ? formatDisplayDate(result.warningDate) : "Không áp dụng"}</dd></div><div className={assessment.phase === "EXPIRED" ? "" : "is-primary"}><dt>Hạn lùi</dt><dd>{formatDisplayDate(result.withdrawalDate)}</dd></div><div className={assessment.phase === "EXPIRED" ? "is-expired" : ""}><dt>HSD</dt><dd>{displayDate(lot.date)}</dd></div></dl>
        </> : <div className="store-date-missing-dates"><p>{assessment.message}</p><dl className="store-date-milestone-facts">{lot.manufactured ? <div><dt>NSX</dt><dd>{lot.manufactured}</dd></div> : null}<div><dt>HSD</dt><dd>{displayDate(lot.date)}</dd></div></dl></div>}
        </div>
      </section>
      {lot.remindOn && lot.status !== "resolved" ? <p className="store-date-remind-note">{lot.remindOn > today ? "Báo lại" : "Đã đến lịch báo lại"} {formatDisplayDate(lot.remindOn)}</p> : null}
      {lot.kphRecordId ? <p className="store-date-remind-note" role="status">Đã tạo phiếu KPH cho lô này.</p> : null}
      {reminderPicking && !sessionOnly ? <fieldset className="store-date-reminder-choices"><legend>Báo lại sau</legend>{([1,7] as const).map(days => <label key={days}><input type="radio" name="date-reminder" checked={reminderDays === days} onChange={() => setReminderDays(days)} /><span>{days === 1 ? "1 ngày" : "1 tuần"}<small>{formatDisplayDate(addDays(today, days))}</small></span></label>)}</fieldset> : null}
      <div className="store-sheet-actions">{sessionOnly ? <p className="store-muted">Ghi nhận, nhắc lại và xử lý KPH chưa kết nối.</p> : reminderPicking ? <><Button className="store-button store-date-reminder-cancel" variant="ghost" onClick={() => setReminderPicking(false)}>Hủy</Button><Button className="store-button" onClick={confirmReminder}>Hẹn báo lại</Button></> : <><Button className="store-date-acknowledge" disabled={lot.status === "resolved"} onClick={() => { setReminderDays(1); setReminderPicking(true); window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".store-date-reminder-choices input:checked")?.focus()); }}>{lot.remindOn && lot.status === "acknowledged" ? "Đổi lịch nhắc" : "Ghi nhận"}</Button><Button className="store-button" disabled={lot.status === "resolved"} onClick={() => startProcessing(lot)}>{lot.status === "resolved" ? "Đã xử lý" : "Xử lý"}</Button></>}</div>
    </>;
  }
  function saveManualLot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (props.mode !== "session" || props.suspended) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    try {
      const sku = value("sku"), name = value("name"), id = value("lot");
      if (!sku || !name) throw new Error("Nhập SKU và tên hàng.");
      const manufactured = parseDisplayDate(value("manufactured"));
      const date = parseDisplayDate(value("expiry"));
      if (date <= manufactured) throw new Error("HSD phải sau NSX.");
      if (id && lots.some(lot => normalize(lot.id) === normalize(id))) throw new Error("Số lô đã có trong danh sách.");
      props.onLotsChange([{ id: id || crypto.randomUUID(), sku, name, manufactured: formatDisplayDate(manufactured), date, status: "open", group: null }, ...lots]);
      setManualOpen(false); setManualError("");
    } catch (error) { setManualError(error instanceof Error ? error.message : "Kiểm tra ngày dd/mm/yyyy."); }
  }
  return <StorePageLayout className="store-date">
    <StorePageHero className="store-date-search-panel" contentLabel="Tra mã hàng">
      {props.mode === "unconnected" ? <div className="store-date-online-lookup">{props.lookupContent}</div> : sessionOnly ? <>
        <div className="store-online-actions"><Button type="button" variant="secondary" disabled={props.suspended} aria-expanded={lookupOpen} onClick={() => setLookupOpen(value => !value)}>Quét / tra mã hàng</Button></div>
        {lookupOpen ? <div className="store-date-online-lookup">{props.lookupContent}</div> : null}
      </> : <form className="store-date-search-form" onSubmit={event => { event.preventDefault(); void search(); }}>
        <label className="store-date-search-wrap"><Search className="store-date-search-icon" size={18} aria-hidden="true" /><span className="sr-only">Tìm SKU, barcode, tên hàng hoặc lô</span><Input className="store-date-search" placeholder="Mã hàng, lô" autoComplete="off" value={query} onChange={event => changeQuery(event.target.value)} /></label>
        <button type="button" className="store-date-scan" aria-label="Quét mã để tìm lô DATE" onClick={() => setScannerOpen(true)}><img className="store-date-scan-icon" data-figma-asset-slot="date-scan" src={figmaAsset("279-1398", "imgFeatherMaximize")} alt="" /></button>
        <Button className="store-button" type="submit" disabled={busy} aria-label={busy ? "Đang tìm…" : "Tìm mã hàng"} aria-busy={busy}>{busy ? "Tìm…" : "Tìm"}</Button>
      </form>}
      {sessionOnly ? <DateCreateButton disabled={props.suspended} onClick={() => { setManualDraft({}); setManualError(""); setManualOpen(true); }} /> : <DateCreateButton disabled={unconnected} onClick={() => setIntakeOpen(true)} />}
      {message ? <p className="store-date-message" role="status">{message}</p> : null}
    </StorePageHero>
    <StorePageSurface className="store-date-workspace" onFocusCapture={revealBelowStickyTabs}>

      <section className="store-date-browser" aria-label="Danh sách lô DATE">
        {sessionOnly && <p className="store-muted">Lô chỉ được giữ trong phiên của cửa hàng, chưa đồng bộ. Tải lại trang sẽ xóa danh sách này.</p>}
        <DateGroupFilter disabled={unconnected || sessionOnly} groups={unconnected || sessionOnly ? [] : DEFAULT_DATE_GROUPS} value={groupFilter} onChange={setGroupFilter} />
        <div className="store-date-list-controls store-kph-list-controls">
          <div className="store-date-list-heading store-list-heading"><h2>Lô DATE</h2><span className="store-date-result-count">{unconnected ? "Chưa kết nối dữ liệu" : `${visible.length} lô`}</span></div>
          <div className="store-date-toolbar store-kph-list-toolbar">

            <button className="store-compact" disabled={unconnected} aria-pressed={attentionOnly} onClick={() => { setAttentionOnly(!attentionOnly); setStatus("all"); }}><TriangleAlert size={20} aria-hidden="true" /><span>Cần chú ý</span><small>{unconnected ? "—" : attentionCount}</small></button>
            <button className={`store-filter ${activeFilterCount ? "is-filtered" : ""}`} aria-label="Lọc DATE" disabled={unconnected} aria-describedby={filterSummaryId} onClick={() => setFilterOpen(true)}><SlidersHorizontal size={20} aria-hidden="true" />{activeFilterCount ? <span className="store-filter-count" aria-hidden="true">{activeFilterCount}</span> : null}</button>
          </div>
          <span className="sr-only" id={filterSummaryId}>{activeFilterCount ? `${activeFilterCount} tiêu chí lọc hoặc sắp xếp đang dùng` : "Đang dùng bộ lọc mặc định"}</span>
        </div>
      {product ? <section className="store-date-product" aria-label="Thông tin mã hàng"><details key={product.id}><summary className="store-date-product-heading" aria-label={`Thông tin mã hàng: ${product.name}`}><div><h2>{product.name}</h2><p>SKU {product.skuCode} · UPC {product.barcode}</p></div><ChevronDown size={18} aria-hidden="true" /></summary><dl><div><dt>Nhóm hàng</dt><dd>{metadata?.group ?? "Chưa có dữ liệu"}</dd></div><div><dt>Nhà cung cấp</dt><dd>{product.primarySupplier.code} · {product.primarySupplier.name}</dd></div><div><dt>Đơn vị</dt><dd>{metadata?.unit ?? "Chưa có dữ liệu"}</dd></div><div><dt>Cửa hàng</dt><dd>{mockProfile.storeName}</dd></div></dl></details></section> : null}

        {actionNotice ? <p className="store-date-action-notice" role="status">{actionNotice}</p> : null}
        {desktop ? <div className="store-kph-table-wrap"><table className="store-kph-table store-date-table">
          <colgroup>{[23, 10, 22, 10, 21, 10, 4].map((width, index) => <col key={index} style={{width: `${width}%`}} />)}</colgroup>
          <thead><tr><th>Hàng hóa</th><th>SKU</th><th>Lô · Ngày</th><th>HSD còn lại</th><th>Nhóm / DATE</th><th>Xử lý</th><th><span className="sr-only">Mở chi tiết</span></th></tr></thead>
          <tbody>{visible.map(lot => {
            const assessment = assessments.get(lot.id)!;
            const percent = remainingShelfPercent(assessment);
            return <tr key={lot.id} data-date-lot-id={lot.id} aria-selected={activeId === lot.id} className={`store-kph-record-row${activeId === lot.id ? " is-active" : ""}`} onClick={event => {
              if (event.target instanceof Element && !event.target.closest("button, .store-tag-shell")) {
                event.currentTarget.querySelector<HTMLButtonElement>(".store-kph-row-open")?.focus({preventScroll: true});
                setActiveId(lot.id);
              }
            }}>
              <td className="store-kph-leading-cell"><ListItemMarker variant="bar" tone={getDatePhaseTone(assessment.phase)} /><button className="store-kph-row-open" aria-label={`Mở lô ${lot.name} ${lot.id}`} onClick={() => setActiveId(lot.id)}><StoreProductName text={lot.name} /></button></td>
              <td><span className="store-sku" title={lot.sku}>{lot.sku}</span></td>
              <td><strong>Lô {lot.id}</strong><small>{lot.manufactured ? `NSX ${lot.manufactured} · ` : ""}HSD {displayDate(lot.date)}</small></td>
              <td><strong className="store-date-percent-value store-date-percent" data-tone={getDatePhaseTone(assessment.phase)}>{percent === null ? "Chưa đủ dữ liệu" : `${percent}%`}</strong></td>
              <td><StoreTagStrip label={`Nhóm và tình trạng ${lot.name}`}><DateGroupChip group={lot.group} /><DateConditionLabel phase={assessment.phase} /></StoreTagStrip></td>
              <td><DateProcessingLabel status={lot.status} />{lot.remindOn ? <small>Báo lại {formatDisplayDate(lot.remindOn)}</small> : null}</td>
              <td className="store-kph-chevron-cell"><ChevronRight size={16} aria-hidden="true" /></td>
            </tr>;
          })}</tbody>
        </table></div> : <div className="store-date-lots">{visible.map(lot => {
          const assessment = assessments.get(lot.id)!;
          const percent = remainingShelfPercent(assessment);
          return <div key={lot.id} data-date-lot-id={lot.id} className={`store-date-lot ui-list-marker-card ${activeId === lot.id ? "is-active" : ""}`} onClick={event => { if (event.target instanceof Element && !event.target.closest("button, .store-tag-shell")) setActiveId(lot.id); }}>
            <ListItemMarker variant="bar" tone={getDatePhaseTone(assessment.phase)} />
            <button className="store-date-lot-open" aria-pressed={activeId === lot.id} aria-label={`Mở lô ${lot.name} · Lô ${lot.id}`} aria-describedby={`${filterSummaryId}-${encodeURIComponent(lot.id)}-percent ${filterSummaryId}-${encodeURIComponent(lot.id)}-facts ${filterSummaryId}-${encodeURIComponent(lot.id)}-dates`} onClick={() => setActiveId(lot.id)}>
              <span className="store-date-lot-main"><strong><StoreProductName text={lot.name} /></strong></span>
              <span className="store-date-lot-end"><strong id={`${filterSummaryId}-${encodeURIComponent(lot.id)}-percent`} className="store-date-percent" data-tone={getDatePhaseTone(assessment.phase)}><span className="sr-only">HSD còn lại: </span>{percent === null ? "Chưa đủ dữ liệu" : `${percent}%`}</strong><ChevronRight size={16} aria-hidden="true" /></span>
            </button>
            <span id={`${filterSummaryId}-${encodeURIComponent(lot.id)}-facts`} className="store-date-lot-footer"><small className="store-date-lot-identifiers store-sku" title={lot.sku}><span className="sr-only">SKU </span>{lot.sku}<span className="sr-only"> · Lô {lot.id}</span></small>
              <StoreTagStrip className="store-date-lot-labels" label={`Nhãn lô ${lot.name}`}><DateGroupChip group={lot.group} /><DateConditionLabel phase={assessment.phase} />{lot.remindOn ? <span className="store-date-remind-label">Báo lại {formatDisplayDate(lot.remindOn)}</span> : null}</StoreTagStrip>
              <span className="store-date-lot-processing"><DateProcessingLabel status={lot.status} /></span>
            </span>
            <small id={`${filterSummaryId}-${encodeURIComponent(lot.id)}-dates`} className="store-date-lot-dates">{lot.manufactured ? <span>NSX {lot.manufactured}</span> : null}<span>HSD {displayDate(lot.date)}</span></small>
          </div>;
        })}</div>}
        {!visible.length ? <section className="store-date-empty"><Package size={28} aria-hidden="true" /><h3>{unconnected ? "Danh sách DATE chưa kết nối" : "Không có lô phù hợp"}</h3><p>{unconnected ? "Bạn vẫn có thể tra mã hàng. Theo dõi, ghi nhận và xử lý lô sẽ khả dụng khi kết nối dữ liệu DATE." : product ? "Mã hàng đã nhận diện. Thử trạng thái khác hoặc bỏ lọc để xem các lô." : "Thử mã hàng, tên hoặc số lô khác; bạn cũng có thể quét lại."}</p>{!unconnected ? <Button variant="ghost" onClick={() => { changeQuery(""); setGroupFilter("all"); setAttentionOnly(false); setStatus("all"); setPhaseFilter("all"); }}>Xem tất cả lô</Button> : null}</section> : null}
      </section>

    </StorePageSurface>
    {manualOpen && sessionOnly && !suspended ? <StoreSheet
      open
      onOpenChange={open => { if (!open) { setManualOpen(false); setManualError(""); } }}
      title="Thêm theo dõi DATE"
      description="Lô chỉ được giữ trong phiên cửa hàng hiện tại."
    >
      <form className="store-date-intake" onSubmit={saveManualLot} onChange={event => {
        const input = event.target;
        if (input instanceof HTMLInputElement) setManualDraft(current => ({ ...current, [input.name]: input.value }));
      }}>
        <Field label="SKU" htmlFor="online-date-sku" required>
          <Input id="online-date-sku" name="sku" defaultValue={manualDraft.sku ?? ""} required disabled={props.suspended} />
        </Field>
        <Field label="Tên hàng" htmlFor="online-date-name" required>
          <Input id="online-date-name" name="name" defaultValue={manualDraft.name ?? ""} required disabled={props.suspended} />
        </Field>
        <Field label="Số lô (nếu có)" htmlFor="online-date-lot">
          <Input id="online-date-lot" name="lot" defaultValue={manualDraft.lot ?? ""} disabled={props.suspended} />
        </Field>
        <Field label="NSX" htmlFor="online-date-manufactured" required>
          <Input id="online-date-manufactured" name="manufactured" defaultValue={manualDraft.manufactured ?? ""} placeholder="dd/mm/yyyy" required disabled={props.suspended} />
        </Field>
        <Field label="HSD" htmlFor="online-date-expiry" required>
          <Input id="online-date-expiry" name="expiry" defaultValue={manualDraft.expiry ?? ""} placeholder="dd/mm/yyyy" required disabled={props.suspended} />
        </Field>
        {manualError ? <p role="alert">{manualError}</p> : null}
        <div className="store-sheet-actions">
          <Button type="button" variant="ghost" disabled={props.suspended} onClick={() => setManualOpen(false)}>Hủy</Button>
          <Button type="submit" disabled={props.suspended}>Lưu lô trong phiên</Button>
        </div>
      </form>
    </StoreSheet> : null}
    {intakeOpen && onLotsChange && !unconnected ? <DateIntake today={today} groups={DEFAULT_DATE_GROUPS} existingLots={lots} onCancel={() => setIntakeOpen(false)} onSave={lot => { onLotsChange([...lots, lot]); setIntakeOpen(false); setGroupFilter(lot.group?.id ?? "unclassified"); }} /> : null}
    {!unconnected ? <KphCreateControl ref={createRef} onSaved={finishKph} /> : null}
    <StoreSheet className="store-date-sheet store-date-kind-sheet" open={!!kindChoice} onOpenChange={open => { if (!open) { const row = Array.from(document.querySelectorAll<HTMLElement>("[data-date-lot-id]")).find(el => el.dataset.dateLotId === kindChoice?.id); setKindChoice(null); window.requestAnimationFrame(() => (row?.querySelector<HTMLElement>(".store-kph-row-open") ?? row)?.focus()); } }} title="Chọn loại phiếu KPH" description="Chưa có phân loại hàng; chọn biểu mẫu phù hợp.">{kindChoice ? <><p>{kindChoice.name} · SKU {kindChoice.sku}</p><div className="store-two-col">{(["TPCN","TPTS"] as const).map(kind => <KphCreateButton key={kind} kind={kind} onClick={() => startProcessing(kindChoice, kind)} />)}</div></> : null}</StoreSheet>
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={value => { void search(value); }} presentation="screen" />
    {!suspended && <StoreSheet className="store-date-sheet store-date-filter" open={filterOpen} onOpenChange={setFilterOpen} title="Lọc DATE" description="Bộ lọc và sắp xếp áp dụng ngay khi thay đổi">
      <section className="store-date-filter-section" aria-labelledby="date-filter-phase"><h3 id="date-filter-phase"><CalendarDays size={18} aria-hidden="true" />Tình trạng DATE</h3>
        <div className="store-choices" role="group" aria-label="Tình trạng DATE">{([ ["all", "Tất cả tình trạng"], ...Object.entries(DATE_PHASE_LABELS)]).map(([key, label]) => <button key={key} aria-pressed={phaseFilter === key} className={phaseFilter === key ? "is-selected" : ""} onClick={() => setPhaseFilter(key as DatePhase | "all")}><span>{label}</span><Check size={16} aria-hidden="true" className={phaseFilter === key ? "" : "is-hidden"} /></button>)}</div>
      </section>
      <section className="store-date-filter-section" aria-labelledby="date-filter-status"><h3 id="date-filter-status"><CircleCheck size={18} aria-hidden="true" />Trạng thái xử lý</h3>
        <div className="store-choices" role="group" aria-label="Trạng thái xử lý">
          <button aria-pressed={status === "all"} className={status === "all" ? "is-selected" : ""} onClick={() => { setStatus("all"); setAttentionOnly(false); }}><span>Tất cả</span><Check size={16} aria-hidden="true" className={status === "all" ? "" : "is-hidden"} /></button>
          {Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key} className={status === key ? "is-selected" : ""} onClick={() => { setStatus(key as ActiveDateStatus); setAttentionOnly(false); }}><span>{label}</span><Check size={16} aria-hidden="true" className={status === key ? "" : "is-hidden"} /></button>)}
        </div>
      </section>
      <section className="store-date-filter-section" aria-labelledby="date-filter-sort"><h3 id="date-filter-sort"><ArrowDownWideNarrow size={18} aria-hidden="true" />Sắp xếp</h3><div className="store-choices store-date-filter-sort" role="group" aria-label="Thứ tự lô">{DATE_SORT_OPTIONS.map(option => <button key={option.value} aria-pressed={sort === option.value} className={sort === option.value ? "is-selected" : ""} onClick={() => setSort(option.value)}><span>{option.label}</span><Check size={16} aria-hidden="true" className={sort === option.value ? "" : "is-hidden"} /></button>)}</div></section>
      <p className="store-muted">Thay đổi áp dụng ngay trên các lô phù hợp với mã đang tìm.</p>
      <div className="store-date-filter-footer"><button className="store-date-reset-filter" onClick={() => { setStatus("all"); setAttentionOnly(false); setSort("default"); setPhaseFilter("all"); }}>Đặt lại bộ lọc</button><Button className="store-button" onClick={() => setFilterOpen(false)}>Xong</Button></div>
    </StoreSheet>}
    {!suspended && <StoreSheet className="store-date-sheet store-date-lot-sheet" open={!!active} onOpenChange={open => { if (!open) setActiveId(""); }} title="Chi tiết lô DATE" description="Ngày và trạng thái xử lý của lô">{active ? detail(active) : null}</StoreSheet>}
  </StorePageLayout>;
}
