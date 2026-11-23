import { useEffect, useRef, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button, Field, Input } from "@coopfood-kph/ui";
import { ChevronRight, FileCheck2, FileText, History, TriangleAlert } from "lucide-react";
import { formatDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import type { DateLot } from "./date-api";
import { OnlineApiError } from "./online-kph";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { assessDateLot, DATE_PHASE_LABELS } from "./store-date-assessment";
import { periodLabel, presetPeriod } from "./store-date-report-model";
import { StoreSearchField } from "./store-search-field";
import type { StoreSessionGateway } from "./store-session-api";
import { StoreSheet } from "./store-sheet";
import type { ReportPreset, ReportSummary } from "./store-report-api";
import { useBusinessDate } from "./use-business-date";
import "./store-date-report.css";
import "./store-report-soft.css";

const presets = [
  { id: "all", title: "Báo cáo tổng hợp", icon: FileText, tone: "mint" },
  { id: "attention", title: "Hàng cần chú ý", icon: TriangleAlert, tone: "peach" },
  { id: "resolved", title: "Hàng đã xử lý", icon: FileCheck2, tone: "sky" },
] as const;
type Props = { userId: string; storeId: string; gateway: StoreSessionGateway; csrf: string;
  suspended: boolean; verifiedAt: number; refreshScope: () => void };
type Mode = "menu" | "source" | "history" | "document";
const dateLabel = (value: string) => formatDisplayDate(value as LocalDate);
const qty = (value: string, unit: string) => value.replace(".", ",") + " " + unit;

export function StoreOnlineReports(props: Props) {
  const { gateway, storeId, userId, suspended, verifiedAt, refreshScope } = props;
  const scope = useQuery({ queryKey: ["report-access", userId, storeId, verifiedAt], enabled: !suspended,
    queryFn: ({signal}) => gateway.date.listStores(signal), retry: false, gcTime: 0, placeholderData: keepPreviousData });
  const expired = scope.error instanceof OnlineApiError && scope.error.status === 401;
  useEffect(() => { if (expired) refreshScope(); }, [expired, refreshScope]);
  const allowed = scope.data?.some(store => store.id === storeId && store.capabilities.includes("REPORT"));
  const verifying = suspended || scope.isFetching;
  if (!allowed || scope.isError) return <StorePageLayout><StorePageHero/><StorePageSurface className="store-online-content">
    {verifying ? <p role="status">Đang kiểm tra quyền báo cáo…</p> : scope.isError ?
      <div role="alert">Chưa tải được quyền báo cáo. <Button onClick={() => void scope.refetch()}>Thử lại</Button></div> :
      <p role="status">Tài khoản chưa có quyền báo cáo tại cửa hàng này.</p>}
  </StorePageSurface></StorePageLayout>;
  return <ReportWorkspace {...props} suspended={verifying}/>;
}

function ReportWorkspace({ userId, storeId, gateway, csrf, suspended, refreshScope }: Props) {
  const [mode,setMode] = useState<Mode>("menu");
  const [preset,setPreset] = useState<ReportPreset>("all");
  const [selected,setSelected] = useState(new Map<string,number>());
  const [document,setDocument] = useState<ReportSummary>();
  const [kind,setKind] = useState<"month"|"week">("month");
  const [search,setSearch] = useState("");
  const [page,setPage] = useState(1);
  const [title,setTitle] = useState("");
  const [confirmation,setConfirmation] = useState<{period:ReturnType<typeof presetPeriod>; date:LocalDate}>();
  const [naming,setNaming] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const alive = useRef(true);
  const attempt = useRef({ signature:"", key:"" });
  useEffect(() => { alive.current=true; return () => { alive.current=false; }; }, []);
  const api = gateway.reports;
  const day = useBusinessDate();
  const scopeKey = ["date-reports",userId,storeId];
  const options = { retry:false, gcTime:0 };
  const source = useQuery({ ...options, queryKey:[...scopeKey,"source",preset,search,page,day],
    enabled:mode==="source" && !suspended, queryFn:({signal})=>api.source(storeId,preset,search,page,signal) });
  const history = useQuery({ ...options, queryKey:[...scopeKey,"history",search,page],
    enabled:mode==="history" && !suspended, queryFn:({signal})=>api.history(storeId,search,page,signal) });
  const rows = useQuery({ ...options, queryKey:[...scopeKey,"rows",document?.id,page],
    enabled:mode==="document" && !!document && !suspended, queryFn:({signal})=>api.rows(storeId,document!.id,page,signal) });
  const active = mode==="history" ? history : mode==="document" ? rows : source;
  const denied = active.error instanceof OnlineApiError && [401,403].includes(active.error.status ?? 0);
  useEffect(() => { if (denied) refreshScope(); },[denied,refreshScope]);
  const currentTitle = presets.find(item => item.id === preset)!.title;
  const asOf = (mode==="document" ? document?.asOf : source.data?.businessDate) as LocalDate | undefined;
  const period = asOf && presetPeriod(kind,asOf);
  const pages = active.data?.totalPages ?? 0;

  function navigate(next: Mode) {
    setMode(next); setPage(1); setSearch(""); setError(""); setNaming(false);
    window.scrollTo({ top:0, behavior:"instant" });
  }
  function toggle(id: string, version: number) {
    setSelected(previous => {
      const next = new Map(previous);
      if (next.has(id)) next.delete(id); else next.set(id,version);
      return next;
    });
  }
  async function save() {
    if (!confirmation || !selected.size || !title.trim() || saving) return;
    const items = Array.from(selected, ([lotId,version]) => ({lotId,version})).sort((a,b)=>a.lotId.localeCompare(b.lotId));
    const body = { title:title.trim(), periodStart:confirmation.period.start, periodEnd:confirmation.period.end, items };
    const signature = JSON.stringify(body);
    if (attempt.current.signature!==signature) attempt.current={signature,key:crypto.randomUUID()};
    setSaving(true); setError("");
    try {
      const saved = await api.create(storeId,body,attempt.current.key,csrf);
      if (!alive.current) return;
      setDocument(saved); setSelected(new Map()); navigate("document");
    } catch (reason) {
      if (!alive.current) return;
      if (reason instanceof OnlineApiError && [401,403].includes(reason.status ?? 0)) {
        setNaming(false); refreshScope(); return;
      }
      setError(reason instanceof OnlineApiError ? reason.message : "Chưa nhận được xác nhận lưu. Hãy thử lại.");
      if (reason instanceof OnlineApiError && ["DATE_REPORT_SOURCE_CHANGED","DATE_REPORT_PERIOD_CLOSED","DATE_REPORT_LOT_NOT_FOUND"].includes(reason.code ?? "")) {
        setNaming(false); setSelected(new Map()); void source.refetch();
      }
    } finally { if (alive.current) setSaving(false); }
  }
  const heading = mode==="menu" ? "Chọn báo cáo" : mode==="history" ? "Lịch sử báo cáo" : mode==="source" ? currentTitle : document?.title;
  const back = () => navigate(mode==="document" ? "history" : "menu");
  const changeSearch = (value:string) => { setPage(1); setSearch(value); };
  const lotRows = mode==="source" ? source.data?.items : rows.data?.items;
  let content: ReactNode;
  if (mode==="menu") content = <section className="report-type-list" aria-label="Loại báo cáo">
    {presets.map(({id,title:label,icon:Icon,tone}) => <button key={id} data-report-tone={tone} className="report-type-card" onClick={()=>{
      setPreset(id); setTitle(label); setSelected(new Map()); attempt.current={signature:"",key:""}; navigate("source");
    }}><span className="report-type-icon"><Icon aria-hidden="true"/></span><strong>{label}</strong><ChevronRight aria-hidden="true"/></button>)}
  </section>;
  else content = <>
    {mode!=="document" && <StoreSearchField label={mode==="history" ? "Tìm báo cáo" : "Tìm lô"} placeholder={mode==="history" ? "Tên hoặc mã báo cáo" : "SKU, tên hàng hoặc mã lô"} value={search} onValueChange={changeSearch} maxLength={128}/>}
    {mode==="source" && <div className="report-online-controls"><label>Kỳ báo cáo <select value={kind} onChange={e=>setKind(e.target.value as typeof kind)}>
      <option value="month">Tháng này</option><option value="week">Tuần này</option></select></label>
      <Button disabled={!selected.size || selected.size>1000 || !period || source.isError} onClick={()=>{ if (period && asOf) { setConfirmation({period,date:asOf}); setNaming(true); } }}>Tạo bản báo cáo · {selected.size}</Button>
      {selected.size>1000 && <span role="alert">Mỗi báo cáo tối đa 1.000 lô.</span>}</div>}
    {mode==="document" && document && <div className="report-online-summary">
      <strong>{dateLabel(document.periodStart)} – {dateLabel(document.periodEnd)}</strong>
      <span>Chốt {dateLabel(document.asOf)} · {document.createdBy.displayName} · {document.store.name}</span>
      <p>{document.rowCount} lô · Còn theo dõi {qty(document.totalEa,"EA")} · {qty(document.totalKg,"kg")}</p>
    </div>}
    {active.isError ? <div role="alert">Chưa tải được danh sách. <Button onClick={()=>void active.refetch()}>Thử lại</Button></div> :
      active.isPending ? <p role="status">Đang tải…</p> : active.data?.totalItems===0 ?
      <p role="status">{mode==="history" && !search ? "Chưa có báo cáo đã lưu." : "Không tìm thấy mục phù hợp."}</p> :
      mode==="history" ? <section className="report-history-list" aria-label="Báo cáo đã tạo">{history.data?.items.map(report=>
        <button key={report.id} className="report-history-card" onClick={()=>{setDocument(report); navigate("document");}}>
          <span className="report-type-icon"><FileText aria-hidden="true"/></span><div><strong>{report.title}</strong>
          <p>{dateLabel(report.periodStart)} – {dateLabel(report.periodEnd)}</p><small>Chốt {dateLabel(report.asOf)} · {report.rowCount} lô</small></div><ChevronRight aria-hidden="true"/></button>)}</section> :
      <section aria-label={mode==="source" ? "Danh mục lô" : "Lô đã chốt"}>{lotRows?.map(lot=><ReportLotRow key={lot.id} lot={lot} date={asOf!}
        {...(mode==="source" ? { checked:selected.has(lot.id), toggle:()=>toggle(lot.id,lot.version) } : {})}/>)}</section>}
    {page>1 || pages>1 ? <nav aria-label="Phân trang báo cáo" className="report-online-paging">
      <Button variant="secondary" disabled={page<=1} onClick={()=>setPage(page-1)}>Trang trước</Button>
      <span>Trang {page}{pages>0 && " / "+pages}</span>
      <Button variant="secondary" disabled={page>=pages} onClick={()=>setPage(page+1)}>Trang sau</Button></nav> : null}
  </>;
  return <StorePageLayout className="store-report-page report-online"><StorePageHero header={mode==="menu" ? {} : {onBack:back,backLabel:mode==="document" ? "Về lịch sử" : "Về loại báo cáo"}}/>
    <StorePageSurface className="store-report-page-cap"><div className="date-report report-hub">
      {suspended || denied ? <p role="status">Đang xác minh quyền báo cáo…</p> : <>
        <header className="date-report-heading"><div><h2>{heading}</h2></div>
          {mode==="menu" ? <button className="report-history-entry" onClick={()=>navigate("history")}><History size={18} aria-hidden="true"/>Lịch sử</button> :
          <Button variant="secondary" onClick={back}>{mode==="document" ? "Lịch sử" : "Loại báo cáo"}</Button>}</header>
        {error && !naming && <p role="alert">{error}</p>}{content}</>}
    </div></StorePageSurface>
    <StoreSheet open={naming && !suspended && !denied} onOpenChange={open=>{if (!saving) setNaming(open);}} title="Tạo báo cáo" description={confirmation ? periodLabel(confirmation.period) : ""}>
      <form className="report-online-form" onSubmit={event=>{event.preventDefault(); void save();}}>
        <Field label="Tên báo cáo"><Input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} disabled={saving}/></Field>
        <p>{selected.size} lô · Chốt tại ngày {confirmation && dateLabel(confirmation.date)}</p>
        {error && <p role="alert">{error}</p>}<Button type="submit" disabled={saving || !title.trim()}>{saving ? "Đang lưu…" : "Lưu báo cáo"}</Button>
      </form></StoreSheet>
  </StorePageLayout>;
}

function ReportLotRow({lot,date,checked,toggle}:{lot:DateLot; date:LocalDate; checked?:boolean; toggle?:()=>void}) {
  const phase = assessDateLot({date:lot.expiresOn as LocalDate,manufactured:lot.manufacturedOn ? dateLabel(lot.manufacturedOn) : undefined},date).phase;
  return <article className="report-online-row">
    <label>{toggle && <input type="checkbox" checked={checked} onChange={toggle}/>}<strong>{lot.productName}</strong></label>
    <span>SKU {lot.skuCode}{lot.lotCode && " · Lô "+lot.lotCode}</span>
    <span>HSD {dateLabel(lot.expiresOn)} · {DATE_PHASE_LABELS[phase]}</span>
    <span>Đã xử lý {qty(lot.processedQuantity,lot.unit)} · Còn {qty(lot.remainingQuantity,lot.unit)}</span>
  </article>;
}
