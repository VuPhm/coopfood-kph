import { useEffect, useRef, useState } from "react";
import { Button, Input, Select } from "@coopfood-kph/ui";
import { Check, ChevronRight, FileCheck2, FileText, History, Layers3, MoreHorizontal, Search, TriangleAlert } from "lucide-react";
import { DateReportWorkspace } from "./store-date-report";
import { StoreSheet } from "./store-sheet";
import { mockProfile, type MockDateLot } from "./store-app-mock";
import { periodLabel } from "./store-date-report-model";
import { copyTemplateTitle, findSavedReports, standardReportTemplates, templateNameError, useReportLibrary, type ReportTemplate, type SavedDateReport } from "./store-report-library";
import { StoreSearchField } from "./store-search-field";
import { ReportSurface } from "./store-report-surface";
import "./store-controls.css";
import "./store-date-report.css";

export function ReportHub({ lots }: { lots: MockDateLot[] }) {
  const library = useReportLibrary(mockProfile.storeCode);
  const [view, setView] = useState<"menu" | "history" | "compose" | "document">("menu");
  const [draft, setDraft] = useState({ template: standardReportTemplates[0]! });
  const [activeReport, setActiveReport] = useState<SavedDateReport | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [month, setMonth] = useState("");
  const [limit, setLimit] = useState(10);
  const [manage, setManage] = useState<ReportTemplate | null>(null);
  const [manageMode, setManageMode] = useState<"rename" | "copy">("rename");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const manageSaveRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: "instant" }); }, [view]);
  function openTemplate(template: ReportTemplate) {
    setNotice("");
    setDraft({ template: { ...template, filter: { ...template.filter }, selectedIds: template.selectedIds === null ? null : [...template.selectedIds] } });
    setView("compose");
  }
  const templates = [...standardReportTemplates, ...library.templates];
  const matches = findSavedReports(library.history, historySearch, month);
  const months = [...new Set(library.history.map(report => report.asOf.slice(0, 7)))].sort().reverse();
  const manageHolder = manageMode === "rename" ? manage?.title ?? "Mẫu báo cáo" : copyTemplateTitle(manage?.title ?? "Mẫu báo cáo", templates);
  function manageTemplate(template: ReportTemplate) {
    setManage(template); setManageMode("rename"); setName(template.title); setNameError("");
  }
  function saveManagedTemplate() {
    if (!manage) return;
    const error = templateNameError(name.trim() || manageHolder, templates, manageMode === "rename" ? manage.id : undefined);
    if (error) { setNameError(error); return; }
    library.saveTemplate({ ...manage, id: manageMode === "rename" ? manage.id : crypto.randomUUID(), title: name.trim() || manageHolder });
    setManage(null); setNotice(manageMode === "rename" ? "Đã đổi tên mẫu." : "Đã tạo bản sao mẫu.");
  }
  if (view === "compose" || (view === "document" && activeReport)) return <>
    {library.error ? <p className="report-library-error" role="status">{library.error}</p> : null}
    <DateReportWorkspace key={view === "document" ? activeReport!.id : "report-composer"}
      lots={lots} template={draft.template} savedReport={view === "document" ? activeReport : null}
      templates={templates} editableTemplate={library.templates.some(template => template.id === draft.template.id)}
      onBack={() => setView(view === "document" ? "history" : "menu")}
      onDismiss={() => setView("menu")} onChooseTemplate={openTemplate}
      onCreate={report => { library.addReport(report); setActiveReport(report); setHistorySearch(""); setMonth(""); setLimit(10); setView("document"); }}
      onSaveTemplate={library.saveTemplate}
      onReuse={report => openTemplate({ id: "from-history", title: report.title, filter: { ...report.filter }, selectedIds: report.rows.map(row => row.id) })}
    />
  </>;
  if (view === "history") return <ReportSurface onDismiss={() => setView("menu")} hero={<><header className="date-report-heading"><div><h2 ref={heading} tabIndex={-1}>Lịch sử báo cáo</h2><span>Dữ liệu mẫu · Trên trình duyệt này</span></div><History size={28} aria-hidden="true" /></header><p className="report-history-hero-count">{library.history.length} báo cáo đã lưu</p></>}>
    <div className="date-report report-hub report-history-body">
      {library.error ? <p className="report-library-error" role="status">{library.error}</p> : null}

      {library.history.length ? <section className="report-history-tools" aria-label="Tìm và lọc lịch sử">
        <StoreSearchField label="Tìm báo cáo" placeholder="Tên báo cáo, kỳ" value={historySearch} onValueChange={value => { setHistorySearch(value); setLimit(10); }} clearLabel="Xóa tìm kiếm lịch sử" />
        <Select className="store-dropdown" contentClassName="store-dropdown" aria-label="Tháng chốt báo cáo" value={month} onValueChange={value => { setMonth(value); setLimit(10); }} options={[{ value: "", label: "Tất cả tháng chốt" }, ...months.map(value => ({ value, label: value.split("-").reverse().join("/") }))]} />
        <p aria-live="polite">{matches.length} / {library.history.length} báo cáo</p>
      </section> : null}
      <section className="report-history-list" aria-label="Báo cáo đã tạo">
        {matches.length ? matches.slice(0, limit).map(report => <button key={report.id} className="report-history-card" onClick={() => { setActiveReport(report); setView("document"); }}>
          <span className="report-type-icon"><FileText size={22} aria-hidden="true" /></span><div><strong>{report.title}</strong><p>{periodLabel(report.period)}</p><small>{report.createdAt} · {report.rows.length} lô</small></div><ChevronRight size={18} aria-hidden="true" />
        </button>) : <div className="date-report-empty"><History size={32} aria-hidden="true" /><h3>{library.history.length ? "Không có báo cáo phù hợp" : "Chưa có báo cáo"}</h3><button className="report-menu-cta" onClick={() => { if (library.history.length) { setHistorySearch(""); setMonth(""); setLimit(10); } else openTemplate(standardReportTemplates[0]!); }}>{library.history.length ? "Bỏ tìm và lọc" : "Tạo báo cáo tổng hợp"}</button></div>}
        {matches.length > limit ? <Button variant="secondary" onClick={() => setLimit(limit + 10)}>Xem thêm báo cáo</Button> : null}
      </section>

    </div>
  </ReportSurface>;
  return <div className="date-report report-hub">
    <header className="date-report-heading">
      <div><h2 ref={heading} tabIndex={-1}>Chọn báo cáo</h2><span>Danh mục DATE</span></div>
      <button className="report-history-entry" onClick={() => setView("history")}><History size={19} aria-hidden="true" /><span>Lịch sử</span>{library.history.length ? <small>{library.history.length}</small> : null}</button>
    </header>
    {library.error ? <p className="report-library-error" role="status">{library.error}</p> : null}
    {notice && view === "menu" ? <p className="report-notice" role="status">{notice}</p> : null}

      <section className="report-type-list" aria-label="Loại báo cáo">
        {standardReportTemplates.map((template, index) => {
          const Icon = [Layers3, TriangleAlert, FileCheck2][index]!;
          return <button key={template.id} data-report-tone={["mint", "peach", "sky"][index]} className={`report-type-card${index === 0 ? " is-summary" : ""}`} onClick={() => openTemplate(template)}><span className="report-type-icon"><Icon size={24} aria-hidden="true" /></span><div><strong>{template.title}</strong><p>{index === 0 ? "Chọn danh mục, tạo theo nhu cầu" : index === 1 ? "Các lô cần theo dõi DATE" : "Danh mục đã hoàn tất xử lý"}</p></div><ChevronRight size={18} aria-hidden="true" /></button>;
        })}
      </section>
      {library.templates.length ? <section className="report-custom-types" aria-label="Mẫu của bạn"><h3>Mẫu của bạn</h3><div className="report-type-list">{library.templates.map(template => <div className="report-custom-card" data-report-tone="lilac" key={template.id}><button className="report-type-card" onClick={() => openTemplate(template)}><span className="report-type-icon"><FileText size={24} aria-hidden="true" /></span><div><strong>{template.title}</strong><p>{template.selectedIds ? `${template.selectedIds.length} lô chỉ định` : "Theo điều kiện đã lưu"}</p></div><ChevronRight size={18} aria-hidden="true" /></button><button className="report-template-manage" aria-label={`Quản lý mẫu ${template.title}`} onClick={() => manageTemplate(template)}><MoreHorizontal size={20} aria-hidden="true" /></button></div>)}</div></section> : null}
    <StoreSheet className="date-report-sheet store-date-sheet" initialFocusRef={manageSaveRef} open={!!manage} onOpenChange={open => { if (!open) setManage(null); }} title="Quản lý mẫu" description="Đổi tên hoặc tạo bản sao riêng. Báo cáo đã tạo giữ nguyên.">
      <div className="report-manage-mode store-choices" role="group" aria-label="Thao tác với mẫu">{[["rename", "Đổi tên"], ["copy", "Nhân bản"]].map(([value, label]) => <button key={value} aria-pressed={manageMode === value} className={manageMode === value ? "is-selected" : ""} onClick={() => { setManageMode(value as "rename" | "copy"); setName(value === "rename" ? manage?.title ?? "" : copyTemplateTitle(manage?.title ?? "Mẫu", templates)); setNameError(""); }}><span>{label}</span><Check size={16} aria-hidden="true" className={manageMode === value ? "" : "is-hidden"} /></button>)}</div>
      <label>Tên mẫu<Input aria-describedby={nameError ? "report-manage-name-error" : undefined} placeholder={manageHolder} value={name} maxLength={80} aria-invalid={!!nameError} onChange={event => { setName(event.target.value); setNameError(""); }} /></label>
      {nameError ? <p id="report-manage-name-error" role="alert">{nameError}</p> : null}
      <div className="report-sheet-footer"><Button asChild className="store-button" onClick={saveManagedTemplate}><button ref={manageSaveRef}>{manageMode === "rename" ? "Lưu tên mẫu" : "Tạo bản sao"}</button></Button></div>
    </StoreSheet>
  </div>;
}
