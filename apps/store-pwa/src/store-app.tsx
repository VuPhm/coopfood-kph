import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from "@coopfood-kph/ui";
import { ArrowLeft, Home, UserRound } from "lucide-react";
import { figmaAsset } from "./figma-assets";
import { KphWorkspace } from "./store-kph-workspace";
import { ShelfLifeScreen } from "./store-shelf-life";
import { DateWorkspace } from "./store-date-workspace";
import { mockProfile, mockRecords } from "./store-app-mock";
import "./store-app.css";

type Screen = "home" | "kph" | "shelf" | "date";
const screens = {
  home: { title: "CoopFood", subtitle: "Cửa hàng hiện tại" },
  kph: { title: "KPH", subtitle: "Hàng không phù hợp" },
  shelf: { title: "Tra cứu lùi hàng", subtitle: "NSX · HSD · hạn lùi" },
  date: { title: "DATE", subtitle: "Theo dõi DATE" },
};
function readScreen(): Screen {
  const key = window.location.hash.slice(1);
  return key in screens ? key as Screen : "home";
}

export function StoreApp() {
  const [screen, setScreen] = useState<Screen>(readScreen);
  const [accountOpen, setAccountOpen] = useState(false);
  const [records, setRecords] = useState(mockRecords);
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
    const sync = () => { setScreen(readScreen()); setNotice(""); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const navigate = (next: Screen) => { window.location.hash = next; };

  return <div className={`store-app store-screen-${screen}`}>
    <a className="sr-only focus:not-sr-only" href="#store-content" onClick={event => { event.preventDefault(); document.getElementById("store-content")?.focus(); }}>Đến nội dung</a>
    <header className="store-header">
      {screen !== "home" ? <button className="store-back" aria-label="Về trang chủ" onClick={() => navigate("home")}><ArrowLeft size={20} /></button> : null}
      <div className="store-header-copy"><h1>{screens[screen].title}</h1><p>{screens[screen].subtitle}</p></div>
      <button className="store-account" aria-label="Tài khoản và cửa hàng" onClick={() => setAccountOpen(true)}><UserRound size={24} strokeWidth={2} aria-hidden="true" /></button>
    </header>
    <main id="store-content" tabIndex={-1}>
      {screen === "home" ? <div className="store-launcher" aria-label="Công việc cửa hàng">
        {([
          ["kph", "KPH", "imgFeatherXSquare"],
          ["shelf", "Tra cứu lùi hàng", "imgFeatherFileText"],
          ["date", "Quản lý DATE", "imgFeatherCalendar"],
        ] as const).map(([key, title, icon]) => <button key={key} className={`store-module module-${key}`} onClick={() => navigate(key)}>
          <span className="store-module-icon"><img src={figmaAsset("main-0", icon)} alt="" /></span><strong>{title}</strong>
        </button>)}
      </div> : null}
      {screen === "shelf" ? <ShelfLifeScreen /> : null}
      {screen === "kph" ? <KphWorkspace records={records} onRecordsChange={setRecords} onNotice={setNotice} /> : null}
      {screen === "date" ? <DateWorkspace /> : null}
    </main>
    {notice ? <div className="store-toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Đóng thông báo">Đóng</button></div> : null}
    <StoreSheet open={accountOpen} onOpenChange={setAccountOpen} title="Tài khoản" description="Tài khoản và cửa hàng đang sử dụng">
      <Summary rows={[["Họ tên", mockProfile.fullName], ["Cửa hàng", mockProfile.storeName], ["Vai trò", "Quản lý cửa hàng"]]} />
      <p className="store-muted">Dữ liệu mẫu tạm thời. Các thay đổi chỉ giữ trong phiên này, chưa gửi lên hệ thống.</p>
      <Button className="store-button" onClick={() => { setAccountOpen(false); navigate("home"); }}><Home size={18} />Trang chủ</Button>
    </StoreSheet>
  </div>;
}

export function StoreSheet({ open, onOpenChange, title, description, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="store-sheet">
    <span className="store-sheet-handle" aria-hidden="true" />
    <div className="store-sheet-heading"><DialogTitle>{title}</DialogTitle><button onClick={() => onOpenChange(false)}>Đóng</button></div>
    <DialogDescription className="sr-only">{description}</DialogDescription>
    {children}
  </DialogContent></Dialog>;
}

export function Summary({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) {
  return <dl className="store-summary">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
