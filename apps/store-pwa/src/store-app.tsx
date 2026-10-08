import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from "@coopfood-kph/ui";
import { ArrowLeft, Home } from "lucide-react";
import { figmaAsset } from "./figma-assets";
import { KphWorkspace } from "./store-kph-workspace";
import { ShelfLifeScreen } from "./store-shelf-life";
import { DateWorkspace } from "./store-date-workspace";
import { StoreLookupWorkspace } from "./store-lookup-workspace";
import { mockDateLots, mockProfile, mockRecords } from "./store-app-mock";
import "./store-app.css";

type Screen = "home" | "kph" | "shelf" | "lookup" | "date";
const screens = {
  home: { title: "CoopFood", subtitle: "Cửa hàng hiện tại" },
  kph: { title: "KPH", subtitle: "Hàng không phù hợp" },
  shelf: { title: "Tra cứu lùi hàng", subtitle: "NSX · HSD · hạn lùi" },
  lookup: { title: "Tra cứu", subtitle: "Sản phẩm và lô hàng" },
  date: { title: "DATE", subtitle: "Theo dõi DATE" },
};
function readScreen(): Screen {
  const key = window.location.hash.slice(1);
  return key in screens ? key as Screen : "home";
}

export function StoreApp() {
  const [screen, setScreen] = useState<Screen>(readScreen);
  const [accountOpen, setAccountOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const quickFabRef = useRef<HTMLButtonElement>(null);
  const quickPanelRef = useRef<HTMLDivElement>(null);
  const [records, setRecords] = useState(mockRecords);
  const [dateLots, setDateLots] = useState(mockDateLots);
  const recordRef = useRef(records); recordRef.current = records;
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => () => {
    for (const record of recordRef.current) for (const photo of record.photos) {
      if (photo.src.startsWith("blob:")) URL.revokeObjectURL(photo.src);
    }
  }, []);
  useEffect(() => {
    if (!quickOpen) return;
    const frame = window.requestAnimationFrame(() => quickPanelRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setQuickOpen(false); window.requestAnimationFrame(() => quickFabRef.current?.focus()); } };
    window.addEventListener("keydown", closeOnEscape);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("keydown", closeOnEscape); };
  }, [quickOpen]);
  useEffect(() => {
    const sync = () => { setScreen(readScreen()); setNotice(""); setQuickOpen(false); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const navigate = (next: Screen) => { window.location.hash = next; };
  const profileName = mockProfile.fullName.split(/\s+/).slice(-2).join(" ");
  const initials = profileName.split(/\s+/).map(part => part[0]).join("").toUpperCase();

  return <div className={`store-app store-screen-${screen}`}>
    <a className="sr-only focus:not-sr-only" href="#store-content" onClick={event => { event.preventDefault(); document.getElementById("store-content")?.focus(); }}>Đến nội dung</a>
    <aside className="store-desktop-rail" aria-label="Điều hướng cửa hàng">
      <button className="store-rail-brand" onClick={() => navigate("home")}><strong>CoopFood</strong><small>Vận hành cửa hàng</small></button>
      <p className="store-rail-label">NGHIỆP VỤ</p>
      <nav>
        <button className={screen === "lookup" ? "is-active" : ""} onClick={() => navigate("lookup")}><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherFileText")} alt="" />Tra cứu</button>
        <button className={screen === "kph" ? "is-active" : ""} onClick={() => navigate("kph")}><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherXSquare")} alt="" />KPH</button>
        <button className={screen === "date" ? "is-active" : ""} onClick={() => navigate("date")}><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherCalendar")} alt="" />DATE</button>
      </nav>
      <p className="store-rail-label">TIỆN ÍCH</p>
      <nav><button className={screen === "shelf" ? "is-active" : ""} onClick={() => navigate("shelf")}><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherCalendar")} alt="" />Tra hạn lùi hàng</button></nav>
      <div className="store-rail-store"><small>CỬA HÀNG HIỆN TẠI</small><strong>{mockProfile.storeName}</strong></div>
    </aside>
    <section className="store-main-column">
      <header className="store-header">
        {screen !== "home" ? <button className="store-back" aria-label="Về trang chủ" onClick={() => navigate("home")}><ArrowLeft size={20} /></button> : null}
        <div className="store-header-copy"><h1>{screens[screen].title}</h1><p>{screens[screen].subtitle}</p></div>
        <span className="store-header-store">{mockProfile.storeName}</span>
        <button className="store-account" aria-label="Tài khoản và cửa hàng" onClick={() => setAccountOpen(true)}><span className="store-profile-avatar">{initials}</span><span className="store-profile-meta"><strong>{profileName}</strong><small>Quản lý cửa hàng</small></span></button>
      </header>
      <main id="store-content" tabIndex={-1}>
      {screen === "home" ? <><div className="store-home-welcome"><h2>Xin chào, {mockProfile.fullName}</h2><p>{mockProfile.storeName}</p></div><div className="store-launcher store-launcher-mobile" aria-label="Công việc cửa hàng">
        {([
          ["kph", "KPH", "imgFeatherXSquare"],
          ["shelf", "Tra cứu lùi hàng", "imgFeatherFileText"],
          ["date", "Quản lý DATE", "imgFeatherCalendar"],
        ] as const).map(([key, title, icon]) => <button key={key} className={`store-module module-${key}`} onClick={() => navigate(key)}>
          <span className="store-module-icon"><img src={figmaAsset("main-0", icon)} alt="" /></span><strong>{title}</strong>
        </button>)}
      </div><div className="store-launcher store-launcher-desktop" aria-label="Công việc cửa hàng">{([
        ["lookup", "Tra cứu", "imgFeatherFileText"], ["kph", "KPH", "imgFeatherXSquare"], ["date", "DATE", "imgFeatherCalendar"],
        ] as const).map(([key, title, icon]) => <button key={key} className={`store-module module-${key}`} onClick={() => navigate(key)}><span className="store-module-icon"><img src={figmaAsset("main-0", icon)} alt="" /></span><strong>{title}</strong><i aria-hidden="true"><img data-figma-render-width="14" data-figma-render-height="14" src={figmaAsset("main-2", "imgFeatherChevronRight")} alt="" /></i></button>)}</div><div className="store-home-panels"><section><h3>Cần chú ý hôm nay</h3><button onClick={() => navigate("date")}><span>DATE</span><strong>{dateLots.filter(lot => lot.status === "open").length} cảnh báo đang mở</strong><b>Mở</b></button><button onClick={() => navigate("kph")}><span>KPH</span><strong>{records.filter(r => r.approvalStatus === "PENDING").length} phiếu chờ duyệt</strong><b>Mở</b></button></section><section><span className="store-home-utility-icon"><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherCalendar")} alt="" /></span><div><strong>Tra hạn lùi hàng</strong><small>Tiện ích dùng chung</small></div><button onClick={() => navigate("shelf")}>Mở</button></section></div></> : null}
      {screen === "shelf" ? <ShelfLifeScreen /> : null}
      {screen === "kph" ? <KphWorkspace records={records} onRecordsChange={setRecords} onNotice={setNotice} /> : null}
      {screen === "lookup" ? <StoreLookupWorkspace /> : null}
      {screen === "date" ? <DateWorkspace lots={dateLots} onLotsChange={setDateLots} /> : null}
      {screen === "kph" || screen === "date" ? <button ref={quickFabRef} className="store-quick-fab" aria-label="Mở tiện ích tra cứu lùi hàng" aria-expanded={quickOpen} onClick={() => setQuickOpen(open => !open)}><img data-figma-asset-slot="shelf-quick-clock" src={figmaAsset("r2", "imgFeatherClock")} alt="" /></button> : null}
      {quickOpen && (screen === "kph" || screen === "date") ? <div ref={quickPanelRef} className="store-quick-panel" role="dialog" aria-label="Tra cứu lùi hàng nhanh" tabIndex={-1}><header><strong>Tra cứu lùi hàng</strong><button aria-label="Đóng tiện ích" onClick={() => { setQuickOpen(false); window.requestAnimationFrame(() => quickFabRef.current?.focus()); }}><img data-figma-asset-slot="shelf-quick-close" src={figmaAsset("r2", "imgFeatherX")} alt="" /></button></header><ShelfLifeScreen idPrefix="quick-shelf" /></div> : null}
      </main>
    </section>
    {notice ? <div className="store-toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Đóng thông báo">Đóng</button></div> : null}
    <StoreSheet open={accountOpen} onOpenChange={setAccountOpen} title="Tài khoản" description="Tài khoản và cửa hàng đang sử dụng">
      <Summary rows={[["Họ tên", mockProfile.fullName], ["Cửa hàng", mockProfile.storeName], ["Vai trò", "Quản lý cửa hàng"]]} />
      <p className="store-muted">Dữ liệu mẫu tạm thời. Các thay đổi chỉ giữ trong phiên này, chưa gửi lên hệ thống.</p>
      <Button className="store-button" onClick={() => { setAccountOpen(false); navigate("home"); }}><Home size={18} />Trang chủ</Button>
    </StoreSheet>
  </div>;
}

export function StoreSheet({ open, onOpenChange, title, description, children, className }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode; className?: string;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={`store-sheet ${className ?? ""}`}>
    <span className="store-sheet-handle" aria-hidden="true" />
    <div className="store-sheet-heading"><DialogTitle>{title}</DialogTitle><button onClick={() => onOpenChange(false)}>Đóng</button></div>
    <DialogDescription className="sr-only">{description}</DialogDescription>
    {children}
  </DialogContent></Dialog>;
}

export function Summary({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) {
  return <dl className="store-summary">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
