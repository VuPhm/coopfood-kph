import { dateLotBatchLabel } from "./store-date-lot";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button, Input, ListItemMarker, Select } from "@coopfood-kph/ui";
import { ArrowLeft, CalendarDays, Check, CircleCheck, ChevronRight, FileDown, Info, Package, Save, Printer } from "lucide-react";
import { formatDisplayDate } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";
import { CalendarInput } from "./calendar-input";
import { StoreSheet, Summary } from "./store-sheet";
import { ShelfLifeTimeline } from "./store-shelf-timeline";
import { DateConditionLabel, DateProcessingLabel, getDatePhaseTone } from "./store-date-label";
import { mockProfile, type MockDateLot } from "./store-app-mock";
import { createDateReport, defaultReportFilter, filterLabel, parsePeriod, periodLabel, phaseOptions, presetPeriod, processingLabels, selectDateReport, type DateReportRow, type ReportFilter } from "./store-date-report-model";
import { suggestedReportTitle, suggestedTemplateTitle, templateNameError, type ReportTemplate, type SavedDateReport } from "./store-report-library";
import { StoreActionDock } from "./store-action-dock";
import { StoreSelectionBar } from "./store-selection-bar";
import { flushSync } from "react-dom";
import { DATE_PHASE_LABELS } from "./store-date-assessment";
import { ReportSurface } from "./store-report-surface";
import { StoreSearchField } from "./store-search-field";
import { StoreReportSettings } from "./store-report-settings";
import { ReportTemplatePicker } from "./store-report-template-picker";
import "./store-report-composer.css";
import "./store-date-report.css";
import "./store-report-soft.css";

function useReportMedia(query: string) {
  const source = useMemo(() => {
    const media = window.matchMedia(query);
    return {
      subscribe: (notify: () => void) => { media.addEventListener("change", notify); return () => media.removeEventListener("change", notify); },
      snapshot: () => media.matches,
    };
  }, [query]);
  return useSyncExternalStore(source.subscribe, source.snapshot);
}

export function DateReportWorkspace({ lots, template, savedReport, templates, editableTemplate, onBack, onDismiss, onChooseTemplate, onCreate, onSaveTemplate, onReuse }: {
  lots: MockDateLot[]; template: ReportTemplate; savedReport: SavedDateReport | null; templates: ReportTemplate[]; editableTemplate: boolean;
  onBack: () => void; onDismiss: () => void; onChooseTemplate: (template: ReportTemplate) => void; onCreate: (report: SavedDateReport) => void;
  onSaveTemplate: (template: ReportTemplate) => void; onReuse: (report: SavedDateReport) => void;
}) {
  const desktop = useReportMedia("(min-width: 1100px)");
  const printMedia = useReportMedia("print");
  const [printRequested, setPrintRequested] = useState(false);
  const printing = printMedia || printRequested;
  const [rowLimit, setRowLimit] = useState(40);
  useLayoutEffect(() => {
    const before = () => flushSync(() => setPrintRequested(true)); const after = () => setPrintRequested(false);
    window.addEventListener("beforeprint", before); window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, []);
  const currentTemplate = templates.find(item => item.id === template.id) ?? template;
  const displayTemplateTitle = currentTemplate.title;
  const today = formatBusinessDate(new Date()).iso;
  const [period, setPeriod] = useState(() => presetPeriod("month", today));
  const [filter, setFilter] = useState<ReportFilter>({ ...template.filter, search: "" });
  const [periodOpen, setPeriodOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [start, setStart] = useState(formatDisplayDate(period.start));
  const [end, setEnd] = useState(formatDisplayDate(period.end));
  const [periodError, setPeriodError] = useState("");
  const [active, setActive] = useState<DateReportRow | null>(null);
  const report = savedReport;
  const [selectedIds, setSelectedIds] = useState<string[] | null>(() => template.selectedIds ? [...template.selectedIds] : null);
  const [search, setSearch] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [saveTarget, setSaveTarget] = useState<"new" | "update">("new");
  const [createOpen, setCreateOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportNameError, setReportNameError] = useState("");
  const [templateMode, setTemplateMode] = useState<"filter" | "items">("filter");
  const [notice, setNotice] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const saveTemplateRef = useRef<HTMLButtonElement>(null);
  const createReportRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); headingRef.current?.focus({ preventScroll: true }); }, [report]);
  const eligible = useMemo(() => selectDateReport(lots, today, period, { ...filter, search: "" }), [lots, today, period, filter.phase, filter.processing]);
  const needle = search.trim().toLocaleLowerCase("vi");
  const rows = useMemo(() => report?.rows ?? eligible.filter(row => !needle || `${row.sku} ${dateLotBatchLabel(row)} ${row.name}`.toLocaleLowerCase("vi").includes(needle)), [report, eligible, needle]);
  const selected = useMemo(() => { const ids = selectedIds === null ? null : new Set(selectedIds); return eligible.filter(row => ids === null || ids.has(row.id)); }, [eligible, selectedIds]);
  const hiddenSelected = useMemo(() => { const visible = new Set(rows.map(row => row.id)); return selected.filter(row => !visible.has(row.id)).length; }, [rows, selected]);
  const shownRows = printing ? rows : rows.slice(0, rowLimit);
  useEffect(() => { setRowLimit(40); }, [search, filter.phase, filter.processing, period.start, period.end]);
  const missingTemplateItems = template.selectedIds?.filter(id => !lots.some(lot => lot.id === id)).length ?? 0;
  const suggestedName = suggestedTemplateTitle(filter, templateMode === "items" ? selected.length : null, templates);
  const templateHolder = saveTarget === "update" ? displayTemplateTitle : suggestedName;
  const reportHolder = suggestedReportTitle(displayTemplateTitle, period);
  function openTemplateSave() {
    const nextMode = selectedIds === null ? "filter" : "items";
    setSaveTarget(editableTemplate ? "update" : "new");
    setTemplateMode(nextMode);
    setTemplateName(editableTemplate ? displayTemplateTitle : suggestedTemplateTitle(filter, nextMode === "items" ? selected.length : null, templates));
    setTemplateError(""); setTemplateOpen(true);
  }
  function changeTemplateMode(nextMode: "filter" | "items") {
    if (saveTarget === "new" && (!templateName.trim() || templateName === suggestedName)) setTemplateName(suggestedTemplateTitle(filter, nextMode === "items" ? selected.length : null, templates));
    setTemplateMode(nextMode);
  }
  function toggleLot(id: string) {
    const current = selectedIds ?? eligible.map(row => row.id);
    setSelectedIds(current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  }
  function createReport() {
    if (!selected.length) return;
    const title = reportName.trim() || reportHolder;
    if (title.length > 120) { setReportNameError("Tên báo cáo tối đa 120 ký tự."); return; }
    const snapshot = createDateReport(lots, today, period, { ...filter, search: "" }, `${mockProfile.storeCode} · ${mockProfile.storeName}`, new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }), selected.map(row => row.id));
    onCreate({ ...snapshot, id: crypto.randomUUID(), title });
  }
  function saveTemplate() {
    const title = templateName.trim() || templateHolder;
    const error = templateNameError(title, templates, saveTarget === "update" ? template.id : undefined);
    if (error) { setTemplateError(error); return; }
    onSaveTemplate({ id: saveTarget === "update" ? template.id : crypto.randomUUID(), title, filter: { ...filter, search: "" }, selectedIds: templateMode === "filter" ? null : selected.map(row => row.id) });
    setTemplateOpen(false); setNotice("Đã lưu mẫu.");
  }
  const displayPeriod = report?.period ?? period;
  const asOf = report?.asOf ?? today;
  const noSnapshot = asOf < displayPeriod.start || asOf > displayPeriod.end;
  const skuCount = new Set((report?.rows ?? eligible).map(row => row.sku)).size;
  function openPeriod() {
    setStart(formatDisplayDate(period.start)); setEnd(formatDisplayDate(period.end)); setPeriodError(""); setPeriodOpen(true);
  }
  function applyPeriod() {
    try { setPeriod(parsePeriod(start, end)); setPeriodOpen(false); setPeriodError(""); }
    catch (error) { setPeriodError(error instanceof Error ? error.message : "Kiểm tra kỳ báo cáo."); }
  }
  async function exportExcel() {
    if (!report || exportBusy) return;
    setExportBusy(true); setExportError("");
    try { const { downloadDateReport } = await import("./store-date-report-export"); await downloadDateReport(report); }
    catch { setExportError("Chưa xuất được Excel. Thử lại."); }
    finally { setExportBusy(false); }
  }
  useEffect(() => { setNotice(""); }, [filter.phase, filter.processing, period.start, period.end, selectedIds]);
  const activeFilterCount = Number(filter.phase !== "all") + Number(filter.processing !== "all");
  const periodSummary = `${periodLabel(displayPeriod)} · Chốt ${formatDisplayDate(asOf)}`;
  function applyTemplate(next: ReportTemplate) {
    setFilter({ ...next.filter, search: "" });
    setSelectedIds(next.selectedIds ? [...next.selectedIds] : null);
    setSearch(""); setNotice("");
    onChooseTemplate(next);
  }
  const catalogSummary = `${skuCount} mã hàng · ${shownRows.length === eligible.length ? `${eligible.length} lô` : `${shownRows.length} / ${eligible.length} lô đang hiện`}`;
  const searchField = <StoreSearchField className="report-composer-search" inputRef={searchRef} label="Tìm mã hàng hoặc lô báo cáo" placeholder="Tìm mã hàng, lô" clearLabel="Xóa tìm kiếm báo cáo" title="Tìm chỉ thu gọn danh sách; giữ các lô đã chọn" value={search} onValueChange={setSearch} groups={[{label:"Lô trong kỳ báo cáo",items:(report?.rows ?? eligible).map(lot=>({value:lot.sku,label:lot.name,keywords:lot.id,detail:`SKU ${lot.sku}`}))}]} />;
  const documentHero = <div className="report-document-overview">{report ? <section className="date-report-document-meta" aria-label="Phạm vi bản báo cáo"><strong>{report.title}</strong><div className="report-document-facts"><p>{report.store}</p><p>{periodSummary}</p><p>{filterLabel(report.filter)}</p></div></section> : null}<button className="date-report-info" aria-label="Thông tin dữ liệu báo cáo" onClick={() => setSourceOpen(true)}><Info size={20} aria-hidden="true" /></button></div>;
  const content = <div className={`date-report${report ? " is-document" : " is-compose"}`} data-printing={printing}>
    {!report ? <StoreReportSettings period={periodLabel(period)} scope={filterLabel(filter)} filterCount={activeFilterCount} onPeriod={openPeriod} onFilter={() => setFilterOpen(true)} /> : null}
    <section className="date-report-catalog" aria-label="Danh mục báo cáo DATE">
      {report ? <div className="date-report-catalog-heading"><div><h3>Danh mục tồn</h3><p aria-live="polite">{skuCount} mã hàng · {report ? rows.length : eligible.length} lô</p></div></div> : <h3 className="sr-only">Danh mục tồn</h3>}
      {!report ? <div className="report-selection-bar" aria-label="Lựa chọn lô báo cáo">
        <StoreSelectionBar value={selectedIds} eligibleIds={eligible.map(row => row.id)} visibleIds={shownRows.map(row => row.id)} onChange={setSelectedIds} itemLabel="lô" contextLabel={catalogSummary} />
        {hiddenSelected ? <small>{hiddenSelected} lô đã chọn ngoài kết quả tìm</small> : null}
        {missingTemplateItems ? <small>{missingTemplateItems} lô trong mẫu không còn trong danh mục</small> : null}
      </div> : null}
      {rows.length ? <>
        {!desktop && !printing ? <div className="date-report-cards">{shownRows.map(row => <div className={`date-report-card ui-list-marker-card${!report ? " is-selectable" : ""}`} key={row.id}><ListItemMarker variant="bar" tone={getDatePhaseTone(row.assessment.phase)} />
          {!report ? <label className="report-lot-check"><input type="checkbox" aria-label={`Chọn lô ${dateLotBatchLabel(row)}`} checked={selectedIds === null || selectedIds.includes(row.id)} onChange={() => toggleLot(row.id)} /></label> : null}
          <button className="date-report-card-open" aria-label={`Chi tiết lô ${dateLotBatchLabel(row)}`} onClick={() => setActive(row)}><div><strong>{row.name}</strong><small>SKU {row.sku} · Lô {dateLotBatchLabel(row)}</small><span className="date-report-card-labels"><DateConditionLabel phase={row.assessment.phase} /><DateProcessingLabel status={row.status} /></span><span className="date-report-card-dates"><span>HSD <b>{formatDisplayDate(row.date)}</b></span><span>Tồn <b>—</b></span></span></div><ChevronRight className="date-report-card-chevron" size={18} aria-hidden="true" /></button>
        </div>)}</div> : null}
        {desktop || printing ? <table className="date-report-table"><caption className="sr-only">Danh mục lô tại ngày chốt {formatDisplayDate(asOf)}</caption><thead><tr>{!report ? <th><span className="sr-only">Chọn lô</span></th> : null}<th>Mã hàng / Lô</th><th>Sản phẩm</th><th>HSD</th><th>Tồn</th><th>DATE</th><th>Xử lý</th>{!printing ? <th className="date-report-screen-only"><span className="sr-only">Chi tiết</span></th> : null}</tr></thead><tbody>{shownRows.map(row => <tr key={row.id}>{!report ? <td className="report-selection-cell"><label className="report-lot-check"><input type="checkbox" aria-label={`Chọn lô ${dateLotBatchLabel(row)}`} checked={selectedIds === null || selectedIds.includes(row.id)} onChange={() => toggleLot(row.id)} /></label></td> : null}<td className="ui-list-marker-cell">{!printing ? <ListItemMarker variant="bar" tone={getDatePhaseTone(row.assessment.phase)} /> : null}<strong>{row.sku}</strong><small>{dateLotBatchLabel(row)}</small></td><td>{row.name}</td><td>{formatDisplayDate(row.date)}</td><td>—</td><td>{printing ? DATE_PHASE_LABELS[row.assessment.phase] : <DateConditionLabel phase={row.assessment.phase} />}</td><td>{printing ? processingLabels[row.status] : <DateProcessingLabel status={row.status} />}</td>{!printing ? <td className="date-report-screen-only"><button aria-label={`Chi tiết lô ${dateLotBatchLabel(row)}`} onClick={() => setActive(row)}><ChevronRight size={20} aria-hidden="true" /></button></td> : null}</tr>)}</tbody></table> : null}
      </> : <div className="date-report-empty"><Package size={32} aria-hidden="true" /><h3>{noSnapshot ? "Chưa có dữ liệu chốt kỳ này" : "Không có lô phù hợp"}</h3><Button variant="ghost" onClick={() => { if (noSnapshot) setPeriod(presetPeriod("month", today)); else { setFilter({ ...defaultReportFilter }); setSearch(""); } }}>{noSnapshot ? "Về kỳ hiện tại" : "Bỏ bộ lọc"}</Button></div>}
      {!printing && rows.length > rowLimit ? <div className="report-row-pagination"><span>{shownRows.length} / {rows.length} lô</span><Button variant="ghost" onClick={() => setRowLimit(limit => limit + 40)}>Xem thêm {Math.min(40, rows.length - rowLimit)} lô</Button></div> : null}
      <p className="date-report-footnote">— Chưa có số lượng tồn</p>
    </section>
    {report ? <footer className="date-report-actions"><Button className="store-button" onClick={() => void exportExcel()} disabled={exportBusy}><FileDown size={18} aria-hidden="true" />{exportBusy ? "Đang xuất…" : "Xuất Excel"}</Button><Button variant="secondary" onClick={() => { flushSync(() => setPrintRequested(true)); window.print(); setPrintRequested(false); }}><Printer size={18} aria-hidden="true" />In / Lưu PDF</Button><Button variant="ghost" onClick={() => onReuse(report)}>Dùng lại cấu hình</Button>{exportError ? <p role="alert">{exportError}</p> : null}</footer> : <StoreActionDock label="Thao tác báo cáo" summary={<><span aria-live="polite">{selected.length ? `${selected.length} lô đã chọn` : "Chọn ít nhất 1 lô"}</span>{notice ? <span role="status">{notice}</span> : null}</>}>
      <Button variant="secondary" aria-label={editableTemplate ? "Lưu mẫu" : "Lưu thành mẫu"} disabled={!selected.length} onClick={openTemplateSave}><Save size={18} aria-hidden="true" />Lưu mẫu</Button>
      <Button className="store-button" aria-label="Tạo bản báo cáo" disabled={!selected.length} onClick={() => { setReportName(reportHolder); setReportNameError(""); setCreateOpen(true); }}>Tạo báo cáo</Button>
    </StoreActionDock>}
    <StoreSheet className="date-report-sheet store-date-sheet" open={templateOpen} onOpenChange={setTemplateOpen} initialFocusRef={saveTemplateRef} title="Lưu mẫu báo cáo" description="Đặt tên mẫu và chọn lưu theo điều kiện hoặc đúng danh sách lô.">{editableTemplate ? <label>Cách lưu<Select className="store-dropdown" contentClassName="store-dropdown" aria-label="Cách lưu mẫu" value={saveTarget} onValueChange={value => { const next = value as "new" | "update"; setSaveTarget(next); setTemplateName(next === "update" ? displayTemplateTitle : suggestedName); setTemplateError(""); }} options={[{ value: "update", label: "Cập nhật mẫu đang dùng" }, { value: "new", label: "Tạo mẫu mới" }]} /></label> : null}<label>Tên mẫu<Input aria-describedby={templateError ? "report-template-name-error" : undefined} placeholder={templateHolder} value={templateName} maxLength={80} onChange={event => { setTemplateName(event.target.value); setTemplateError(""); }} aria-invalid={!!templateError} /></label><section className="report-sheet-section"><label>Danh mục cho lần sau<Select className="store-dropdown" contentClassName="store-dropdown" aria-label="Danh mục cho lần sau" value={templateMode} onValueChange={value => changeTemplateMode(value as "filter" | "items")} options={[{ value: "filter", label: "Theo điều kiện lọc" }, { value: "items", label: `Đúng ${selected.length} lô đang chọn` }]} /></label></section>{templateError ? <p id="report-template-name-error" role="alert">{templateError}</p> : null}<div className="report-sheet-footer"><Button asChild className="store-button" onClick={saveTemplate}><button ref={saveTemplateRef}>Lưu mẫu</button></Button></div></StoreSheet>
    <StoreSheet className="date-report-sheet store-date-sheet" open={createOpen} onOpenChange={setCreateOpen} initialFocusRef={createReportRef} title="Tạo báo cáo" description="Đặt tên và kiểm tra phạm vi trước khi lưu vào lịch sử."><form className="report-create-form" onSubmit={event => { event.preventDefault(); createReport(); }}><label>Tên báo cáo<Input placeholder={reportHolder} autoComplete="off" maxLength={120} value={reportName} aria-invalid={!!reportNameError} aria-describedby={reportNameError ? "report-name-error" : "report-create-scope"} onChange={event => { setReportName(event.target.value); setReportNameError(""); }} /></label><section className="report-sheet-section" aria-label="Phạm vi báo cáo"><Summary rows={[["Kỳ báo cáo", periodLabel(period)], ["Ngày chốt", formatDisplayDate(today)], ["Danh mục", `${selected.length} lô`]]} /><span id="report-create-scope" className="sr-only">{periodLabel(period)} · {selected.length} lô</span></section>{reportNameError ? <p id="report-name-error" role="alert">{reportNameError}</p> : null}<div className="report-sheet-footer"><Button asChild className="store-button" type="submit"><button ref={createReportRef}>Tạo và lưu lịch sử</button></Button></div></form></StoreSheet>
    {report ? <p className="date-report-print-note">DỮ LIỆU MẪU · Chưa có số lượng tồn · Tạo {report.createdAt}</p> : null}
    <StoreSheet className="date-report-sheet store-date-sheet" open={periodOpen} onOpenChange={setPeriodOpen} title="Kỳ báo cáo" description="Chọn kỳ theo tuần, tháng hoặc khoảng ngày."><div className="date-report-presets store-choices" role="group" aria-label="Kỳ có sẵn">{[["week", "Tuần này"], ["month", "Tháng này"], ["previous", "Tháng trước"]].map(([key, label]) => <button key={key} aria-pressed={start === formatDisplayDate(presetPeriod(key as "month" | "week" | "previous", today).start) && end === formatDisplayDate(presetPeriod(key as "month" | "week" | "previous", today).end)} onClick={() => { const next = presetPeriod(key as "month" | "week" | "previous", today); setStart(formatDisplayDate(next.start)); setEnd(formatDisplayDate(next.end)); setPeriodError(""); }}>{label}</button>)}</div><section className="report-sheet-section report-period-fields" aria-label="Khoảng ngày"><div className="date-report-calendar-field"><label htmlFor="date-report-start">Từ ngày</label><CalendarInput id="date-report-start" initialMonth={today} label="Từ ngày" value={start} onValueChange={setStart} invalid={!!periodError} {...(periodError ? { ariaDescribedBy: "date-report-period-error" } : {})} /></div><div className="date-report-calendar-field"><label htmlFor="date-report-end">Đến ngày</label><CalendarInput id="date-report-end" initialMonth={today} label="Đến ngày" value={end} onValueChange={setEnd} invalid={!!periodError} {...(periodError ? { ariaDescribedBy: "date-report-period-error" } : {})} /></div></section>{periodError ? <p id="date-report-period-error" role="alert">{periodError}</p> : null}<div className="report-sheet-footer"><Button className="store-button" onClick={applyPeriod}>Áp dụng kỳ</Button></div></StoreSheet>
    <StoreSheet className="date-report-sheet store-date-sheet store-date-filter" open={filterOpen} onOpenChange={setFilterOpen} title="Lọc danh mục" description="Bộ lọc áp dụng ngay; bản báo cáo chỉ gồm các lô đã chọn.">
      <section className="store-date-filter-section" aria-labelledby="report-filter-phase"><h3 id="report-filter-phase"><CalendarDays size={18} aria-hidden="true" />Tình trạng DATE</h3><div className="store-choices" role="group" aria-label="Tình trạng DATE">{phaseOptions.map(option => <button key={option.value} aria-pressed={filter.phase === option.value} className={filter.phase === option.value ? "is-selected" : ""} onClick={() => setFilter({ ...filter, phase: option.value as ReportFilter["phase"] })}><span>{option.label}</span><Check size={16} aria-hidden="true" className={filter.phase === option.value ? "" : "is-hidden"} /></button>)}</div></section>
      <section className="store-date-filter-section" aria-labelledby="report-filter-processing"><h3 id="report-filter-processing"><CircleCheck size={18} aria-hidden="true" />Trạng thái xử lý</h3><div className="store-choices" role="group" aria-label="Trạng thái xử lý">{Object.entries(processingLabels).map(([value, label]) => <button key={value} aria-pressed={filter.processing === value} className={filter.processing === value ? "is-selected" : ""} onClick={() => setFilter({ ...filter, processing: value as ReportFilter["processing"] })}><span>{label}</span><Check size={16} aria-hidden="true" className={filter.processing === value ? "" : "is-hidden"} /></button>)}</div></section>
      <div className="store-date-filter-footer"><button className="store-date-reset-filter" onClick={() => setFilter({ ...defaultReportFilter })}>Đặt lại bộ lọc</button><Button className="store-button" onClick={() => setFilterOpen(false)}>Xong</Button></div>
    </StoreSheet>
    <StoreSheet className="date-report-sheet store-date-sheet" open={sourceOpen} onOpenChange={setSourceOpen} title="Dữ liệu báo cáo" description="Nguồn và giới hạn dữ liệu mẫu."><Summary rows={[["Nguồn", "Danh mục lô trong DATE"], ["Ngày chốt", formatDisplayDate(asOf)], ["Số lượng tồn", "Chưa có dữ liệu"], ["Tồn kho các kỳ trước", "Chưa có dữ liệu"]]} /><p>Kỳ báo cáo dùng danh mục tại ngày chốt, không lọc theo HSD. “Đã xử lý” giữ nguyên ngày và không tự trừ tồn.</p><p>Bản đã tạo được giữ trong Lịch sử trên trình duyệt này. Đây là dữ liệu mẫu, chưa lưu máy chủ.</p><div className="report-sheet-footer"><Button className="store-button" onClick={() => setSourceOpen(false)}>Đóng</Button></div></StoreSheet>
    <StoreSheet className="date-report-sheet store-date-sheet" open={!!active} onOpenChange={open => { if (!open) setActive(null); }} title="Chi tiết lô báo cáo" description="Thông tin lô tại ngày chốt; chỉ xem.">{active ? <><section className="store-date-lot-heading"><h3>{active.name}</h3><p>SKU {active.sku} · Lô {dateLotBatchLabel(active)}</p></section><div className="date-report-detail-labels"><DateConditionLabel phase={active.assessment.phase} /><DateProcessingLabel status={active.status} /></div><Summary rows={[["Ngày chốt", formatDisplayDate(asOf)], ["NSX", active.manufactured ?? "Chưa có"], ["HSD", formatDisplayDate(active.date)], ["Tồn", "Chưa có dữ liệu"]]} />{active.assessment.result && active.assessment.nsx ? <ShelfLifeTimeline nsx={active.assessment.nsx} hsd={active.date} today={asOf} result={active.assessment.result} /> : <p>{active.assessment.message}</p>}<div className="report-sheet-footer"><Button className="store-button" onClick={() => setActive(null)}>Đóng chi tiết</Button></div></> : null}</StoreSheet>
  </div>;
  return report ? <ReportSurface onDismiss={onDismiss} className="is-document" header={{ title: "Bản báo cáo DATE", subtitle: "Báo cáo DATE", onBack, backLabel: "Về lịch sử báo cáo", titleRef: headingRef }} hero={documentHero}>{content}</ReportSurface> : <StorePageLayout className="report-composer">
    <StorePageHero className="report-composer-hero" header={{ title: displayTemplateTitle, subtitle: "Báo cáo DATE", onBack: onDismiss, backLabel: "Về menu báo cáo", titleRef: headingRef }}>
      <div className="report-composer-controls">{searchField}<ReportTemplatePicker current={currentTemplate} templates={templates} onApply={applyTemplate} /><button type="button" className="report-composer-info" aria-label="Thông tin dữ liệu báo cáo" onClick={() => setSourceOpen(true)}><Info size={20} aria-hidden="true" /></button></div>
    </StorePageHero>
    <StorePageSurface className="report-composer-cap" aria-label="Thiết lập và danh mục báo cáo">{content}</StorePageSurface>
  </StorePageLayout>;
}
