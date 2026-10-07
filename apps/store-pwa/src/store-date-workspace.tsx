import { useEffect, useState } from "react";
import { Button, Input } from "@coopfood-kph/ui";
import { StoreSheet, Summary } from "./store-app";
import { figmaAsset } from "./figma-assets";
import { daysBetween } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { mockDateLots } from "./store-app-mock";
const statuses = { open: "Mở", acknowledged: "Đã ghi nhận", resolved: "Đã xử lý" };
export function DateWorkspace() {
  const [lots, setLots] = useState(mockDateLots);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("alerts");
  const [status, setStatus] = useState("open");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(min-width: 900px)").matches);
  const active = lots.find(l => l.id === activeId);
  const count = (s: string) => lots.filter(l => l.status === s).length;
  const visible = lots.filter(l => (tab === "tracking" || l.status === status) && `${l.name} ${l.sku} ${l.id}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(min-width: 900px)");
    const update = () => setDesktop(media.matches);
    update(); media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  useEffect(() => { if (activeId && !visible.some(l => l.id === activeId)) setActiveId(""); }, [activeId, visible]);
  return <div className="store-date">
    <div className="store-date-search-wrap"><img className="store-date-search-icon" data-figma-asset-slot="date-search" src={figmaAsset("date", "imgFeatherSearch")} alt="" /><Input className="store-date-search" aria-label="Tìm mã hàng hoặc lô" placeholder="Mã hàng, lô hoặc quét" value={query} onChange={e => setQuery(e.target.value)} /><button aria-label="Quét mã để tìm lô DATE" onClick={() => setScannerOpen(true)}><span><img className="store-date-scan-icon" data-figma-asset-slot="date-scan" src={figmaAsset("279-1398", "imgFeatherMaximize")} alt="" /></span></button></div>
    <div className="store-tabs" role="group" aria-label="Quản lý DATE">{[["alerts", "Cảnh báo", lots.filter(l => l.status !== "resolved").length], ["tracking", "Theo dõi DATE", lots.length]].map(([key, label, n]) => <button key={key} aria-pressed={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(String(key))}>{label}<small>{n}</small></button>)}</div>
    <div className="store-list-heading"><div><h2>{tab === "alerts" ? "Cần xử lý" : "Theo dõi DATE"}</h2><p className="store-muted">{tab === "alerts" ? `${count("open")} cảnh báo đang mở` : `${lots.length} lô trong dữ liệu mẫu`}</p></div><div className="store-date-head-actions"><button className="store-filter" aria-label="Lọc DATE" onClick={() => setFilterOpen(true)}><img data-figma-asset-slot="date-filter" src={figmaAsset("r2", "imgFeatherSliders")} alt="" /></button><button className="store-date-add" disabled title="Chức năng chưa sẵn sàng trong bản dùng thử" aria-describedby="store-date-add-help"><img data-figma-render-width-desktop="15" data-figma-render-height-desktop="15" src={figmaAsset("main-0", "imgFeatherCalendar")} alt="" />Thêm theo dõi</button></div></div>
    <span className="sr-only" id="store-date-add-help">Chức năng chưa sẵn sàng trong bản dùng thử</span>
    {tab === "alerts" ? <div className="store-date-statuses">{Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key} className={status === key ? "is-selected" : ""} onClick={() => setStatus(key)}>{label}{key !== "resolved" ? ` ${count(key)}` : ""}</button>)}</div> : null}
    <div className="store-date-workspace"><div className="store-date-lots">{visible.map(lot => { const remaining = daysBetween(formatBusinessDate(new Date()).iso, lot.date); return <button key={lot.id} className={`store-date-lot ${activeId === lot.id ? "is-active" : ""}`} onClick={() => setActiveId(lot.id)}><span><strong>{lot.name}</strong><small>SKU {lot.sku} · Lô {lot.id}</small></span><span><strong className={remaining <= 0 ? "is-danger" : "is-warning"}>{remaining < 0 ? `Qua ${Math.abs(remaining)}` : remaining} ngày</strong><small>{lot.date.split("-").reverse().join("/")}</small><b>{lot.status === "resolved" ? "Đã xử lý" : "Xử lý"}</b></span></button>; })}</div><section className="store-date-detail">{active ? <><div className="store-date-detail-heading"><div><h2>Chi tiết cảnh báo</h2><p>{active.name} · Lô {active.id}</p></div><span>{statuses[active.status as keyof typeof statuses]}</span></div><Summary rows={[["SKU", active.sku], ["Hạn sử dụng", active.date.split("-").reverse().join("/")], ["Còn lại", `${daysBetween(formatBusinessDate(new Date()).iso, active.date)} ngày`], ["Cửa hàng", "Cửa hàng mẫu"]]} /><h3>Xử lý cảnh báo</h3><p className="store-muted">Ghi nhận khi cửa hàng đã tiếp nhận cảnh báo. Chỉ đánh dấu đã xử lý khi hành động thực tế hoàn tất.</p><div className="store-sheet-actions"><Button variant="ghost" disabled={active.status !== "open"} onClick={() => setLots(lots.map(l => l.id === active.id ? { ...l, status: "acknowledged" } : l))}>Ghi nhận</Button><Button className="store-button" disabled={active.status === "resolved"} onClick={() => setLots(lots.map(l => l.id === active.id ? { ...l, status: "resolved" } : l))}>Đã xử lý</Button></div><p className="store-date-detail-note">Chưa có thao tác xử lý</p></> : <p className="store-muted">Chọn một lô để xem chi tiết.</p>}</section></div>
    {!visible.length ? <p className="store-muted store-empty">Không có lô phù hợp.</p> : null}
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={setQuery} presentation="screen" />
    <StoreSheet open={filterOpen} onOpenChange={setFilterOpen} title="Lọc DATE" description="Chọn trạng thái cảnh báo DATE"><div className="store-choices">{Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key} className={status === key ? "is-selected" : ""} onClick={() => { setStatus(key); setTab("alerts"); }}>{label}</button>)}</div><p className="store-muted">Bộ lọc áp dụng ngay trên dữ liệu mẫu.</p></StoreSheet>
    {!desktop ? <StoreSheet open={!!active} onOpenChange={open => { if (!open) setActiveId(""); }} title="Xử lý cảnh báo DATE" description="Cập nhật trạng thái lô trong dữ liệu mẫu">
      {active ? <><Summary rows={[["Sản phẩm", active.name], ["SKU", active.sku], ["Lô", active.id], ["HSD", active.date.split("-").reverse().join("/")], ["Trạng thái", statuses[active.status as keyof typeof statuses]]]} /><p className="store-muted">Thao tác mô phỏng, chưa gắn API DATE.</p><div className="store-sheet-actions"><Button variant="ghost" onClick={() => { setLots(lots.map(l => l.id === active.id ? { ...l, status: "acknowledged" } : l)); setActiveId(""); }}>Ghi nhận</Button><Button className="store-button" onClick={() => { setLots(lots.map(l => l.id === active.id ? { ...l, status: "resolved" } : l)); setActiveId(""); }}>Đã xử lý</Button></div></> : null}
    </StoreSheet> : null}
  </div>;
}
