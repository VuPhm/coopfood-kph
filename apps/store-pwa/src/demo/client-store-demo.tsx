import { formatDisplayDate } from "@coopfood-kph/kph-rules";
import {
  ArrowLeft, BarChart3, Bell, CalendarDays, Check, ChevronRight, ClipboardCheck, Download, Home,
  PackagePlus, PackageSearch, ScanBarcode, Search, Settings2, Store, UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { assetUrl } from "../asset-url";
import { BarcodeScannerDialog } from "../barcode-scanner-dialog";
import { ExpiryWorkbench } from "../expiry-dialog";
import {
  createDemoState, decideSession, demoProducts, demoToday, inventoryQuantity, lotDate, lotLabel,
  saveEntry, signed, type DateBand, type DemoActor, type DemoProduct, type DemoState,
  type SessionStatus, type StocktakeEntry,
} from "./client-store-demo-data";
import { ReceivingSurface } from "./receiving-surface";
import "./client-store-demo.css";

type Surface = "home" | "notifications" | "settings" | "kph" | "stocktake" | "receiving" | "inventory" | "reports";
type Navigate = (surface: Surface) => void;
const nav = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "settings", label: "Cài đặt", icon: Settings2 },
] as const;
const actorNames = { employee: "Nhân viên · Trần Minh Anh", manager: "Quản lý · Nguyễn Văn Demo" };
const statusNames: Record<SessionStatus, string> = {
  IN_PROGRESS: "Đang kiểm", SUBMITTED: "Chờ duyệt", APPROVED: "Đã duyệt", RECOUNT_REQUIRED: "Cần kiểm lại",
};
const dateBands: { id: DateBand; label: string }[] = [
  { id: "OVER_70", label: ">70%" }, { id: "50_70", label: "50–70%" },
  { id: "20_50", label: "20–50%" }, { id: "UNDER_20", label: "<20%" },
];
const product = (id: string) => demoProducts.find((item) => item.id === id)!;
const diff = (entry: StocktakeEntry) => entry.actualQuantity - entry.systemQuantity;

export function ClientStoreDemo({ children }: { children: ReactNode }) {
  const [surface, setSurface] = useState<Surface>("home");
  const [actor, setActor] = useState<DemoActor>("employee");
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [state, setState] = useState<DemoState>(createDemoState);
  const activeNav = surface === "notifications" || surface === "settings" ? surface : "home";
  useEffect(() => { window.scrollTo(0, 0); }, [surface]);

  return <div className="cd-shell">
    <header className="cd-header"><div className="cd-header-inner">
      <button className="cd-brand" type="button" onClick={() => setSurface("home")} aria-label="Về Trang chủ">
        <img src={assetUrl("brand/coopfood-logo.png")} alt="Co.op Food" />
        <span>Store App <small>Vận hành cửa hàng</small></span>
      </button>
      <div className="cd-context">
        <Store aria-hidden="true" size={18} /><span><strong title="Co.op Food Nguyễn Kiệm">Nguyễn Kiệm</strong><small>CF-DEMO-001</small></span>
      </div>
      <button className="cd-actor-chip" type="button" onClick={() => setSurface("settings")} aria-label={`Tài khoản ${actorNames[actor]}. Mở Cài đặt`}>
        <span className="cd-avatar" aria-hidden="true">{actor === "employee" ? "MA" : "VD"}</span>
        <span><strong>{actor === "employee" ? "Trần Minh Anh" : "Nguyễn Văn Demo"}</strong><small>{actor === "employee" ? "Nhân viên" : "Quản lý"}</small></span>
      </button>
    </div></header>
    <nav className="cd-nav" aria-label="Điều hướng Store App">
      {nav.map(({ id, label, icon: Icon }) => <button type="button" key={id}
        className={activeNav === id ? "active" : ""} aria-current={activeNav === id ? "page" : undefined}
        onClick={() => setSurface(id)}><Icon aria-hidden="true" size={19} /><span>{label}</span></button>)}
    </nav>
    <main className="cd-main">
      {surface !== "home" && surface !== "notifications" && surface !== "settings" && <button className="cd-tool-back" type="button" onClick={() => setSurface("home")}><ArrowLeft size={17} aria-hidden="true" /> Trang chủ</button>}
      {surface === "home" && <HomeSurface actor={actor} navigate={setSurface} onOpenExpiry={() => setExpiryOpen(true)} />}
      {surface === "notifications" && <NotificationsSurface state={state} navigate={setSurface} />}
      {surface === "settings" && <SettingsSurface actor={actor} setActor={setActor} />}
      {surface === "kph" && <section className="cd-kph" aria-label="KPH sử dụng lại">{children}</section>}
      {surface === "stocktake" && <StocktakeSurface state={state} setState={setState} navigate={setSurface} />}
      {surface === "receiving" && <ReceivingSurface state={state} setState={setState} onHome={() => setSurface("home")} />}
      {surface === "inventory" && <InventorySurface actor={actor} state={state} setState={setState} />}
      {surface === "reports" && <ReportsSurface state={state} navigate={setSurface} />}
    </main>
    <div className="workspace-side-stack cd-expiry-host"><ExpiryWorkbench open={expiryOpen} onOpenChange={setExpiryOpen} /></div>
    <div className="cd-demo-label">DEMO · Dữ liệu nhập hàng/kiểm kê/tồn kho chỉ lưu trong bộ nhớ trình duyệt</div>
  </div>;
}

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="cd-heading"><p>{eyebrow}</p><h1>{title}</h1>{children && <span>{children}</span>}</div>;
}
function HomeSurface({ actor, navigate, onOpenExpiry }: {
  actor: DemoActor; navigate: Navigate; onOpenExpiry: () => void;
}) {
  const tasks: { id: Surface | "expiry"; title: string; subtitle: string; icon: typeof Home }[] = [
    { id: "kph", title: "KPH", subtitle: "Ghi nhận hàng không phù hợp", icon: ClipboardCheck },
    { id: "stocktake", title: "Kiểm kê", subtitle: "Đếm hàng tại cửa hàng", icon: ScanBarcode },
    { id: "receiving", title: "Nhập hàng", subtitle: "Quét và nhận lô hàng", icon: PackagePlus },
    { id: "inventory", title: "Tồn kho", subtitle: "Tra SKU và lô hàng", icon: PackageSearch },
    { id: "expiry", title: "Tra cứu lùi hàng", subtitle: "Tính DATE và hạn lùi", icon: CalendarDays },
    { id: "reports", title: "Báo cáo", subtitle: "Xem tình hình vận hành", icon: BarChart3 },
  ];
  return <>
    <div className="cd-home-intro"><p>CỬA HÀNG HÔM NAY · {formatDisplayDate(demoToday())}</p>
      <h1>Chào, {actor === "employee" ? "Minh Anh" : "anh Demo"}</h1></div>
    <section className="cd-home-functions" aria-labelledby="cd-functions-title">
      <h2 id="cd-functions-title">Chức năng</h2>
      <div className="cd-task-grid">{tasks.map(({ id, title, subtitle, icon: Icon }) => <button key={id} type="button" className={`cd-task-${id}`} onClick={() => id === "expiry" ? onOpenExpiry() : navigate(id)}>
        <span className="cd-task-icon"><Icon size={24} strokeWidth={2} aria-hidden="true" /></span><span className="cd-task-copy"><strong>{title}</strong><small>{subtitle}</small></span>
      </button>)}</div>
    </section>
  </>;
}

function NotificationsSurface({ state, navigate }: { state: DemoState; navigate: Navigate }) {
  const pending = state.sessions.filter((session) => session.status === "SUBMITTED");
  const recount = state.sessions.filter((session) => session.status === "RECOUNT_REQUIRED");
  const dateLots = state.lots.filter((lot) => lotDate(lot).status !== "SAFE");
  const items = [
    ...pending.map((session) => ({ key: session.id, title: "Kiểm kê chờ duyệt", detail: `${session.id} · ${session.entries.length} sản phẩm`, source: "Tồn kho", destination: "inventory" as Surface, icon: ClipboardCheck })),
    ...recount.map((session) => ({ key: session.id, title: "Cần kiểm lại", detail: `${session.id} · tiếp tục đếm hàng`, source: "Kiểm kê", destination: "stocktake" as Surface, icon: ScanBarcode })),
    ...dateLots.map((lot) => ({ key: lot.id, title: product(lot.productId).name, detail: `${lotLabel(lot)} · HSD ${formatDisplayDate(lot.hsd)}`, source: "DATE · Tồn kho", destination: "inventory" as Surface, icon: CalendarDays })),
  ];
  return <div className="cd-utility-page"><Heading eyebrow="CÔNG VIỆC CẦN CHÚ Ý" title="Thông báo">{items.length} mục từ dữ liệu demo hiện tại.</Heading>
    <section className="cd-panel cd-notification-list" aria-label="Danh sách thông báo">{items.length ? items.map(({ key, title, detail, source, destination, icon: Icon }) => <button type="button" key={key} onClick={() => navigate(destination)}>
      <span className="cd-notification-icon"><Icon size={20} aria-hidden="true" /></span><span><small>{source}</small><strong>{title}</strong><span>{detail}</span></span><ChevronRight size={18} aria-hidden="true" />
    </button>) : <p className="cd-empty">Chưa có việc cần chú ý.</p>}</section>
  </div>;
}

function SettingsSurface({ actor, setActor }: { actor: DemoActor; setActor: (actor: DemoActor) => void }) {
  return <div className="cd-utility-page"><Heading eyebrow="TÀI KHOẢN & CỬA HÀNG" title="Cài đặt" />
    <section className="cd-panel cd-settings-card"><div className="cd-settings-line"><UserRound size={21} aria-hidden="true" /><span><small>Tài khoản demo</small><strong>{actor === "employee" ? "Trần Minh Anh" : "Nguyễn Văn Demo"}</strong></span></div>
      <div className="cd-settings-line"><Store size={21} aria-hidden="true" /><span><small>Cửa hàng hiện tại</small><strong>Co.op Food Nguyễn Kiệm · CF-DEMO-001</strong></span></div>
      <label className="cd-field" htmlFor="cd-settings-actor">Vai trò demo<select id="cd-settings-actor" aria-label="Vai trò demo" value={actor} onChange={(event) => setActor(event.target.value as DemoActor)}>
        <option value="employee">{actorNames.employee}</option><option value="manager">{actorNames.manager}</option>
      </select></label><p className="cd-helper">Vai trò này chỉ điều khiển Kiểm kê và duyệt Tồn kho trong bản demo.</p></section>
  </div>;
}

function StocktakeSurface({ state, setState, navigate }: {
  state: DemoState; setState: React.Dispatch<React.SetStateAction<DemoState>>; navigate: Navigate;
}) {
  const [sessionId, setSessionId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [actual, setActual] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [sessionPickerOpen, setSessionPickerOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSessions = state.sessions.filter((session) => session.status === "IN_PROGRESS" || session.status === "RECOUNT_REQUIRED");
  const session = state.sessions.find((item) => item.id === sessionId);
  const matched = demoProducts.find((item) => item.barcode === barcode.trim() || item.sku.toLowerCase() === barcode.trim().toLowerCase());
  const previous = session?.entries.find((entry) => entry.productId === matched?.id);
  useEffect(() => {
    setActual(previous ? String(previous.actualQuantity) : matched ? String(inventoryQuantity(state, matched.id)) : "");
    setReason(previous?.reason ?? ""); setNote(previous?.note ?? "");
  }, [matched?.id, sessionId]);
  useEffect(() => { if (matched) window.scrollTo(0, 0); }, [matched?.id]);
  function startSession() {
    const id = `KK-${demoToday().replaceAll("-", "")}-${String(state.sessions.length + 1).padStart(2, "0")}`;
    setState((current) => ({ ...current, sessions: [...current.sessions, {
      id, date: demoToday(), employee: "Trần Minh Anh", status: "IN_PROGRESS", entries: [],
    }] }));
    setSessionId(id); setSessionPickerOpen(false); setMessage("Đã bắt đầu đợt kiểm kê.");
  }
  function save() {
    if (!session || !matched) return;
    const quantity = Number(actual);
    const systemQuantity = previous?.systemQuantity ?? inventoryQuantity(state, matched.id);
    if (!Number.isSafeInteger(quantity) || quantity < 0) { setMessage("Nhập số lượng nguyên từ 0 trở lên."); return; }
    if (quantity !== systemQuantity && !reason) { setMessage("Chọn lý do khi số đếm bị lệch."); return; }
    setState((current) => saveEntry(current, session.id, {
      productId: matched.id, systemQuantity, actualQuantity: quantity, reason, note: note.trim(),
    }));
    setMessage(`Đã lưu ${matched.name}. Tồn đã duyệt vẫn là ${inventoryQuantity(state, matched.id)} ${matched.unit.toLowerCase()}.`);
    setBarcode(""); setActual(""); setReason(""); setNote("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }
  return <div className="cd-stocktake">
    <Heading eyebrow="NHÂN VIÊN · TRÊN QUẦY" title="Kiểm kê">Quét sản phẩm, nhập số thực tế và gửi kết quả để quản lý duyệt.</Heading>
    <div className="cd-work-grid">
      <section className="cd-panel cd-stocktake-start">
        <div className="cd-section-title"><h2>Đợt kiểm kê</h2><span>1 · Chọn đợt</span></div>
        {session && !sessionPickerOpen && <button type="button" className="cd-mobile-session" onClick={() => setSessionPickerOpen(true)}><span><strong>{session.id}</strong><small>{session.entries.length} sản phẩm · {statusNames[session.status]}</small></span><span>Đổi đợt</span></button>}
        <div className={`cd-row cd-stocktake-picker ${session && !sessionPickerOpen ? "is-closed" : ""}`}><select aria-label="Chọn đợt kiểm kê" value={sessionId} onChange={(event) => { setSessionId(event.target.value); setBarcode(""); setSessionPickerOpen(false); }}>
          <option value="">Chọn đợt đang mở</option>
          {activeSessions.map((item) => <option key={item.id} value={item.id}>{item.id} · {statusNames[item.status]}</option>)}
        </select><button type="button" className="cd-secondary" onClick={startSession}>+ Đợt mới</button></div>
        {session && <p className="cd-helper">{session.id} · {session.entries.length} sản phẩm đã lưu · {statusNames[session.status]}</p>}
        {session && <div className={`cd-stocktake-lookup ${matched ? "has-product" : ""}`}><div className="cd-divider" />
          <div className="cd-section-title"><h2>Quét hoặc nhập mã</h2><span>2 · Sản phẩm</span></div>
          <button type="button" className="cd-scan" onClick={() => setScannerOpen(true)}><ScanBarcode size={26} aria-hidden="true" /> Quét barcode</button>
          <label className="cd-field">Nhập barcode / SKU thủ công<input ref={inputRef} inputMode="numeric" value={barcode}
            onChange={(event) => { setBarcode(event.target.value); setMessage(""); }} placeholder="Ví dụ 8938501434012" /></label></div>}
        {barcode && !matched && <p className="cd-feedback" role="status">Chưa tìm thấy trong danh mục demo. Quét lại hoặc nhập mã khác.</p>}
        {matched && session && <div className="cd-found"><strong>{matched.name}</strong><span>{matched.sku} · {matched.barcode}</span>
          <span>Tồn đã duyệt: <b>{inventoryQuantity(state, matched.id)} {matched.unit}</b></span></div>}
      </section>
      <section className={`cd-panel cd-stocktake-count ${matched ? "has-product" : ""}`}>
        <div className="cd-section-title"><h2>Số lượng thực tế</h2><span>3 · Lưu dòng</span></div>
        {matched && session ? <>
          <div className="cd-found"><strong>{matched.name}</strong><span>{matched.sku} · Tồn đã duyệt {inventoryQuantity(state, matched.id)} {matched.unit}</span></div>
          <button type="button" className="cd-mobile-only cd-text-action" onClick={() => setBarcode("")}><ArrowLeft size={16} aria-hidden="true" /> Đổi sản phẩm</button>
          <label className="cd-field">Đếm thực tế ({matched.unit})<input type="number" min="0" step="1" inputMode="numeric"
            value={actual} onChange={(event) => setActual(event.target.value)} /></label>
          <div className="cd-difference">Hệ thống {previous?.systemQuantity ?? inventoryQuantity(state, matched.id)} → Thực tế {actual || "—"}
            <strong>{actual !== "" && Number.isFinite(Number(actual)) ? signed(Number(actual) - (previous?.systemQuantity ?? inventoryQuantity(state, matched.id))) : "—"}</strong></div>
          {actual !== "" && Number(actual) !== (previous?.systemQuantity ?? inventoryQuantity(state, matched.id)) && <>
            <label className="cd-field">Lý do chênh lệch<select value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="">Chọn lý do</option><option>Hao hụt</option><option>Hàng hỏng</option><option>Nhầm vị trí</option><option>Khác</option>
            </select></label>
            <label className="cd-field">Ghi chú (không bắt buộc)<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} /></label>
          </>}
          <button type="button" className="cd-primary cd-save" onClick={save}>Lưu & quét tiếp <ChevronRight size={18} /></button>
        </> : <p className="cd-empty">Chọn đợt và quét sản phẩm để nhập số lượng.</p>}
        {message && <p className="cd-feedback" role="status">{message}</p>}
      </section>
    </div>
    {session && <section className="cd-panel cd-session-list"><div className="cd-section-title"><h2>Đã kiểm · {session.entries.length}</h2><span>Tồn chưa thay đổi</span></div>
      <button type="button" className="cd-mobile-only cd-history-toggle" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)}>{historyOpen ? "Ẩn danh sách đã kiểm" : "Xem danh sách đã kiểm"}<ChevronRight size={17} aria-hidden="true" /></button>
      <div className={historyOpen ? "cd-stocktake-history is-open" : "cd-stocktake-history"}>
      {session.entries.length ? session.entries.map((entry) => <div className="cd-line" key={entry.productId}><span><strong>{product(entry.productId).name}</strong><small>{entry.reason || "Khớp"}</small></span><b>{entry.systemQuantity} → {entry.actualQuantity} ({signed(diff(entry))})</b></div>) : <p className="cd-empty">Chưa có sản phẩm nào được lưu.</p>}
      </div>
      {session.entries.length > 0 && <button type="button" className="cd-primary" onClick={() => {
        setState((current) => ({ ...current, sessions: current.sessions.map((item) => item.id === session.id ? { ...item, status: "SUBMITTED" } : item) }));
        setSessionId(""); setBarcode(""); setMessage("Đã gửi kiểm kê. Tồn chỉ đổi sau khi quản lý duyệt."); navigate("inventory");
      }}>Gửi kết quả chờ duyệt</button>}
    </section>}
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={(code) => { setBarcode(code); setScannerOpen(false); }} />
  </div>;
}

function InventorySurface({ actor, state, setState }: {
  actor: DemoActor; state: DemoState; setState: React.Dispatch<React.SetStateAction<DemoState>>;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(demoProducts[0]!.id);
  const [sessionId, setSessionId] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "product" | "lot" | "queue" | "review">("list");
  const [selectedLotId, setSelectedLotId] = useState("");
  const filtered = demoProducts.filter((item) => [item.name, item.sku, item.barcode, item.group].some((value) => value.toLowerCase().includes(query.toLowerCase().trim())));
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const pending = state.sessions.filter((item) => item.status === "SUBMITTED");
  const selectedSession = pending.find((item) => item.id === sessionId) ?? pending[0];
  useEffect(() => { window.scrollTo(0, 0); }, [mobileView]);
  return <div className="cd-inventory" data-mobile-view={mobileView}>
    <Heading eyebrow="TRA CỨU & PHÊ DUYỆT" title="Tồn kho">Xem tồn đã duyệt, chi tiết lô và quyết định kiểm kê chờ duyệt.</Heading>
    <div className="cd-work-grid cd-inventory-grid">
      <section className="cd-panel cd-inventory-list">
        <div className="cd-section-title"><h2>Danh mục tồn kho</h2><span>{filtered.length} SKU</span></div>
        <button type="button" className="cd-mobile-only cd-review-launch" onClick={() => setMobileView("queue")}>Hàng chờ duyệt <strong>{pending.length}</strong><ChevronRight size={17} aria-hidden="true" /></button>
        <label className="cd-search"><Search size={18} aria-hidden="true" /><input aria-label="Tìm SKU hoặc sản phẩm" value={query}
          onChange={(event) => { setQuery(event.target.value); setMobileView("list"); }} placeholder="Tìm SKU, barcode, tên hàng…" /></label>
        <div className="cd-product-list">{filtered.map((item) => <button className={selected?.id === item.id ? "selected" : ""} type="button"
          key={item.id} onClick={() => { setSelectedId(item.id); setMobileView("product"); setSelectedLotId(""); }}><span><strong>{item.name}</strong><small>{item.sku} · {item.location}</small></span><b>{inventoryQuantity(state, item.id)}</b></button>)}
          {!filtered.length && <p className="cd-empty">Không có sản phẩm phù hợp.</p>}
        </div>
      </section>
      {selected && <section className="cd-panel cd-inventory-detail">
        <button type="button" className="cd-mobile-only cd-text-action cd-inventory-back" onClick={() => setMobileView(mobileView === "lot" ? "product" : "list")}><ArrowLeft size={16} aria-hidden="true" /> {mobileView === "lot" ? "Sản phẩm" : "Danh sách"}</button>
        <div className="cd-section-title"><h2>{selected.name}</h2><span>{selected.sku}</span></div>
        <div className="cd-facts cd-product-facts"><span>Barcode <b>{selected.barcode}</b></span><span>Nhà cung cấp <b>{selected.supplier}</b></span>
          <span>Nhóm hàng <b>{selected.group}</b></span><span>Tồn đã duyệt <b>{inventoryQuantity(state, selected.id)} {selected.unit}</b></span></div>
        <h3 className="cd-subheading cd-lot-list-title">Lô & DATE</h3>
        {state.lots.filter((lot) => lot.productId === selected.id).map((lot) => {
          const date = lotDate(lot);
          const status = date.status === "SAFE" ? "An toàn" : date.status === "WARNING" ? "Cảnh báo" : date.status === "DANGER" ? "Đến ngày lùi" : "Hết hạn";
          return <article className="cd-lot" key={lot.id} data-selected={selectedLotId === lot.id}><button type="button" className="cd-lot-heading" onClick={() => { setSelectedLotId(lot.id); setMobileView("lot"); }}><strong>{lotLabel(lot)}</strong><span className={`cd-status ${date.status.toLowerCase()}`}>{status}</span></button>
            <div className="cd-facts cd-lot-facts"><span>NSX <b>{formatDisplayDate(lot.nsx)}</b></span><span>HSD <b>{formatDisplayDate(lot.hsd)}</b></span>
              <span>Số lượng <b>{lot.quantity} {selected.unit}</b></span><span>DATE đã qua <b>{date.percent}%</b></span>
              {lot.receivedOn && <span>Ngày nhập <b>{formatDisplayDate(lot.receivedOn)}</b></span>}
              <span>Cảnh báo từ <b>{date.warningDate ? formatDisplayDate(date.warningDate) : "Không áp dụng"}</b></span>
              <span>Ngày lùi <b>{formatDisplayDate(date.withdrawalDate)}</b></span></div></article>;
        })}
      </section>}
    </div>
    <section className="cd-panel cd-mobile-only cd-review-queue"><button type="button" className="cd-text-action" onClick={() => setMobileView("list")}><ArrowLeft size={16} aria-hidden="true" /> Tồn kho</button>
      <h2>Hàng chờ duyệt · {pending.length}</h2>{pending.length ? pending.map((item) => <button type="button" className="cd-review-item" key={item.id} onClick={() => { setSessionId(item.id); setMobileView("review"); }}><span><strong>{item.id}</strong><small>{item.entries.length} sản phẩm · {item.entries.filter((entry) => diff(entry) !== 0).length} lệch</small></span><ChevronRight size={17} aria-hidden="true" /></button>) : <p className="cd-empty">Không còn đợt kiểm kê chờ duyệt.</p>}
    </section>
    <section className="cd-panel cd-approval">
      <button type="button" className="cd-mobile-only cd-text-action" onClick={() => setMobileView("queue")}><ArrowLeft size={16} aria-hidden="true" /> Hàng chờ duyệt</button>
      <div className="cd-section-title"><h2>Kiểm kê chờ duyệt</h2><span>{pending.length} đợt</span></div>
      {pending.length ? <>
        <div className="cd-row"><select aria-label="Chọn phiếu chờ duyệt" value={selectedSession?.id ?? ""} onChange={(event) => setSessionId(event.target.value)}>
          {pending.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.entries.length} sản phẩm · {item.entries.filter((entry) => diff(entry) !== 0).length} lệch</option>)}
        </select><span className="cd-status warning">Chờ duyệt</span></div>
        {selectedSession && <><p className="cd-helper">{selectedSession.employee} · {formatDisplayDate(selectedSession.date)} · Tồn vẫn giữ số đã duyệt</p>
          {selectedSession.entries.map((entry) => <div key={entry.productId} className="cd-line"><span><strong>{product(entry.productId).name}</strong>
            <small>{entry.reason || "Khớp"}{entry.note ? ` · ${entry.note}` : ""}</small></span><b>{entry.systemQuantity} → {entry.actualQuantity} ({signed(diff(entry))})</b></div>)}
          {actor === "manager" ? <div className="cd-actions">
            <button type="button" className="cd-primary" onClick={() => { setState((current) => decideSession(current, selectedSession.id, "APPROVED")); setSessionId(""); setMobileView("queue"); }}><Check size={18} /> Chấp nhận</button>
            <button type="button" className="cd-secondary" onClick={() => { setState((current) => decideSession(current, selectedSession.id, "RECOUNT_REQUIRED")); setSessionId(""); setMobileView("queue"); }}>Yêu cầu kiểm lại</button>
          </div> : <p className="cd-feedback">Chuyển vai trò demo sang Quản lý để duyệt hoặc yêu cầu kiểm lại.</p>}</>}
      </> : <p className="cd-empty">Không còn đợt kiểm kê chờ duyệt.</p>}
    </section>
  </div>;
}

type ReportKind = "overview" | "inventory" | "stocktake" | "date" | "kph" | "processed";
type ReportRow = { key: string; name: string; detail: string; quantity: string; status: string; group: string; supplier: string; band: DateBand | ""; date: string };
const reportKinds: { id: ReportKind; label: string }[] = [
  { id: "overview", label: "Tổng quan" }, { id: "inventory", label: "Tồn kho" },
  { id: "stocktake", label: "Kiểm kê & chênh lệch" }, { id: "date", label: "Hàng cần DATE" },
  { id: "kph", label: "KPH" }, { id: "processed", label: "Đã xử lý" },
];
function reportRows(state: DemoState, kind: ReportKind): ReportRow[] {
  if (kind === "inventory" || kind === "overview" || kind === "date") {
    return state.lots.filter((lot) => kind !== "date" || lotDate(lot).status !== "SAFE").map((lot) => {
      const item = product(lot.productId); const date = lotDate(lot);
      return { key: lot.id, name: item.name, detail: `${item.sku} · ${lotLabel(lot)} · HSD ${formatDisplayDate(lot.hsd)}${lot.receivedOn ? ` · Nhập ${formatDisplayDate(lot.receivedOn)}` : ""}`,
        quantity: `${lot.quantity} ${item.unit}`, status: date.status === "SAFE" ? "An toàn" : date.status === "WARNING" ? "Cảnh báo" : date.status === "DANGER" ? "Đến ngày lùi" : "Hết hạn",
        group: item.group, supplier: item.supplier, band: date.band, date: lot.hsd };
    });
  }
  if (kind === "stocktake") return state.sessions.flatMap((session) => session.entries.map((entry) => {
    const item = product(entry.productId);
    return { key: `${session.id}-${entry.productId}`, name: item.name, detail: `${session.id} · ${item.sku} · ${entry.reason || "Khớp"}`,
      quantity: `${entry.systemQuantity} → ${entry.actualQuantity} (${signed(diff(entry))})`, status: statusNames[session.status],
      group: item.group, supplier: item.supplier, band: "" as const, date: session.date };
  }));
  if (kind === "processed") return state.adjustments.map((adjustment) => {
    const item = product(adjustment.productId);
    return { key: adjustment.id, name: item.name, detail: `${adjustment.sessionId} · ${item.sku} · Kiểm kê`,
      quantity: signed(adjustment.delta), status: "Đã xử lý", group: item.group, supplier: item.supplier, band: "" as const, date: adjustment.date };
  });
  return [];
}
type Filters = { keyword: string; group: string; supplier: string; status: string; band: string; from: string; to: string };
const emptyFilters: Filters = { keyword: "", group: "", supplier: "", status: "", band: "", from: "", to: "" };
function ReportsSurface({ state, navigate }: { state: DemoState; navigate: Navigate }) {
  const [kind, setKind] = useState<ReportKind>("overview");
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [exportMessage, setExportMessage] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const rows = useMemo(() => reportRows(state, kind), [state, kind]);
  const filtered = rows.filter((row) => {
    const keyword = filters.keyword.trim().toLocaleLowerCase("vi");
    return (!keyword || [row.name, row.detail].some((value) => value.toLocaleLowerCase("vi").includes(keyword)))
      && (!filters.group || row.group === filters.group) && (!filters.supplier || row.supplier === filters.supplier)
      && (!filters.status || row.status === filters.status) && (!filters.band || row.band === filters.band)
      && (!filters.from || row.date >= filters.from) && (!filters.to || row.date <= filters.to);
  });
  const total = state.lots.reduce((sum, lot) => sum + lot.quantity, 0);
  const dateCounts = dateBands.map((band) => ({ ...band, lots: state.lots.filter((lot) => lotDate(lot).band === band.id) }));
  const quantityDateFilter = kind === "overview" || kind === "inventory" || kind === "date";
  function updateDraft(key: keyof Filters, value: string) { setDraft((current) => ({ ...current, [key]: value })); }
  function exportCsv() {
    const cells = [["Sản phẩm", "Chi tiết", "Số lượng", "Trạng thái", "Nhóm hàng", "Nhà cung cấp"],
      ...filtered.map((row) => [row.name, row.detail, row.quantity, row.status, row.group, row.supplier])];
    const csv = "\uFEFF" + cells.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `coopfood-demo-${kind}-${demoToday()}.csv`;
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportMessage(`Đã xuất ${filtered.length} dòng CSV từ dữ liệu demo.`);
  }
  return <>
    <Heading eyebrow="BÁO CÁO CỬA HÀNG" title="Báo cáo">Chọn loại, áp dụng bộ lọc rồi xem hoặc xuất kết quả từ cùng dữ liệu demo.</Heading>
    <label className="cd-mobile-only cd-report-select">Loại báo cáo<select aria-label="Loại báo cáo" value={kind} onChange={(event) => { setKind(event.target.value as ReportKind); setDraft(emptyFilters); setFilters(emptyFilters); setExportMessage(""); setStatsOpen(false); }}>
      {reportKinds.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <div className="cd-report-tabs" role="group" aria-label="Loại báo cáo">{reportKinds.map((item) => <button type="button" key={item.id}
      className={kind === item.id ? "active" : ""} aria-pressed={kind === item.id}
      onClick={() => { setKind(item.id); setDraft(emptyFilters); setFilters(emptyFilters); setExportMessage(""); }}>{item.label}</button>)}</div>
    <div className="cd-report-body">
    {kind === "overview" && <button className="cd-mobile-only cd-report-stats-toggle" type="button" aria-expanded={statsOpen} onClick={() => setStatsOpen(!statsOpen)}>Thống kê tổng quan <ChevronRight size={17} aria-hidden="true" /></button>}
    {kind === "overview" && <div className={`cd-report-stats ${statsOpen ? "is-open" : ""}`}><div className="cd-kpis">
      <div><small>Tổng tồn</small><strong>{total}</strong><span>đơn vị hàng</span></div>
      {dateCounts.map((band) => <div key={band.id}><small>DATE {band.label}</small><strong>{band.lots.reduce((sum, lot) => sum + lot.quantity, 0)}</strong><span>{band.lots.length} lô</span></div>)}
    </div>
    <div className="cd-report-overview">
      <section className="cd-panel"><h2>Phân bố DATE theo lô</h2>{dateCounts.map((band) => <div className="cd-bar-row" key={band.id}><span>{band.label}</span><div><i style={{ width: `${state.lots.length ? band.lots.length / state.lots.length * 100 : 0}%` }} /></div><b>{band.lots.length}</b></div>)}</section>
      <section className="cd-panel"><h2>Ưu tiên xử lý</h2>
        <p>{state.sessions.filter((item) => item.status === "SUBMITTED").length} đợt chờ duyệt · {state.sessions.filter((item) => item.status === "RECOUNT_REQUIRED").length} cần kiểm lại · {state.adjustments.length} điều chỉnh đã xử lý</p>
        {state.lots.filter((lot) => lotDate(lot).status !== "SAFE").sort((a, b) => lotDate(b).percent - lotDate(a).percent).slice(0, 3).map((lot) => <div className="cd-line" key={lot.id}><span><strong>{product(lot.productId).name}</strong><small>{lotLabel(lot)}</small></span><b>{lotDate(lot).percent}% DATE</b></div>)}
      </section>
      <section className="cd-panel"><h2>Tồn cao nhất & chênh lệch lớn</h2>
        {demoProducts.map((item) => ({ item, quantity: inventoryQuantity(state, item.id) })).sort((a, b) => b.quantity - a.quantity).slice(0, 3).map(({ item, quantity }) => <div className="cd-line" key={item.id}><span><strong>{item.name}</strong><small>{item.sku}</small></span><b>{quantity} {item.unit}</b></div>)}
        <h3>Chênh lệch kiểm kê</h3>
        {state.sessions.flatMap((session) => session.entries.map((entry) => ({ session, entry }))).filter(({ entry }) => diff(entry) !== 0)
          .sort((a, b) => Math.abs(diff(b.entry)) - Math.abs(diff(a.entry))).slice(0, 3).map(({ session, entry }) => <div className="cd-line" key={session.id + entry.productId}><span><strong>{product(entry.productId).name}</strong><small>{session.id} · {statusNames[session.status]}</small></span><b>{signed(diff(entry))}</b></div>)}
      </section>
    </div></div>}
    {kind === "kph" ? <section className="cd-panel"><h2>Dữ liệu KPH thật</h2><p>Phiếu KPH dùng luồng online hiện có. Mở KPH để xem lịch sử, lọc và xuất phiếu theo quyền hiện tại.</p><button className="cd-primary" type="button" onClick={() => navigate("kph")}>Mở KPH <ChevronRight size={18} /></button></section> : <>
      <button type="button" className="cd-mobile-only cd-report-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>Bộ lọc{Object.values(filters).filter(Boolean).length ? ` · ${Object.values(filters).filter(Boolean).length} đang dùng` : ""}<ChevronRight size={17} aria-hidden="true" /></button>
      <section className={`cd-panel cd-report-filter ${filtersOpen ? "is-open" : ""}`}><h2>Bộ lọc</h2><div className="cd-filters">
        <label>{quantityDateFilter ? "HSD từ" : "Ngày từ"}<input type="date" value={draft.from} onChange={(event) => updateDraft("from", event.target.value)} /></label>
        <label>{quantityDateFilter ? "HSD đến" : "Ngày đến"}<input type="date" value={draft.to} onChange={(event) => updateDraft("to", event.target.value)} /></label>
        <label>Nhóm hàng<select value={draft.group} onChange={(event) => updateDraft("group", event.target.value)}><option value="">Tất cả</option>{[...new Set(demoProducts.map((item) => item.group))].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Nhà cung cấp<select value={draft.supplier} onChange={(event) => updateDraft("supplier", event.target.value)}><option value="">Tất cả</option>{[...new Set(demoProducts.map((item) => item.supplier))].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Trạng thái<select value={draft.status} onChange={(event) => updateDraft("status", event.target.value)}><option value="">Tất cả</option>{[...new Set(rows.map((row) => row.status))].map((value) => <option key={value}>{value}</option>)}</select></label>
        {(kind === "overview" || kind === "inventory" || kind === "date") && <label>Vùng DATE<select value={draft.band} onChange={(event) => updateDraft("band", event.target.value)}><option value="">Tất cả</option>{dateBands.map((band) => <option value={band.id} key={band.id}>{band.label}</option>)}</select></label>}
        <label>Từ khóa / SKU<input value={draft.keyword} onChange={(event) => updateDraft("keyword", event.target.value)} placeholder="Tên, SKU, lô…" /></label>
      </div><div className="cd-actions"><button className="cd-primary" type="button" onClick={() => { setFilters({ ...draft }); setExportMessage(""); setFiltersOpen(false); }}>Áp dụng</button>
        <button className="cd-secondary" type="button" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); }}>Xóa lọc</button></div></section>
      <section className="cd-panel cd-results"><div className="cd-section-title"><h2>Kết quả · {filtered.length} dòng</h2>
        <button className="cd-secondary" type="button" onClick={exportCsv}><Download size={17} /> Xuất CSV</button></div>
        {exportMessage && <p className="cd-feedback" role="status">{exportMessage}</p>}
        {filtered.map((row) => <div className="cd-line" key={row.key}><span><strong>{row.name}</strong><small>{row.detail}</small></span><span className="cd-result-values"><b>{row.quantity}</b><small>{row.status}</small></span></div>)}
        {!filtered.length && <p className="cd-empty">Không có kết quả phù hợp bộ lọc.</p>}
      </section>
    </>}
    </div>
  </>;
}
