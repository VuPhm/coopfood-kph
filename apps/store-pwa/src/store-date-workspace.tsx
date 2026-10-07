import { useState } from "react";
import { Button, Input } from "@coopfood-kph/ui";
import { StoreSheet, Summary } from "./store-app";
import { figmaAsset } from "./figma-assets";
import { daysBetween } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { Search, ScanLine } from "lucide-react";

const initialLots = [
  { id: "C24-118", name: "Sản phẩm C", sku: "089332", date: "2026-10-07" as const, status: "open" },
  { id: "D24-090", name: "Sản phẩm D", sku: "071204", date: "2026-10-12" as const, status: "open" },
  { id: "A24-008", name: "Sản phẩm A", sku: "000008", date: "2026-10-20" as const, status: "acknowledged" },
  { id: "B24-011", name: "Sản phẩm B", sku: "000011", date: "2026-10-25" as const, status: "acknowledged" },
];
const statuses = { open: "Mở", acknowledged: "Đã ghi nhận", resolved: "Đã xử lý" };
export function DateWorkspace() {
  const [lots, setLots] = useState(initialLots);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("alerts");
  const [status, setStatus] = useState("open");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const active = lots.find(l => l.id === activeId);
  const count = (s: string) => lots.filter(l => l.status === s).length;
  const visible = lots.filter(l => (tab === "tracking" || l.status === status) && `${l.name} ${l.sku} ${l.id}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  return <div className="store-date">
    <div className="store-date-search-wrap"><Search className="store-date-search-icon" size={24} strokeWidth={2} aria-hidden="true" /><Input className="store-date-search" aria-label="Tìm mã hàng hoặc lô" placeholder="Mã hàng, lô hoặc quét" value={query} onChange={e => setQuery(e.target.value)} /><button aria-label="Quét mã để tìm lô DATE" onClick={() => setScannerOpen(true)}><span><ScanLine size={20} strokeWidth={2} aria-hidden="true" /></span></button></div>
    <div className="store-tabs" role="group" aria-label="Quản lý DATE">{[["alerts", "Cảnh báo", lots.filter(l => l.status !== "resolved").length], ["tracking", "Theo dõi DATE", lots.length]].map(([key, label, n]) => <button key={key} aria-pressed={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(String(key))}>{label}<small>{n}</small></button>)}</div>
    <div className="store-list-heading"><div><h2>{tab === "alerts" ? "Cần xử lý" : "Theo dõi DATE"}</h2><p className="store-muted">{tab === "alerts" ? `${count("open")} cảnh báo đang mở` : `${lots.length} lô trong dữ liệu mẫu`}</p></div><button className="store-filter" aria-label="Lọc DATE" onClick={() => setFilterOpen(true)}><img src={figmaAsset("main-3", "imgFeatherFilter")} alt="" /></button></div>
    {tab === "alerts" ? <div className="store-date-statuses">{Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key} className={status === key ? "is-selected" : ""} onClick={() => setStatus(key)}>{label}{key !== "resolved" ? ` ${count(key)}` : ""}</button>)}</div> : null}
    <div className="store-date-lots">{visible.map(lot => { const remaining = daysBetween(formatBusinessDate(new Date()).iso, lot.date); return <button key={lot.id} className="store-date-lot" onClick={() => setActiveId(lot.id)}><span><strong>{lot.name}</strong><small>SKU {lot.sku} · Lô {lot.id}</small></span><span><strong className={remaining <= 0 ? "is-danger" : "is-warning"}>{remaining < 0 ? `Qua ${Math.abs(remaining)}` : remaining} ngày</strong><small>{lot.date.split("-").reverse().join("/")}</small><b>{lot.status === "resolved" ? "Đã xử lý" : "Xử lý"}</b></span></button>; })}</div>
    {!visible.length ? <p className="store-muted store-empty">Không có lô phù hợp.</p> : null}
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={setQuery} presentation="screen" />
    <StoreSheet open={filterOpen} onOpenChange={setFilterOpen} title="Lọc DATE" description="Chọn trạng thái cảnh báo DATE"><div className="store-choices">{Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key} className={status === key ? "is-selected" : ""} onClick={() => { setStatus(key); setTab("alerts"); }}>{label}</button>)}</div><p className="store-muted">Bộ lọc áp dụng ngay trên dữ liệu mẫu.</p></StoreSheet>
    <StoreSheet open={!!active} onOpenChange={open => { if (!open) setActiveId(""); }} title="Xử lý cảnh báo DATE" description="Cập nhật trạng thái lô trong dữ liệu mẫu">
      {active ? <><Summary rows={[["Sản phẩm", active.name], ["SKU", active.sku], ["Lô", active.id], ["HSD", active.date.split("-").reverse().join("/")], ["Trạng thái", statuses[active.status as keyof typeof statuses]]]} /><p className="store-muted">Thao tác mô phỏng, chưa gắn API DATE.</p><div className="store-sheet-actions"><Button variant="ghost" onClick={() => { setLots(lots.map(l => l.id === active.id ? { ...l, status: "acknowledged" } : l)); setActiveId(""); }}>Ghi nhận</Button><Button className="store-button" onClick={() => { setLots(lots.map(l => l.id === active.id ? { ...l, status: "resolved" } : l)); setActiveId(""); }}>Đã xử lý</Button></div></> : null}
    </StoreSheet>
  </div>;
}
