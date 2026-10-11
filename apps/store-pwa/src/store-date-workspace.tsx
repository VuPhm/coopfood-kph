import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@coopfood-kph/ui";
import { CalendarDays, ChevronRight, Package, Search, SlidersHorizontal } from "lucide-react";
import { StoreSheet, Summary } from "./store-sheet";
import { figmaAsset } from "./figma-assets";
import { daysBetween } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { mockBarcodeLookup, mockCatalogProducts, mockProductMetadata, mockProfile, type MockDateLot, type MockDateLotStatus } from "./store-app-mock";

const statuses: Record<MockDateLotStatus, string> = { open: "Mở", acknowledged: "Đã ghi nhận", resolved: "Đã xử lý" };
const displayDate = (date: string) => date.split("-").reverse().join("/");
const normalize = (value: string) => value.trim().toLocaleLowerCase("vi");
function findProduct(query: string, lots: MockDateLot[]) {
  const term = normalize(query);
  if (!term) return undefined;
  const lot = lots.find(item => normalize(item.id) === term);
  return mockCatalogProducts.find(item => item.barcode === term || item.skuCode === term || normalize(item.name) === term || item.skuCode === lot?.sku);
}
function remainingText(remaining: number) {
  return remaining < 0 ? `Quá ${Math.abs(remaining)} ngày` : remaining === 0 ? "HSD hôm nay" : `Còn ${remaining} ngày`;
}

export function DateWorkspace({ lots, onLotsChange }: { lots: MockDateLot[]; onLotsChange: (lots: MockDateLot[]) => void }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("alerts");
  const [status, setStatus] = useState<MockDateLotStatus>("open");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(min-width: 900px)").matches);
  const product = findProduct(query, lots);
  const metadata = product ? mockProductMetadata[product.id] : undefined;
  const active = lots.find(lot => lot.id === activeId);
  const count = (value: MockDateLotStatus) => lots.filter(lot => lot.status === value).length;
  const today = formatBusinessDate(new Date()).iso;
  const needle = normalize(query);
  const visible = lots.filter(lot => (tab === "tracking" || lot.status === status) &&
    (!needle || `${lot.name} ${lot.sku} ${lot.id}`.toLocaleLowerCase("vi").includes(needle) || (product?.barcode === needle && lot.sku === product.skuCode)));

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
  function updateStatus(next: MockDateLotStatus) {
    if (!active || active.status === "resolved" || (next === "acknowledged" && active.status !== "open")) return;
    onLotsChange(lots.map(lot => lot.id === active.id ? { ...lot, status: next } : lot));
    if (!desktop) setActiveId("");
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
    return <>
      <Summary rows={[["Sản phẩm", lot.name], ["SKU", lot.sku], ["Lô", lot.id], ...(lot.manufactured ? [["NSX", lot.manufactured] as const] : []), ["HSD", displayDate(lot.date)], ["Còn lại", remainingText(daysBetween(today, lot.date))], ["Trạng thái", statuses[lot.status]], ["Cửa hàng", mockProfile.storeName]]} />
      <h3>Xử lý cảnh báo</h3><p className="store-muted">Ghi nhận khi cửa hàng đã tiếp nhận cảnh báo. Chỉ đánh dấu đã xử lý khi hành động thực tế hoàn tất.</p>
      <div className="store-sheet-actions"><Button variant="ghost" disabled={lot.status !== "open"} onClick={() => updateStatus("acknowledged")}>Ghi nhận</Button><Button className="store-button" disabled={lot.status === "resolved"} onClick={() => updateStatus("resolved")}>Đã xử lý</Button></div>
      <p className="store-date-detail-note">Thao tác trên dữ liệu mẫu, chỉ lưu trong phiên; chưa gắn API DATE.</p>
    </>;
  }
  return <div className="store-date">
    <section className="store-date-intro"><span className="store-date-module-icon"><CalendarDays size={24} aria-hidden="true" /></span><div><h2>Mã hàng &amp; lô DATE</h2><p>Tra thông tin hàng hóa, theo dõi và xử lý lô tại một nơi.</p></div></section>
    <form className="store-date-search-form" onSubmit={event => { event.preventDefault(); void search(); }}>
      <label className="store-date-search-wrap"><Search className="store-date-search-icon" size={18} aria-hidden="true" /><span className="sr-only">Tìm SKU, barcode, tên hàng hoặc lô</span><Input className="store-date-search" placeholder="SKU, barcode, tên hàng hoặc lô" autoComplete="off" value={query} onChange={event => changeQuery(event.target.value)} /></label>
      <button type="button" className="store-date-scan" aria-label="Quét mã để tìm lô DATE" onClick={() => setScannerOpen(true)}><img className="store-date-scan-icon" data-figma-asset-slot="date-scan" src={figmaAsset("279-1398", "imgFeatherMaximize")} alt="" /></button>
      <Button className="store-button" type="submit" disabled={busy}>{busy ? "Đang tìm…" : "Tìm mã hàng"}</Button>
    </form>
    <p className="store-date-search-help">Tìm trên các lô trong phiên. Tra mã hàng chính xác để xem SKU, barcode và nhà cung cấp.</p>
    {message ? <p className="store-date-message" role="status">{message}</p> : null}
    {product ? <section className="store-date-product" aria-label="Thông tin mã hàng"><div className="store-date-product-heading"><span className="store-date-module-icon"><Package size={24} aria-hidden="true" /></span><div><span className="store-date-eyebrow">Đã nhận diện mã hàng</span><h2>{product.name}</h2><p>SKU {product.skuCode} · UPC {product.barcode}</p></div></div><dl><div><dt>Nhóm hàng</dt><dd>{metadata?.group ?? "Chưa có dữ liệu"}</dd></div><div><dt>Nhà cung cấp</dt><dd>{product.primarySupplier.code} · {product.primarySupplier.name}</dd></div><div><dt>Đơn vị</dt><dd>{metadata?.unit ?? "Chưa có dữ liệu"}</dd></div><div><dt>Cửa hàng</dt><dd>{mockProfile.storeName}</dd></div></dl></section> : null}
    <div className="store-tabs" role="group" aria-label="Quản lý DATE">{[["alerts", "Cảnh báo", lots.filter(lot => lot.status !== "resolved").length], ["tracking", "Theo dõi DATE", lots.length]].map(([key, label, n]) => <button key={key} aria-pressed={tab === key} className={tab === key ? "is-active" : ""} onClick={() => setTab(String(key))}>{label}<small>{n}</small></button>)}</div>
    <div className="store-list-heading"><div><h2>{tab === "alerts" ? "Cần xử lý" : "Theo dõi DATE"}</h2><p className="store-muted">{visible.length} / {lots.length} lô · {tab === "alerts" ? statuses[status] : "Tất cả trạng thái"}</p></div><div className="store-date-head-actions"><button className="store-filter" aria-label="Lọc DATE" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={20} aria-hidden="true" /></button><button className="store-date-add" disabled title="Chức năng chưa sẵn sàng trong bản dùng thử" aria-describedby="store-date-add-help"><CalendarDays size={18} aria-hidden="true" />Thêm theo dõi</button></div></div>
    <span className="sr-only" id="store-date-add-help">Chức năng chưa sẵn sàng trong bản dùng thử</span>
    {tab === "alerts" ? <div className="store-date-statuses">{Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key} className={status === key ? "is-selected" : ""} onClick={() => setStatus(key as MockDateLotStatus)}>{label} <small>{count(key as MockDateLotStatus)}</small></button>)}</div> : null}
    <div className="store-date-workspace"><div className="store-date-lots">{visible.map(lot => {
      const remaining = daysBetween(today, lot.date);
      return <button key={lot.id} className={`store-date-lot ${activeId === lot.id ? "is-active" : ""}`} onClick={() => setActiveId(lot.id)}><span className="store-date-lot-main"><strong>{lot.name}</strong><small>SKU {lot.sku} · Lô {lot.id}</small><span className={`store-date-status is-${lot.status}`}>{statuses[lot.status]}</span><small>{lot.manufactured ? `NSX ${lot.manufactured} · ` : ""}HSD {displayDate(lot.date)}</small></span><span className="store-date-lot-end"><strong className={remaining < 0 ? "is-danger" : remaining === 0 ? "is-warning" : ""}>{remainingText(remaining)}</strong><span className="store-date-lot-action">{lot.status === "resolved" ? "Xem chi tiết" : "Xử lý"}<ChevronRight size={16} aria-hidden="true" /></span></span></button>;
    })}{!visible.length ? <section className="store-date-empty"><Package size={28} aria-hidden="true" /><h3>Không có lô phù hợp</h3><p>{product ? "Mã hàng đã nhận diện. Thử trạng thái khác hoặc bỏ lọc để xem các lô." : "Thử mã hàng, tên hoặc số lô khác; bạn cũng có thể quét lại."}</p><Button variant="ghost" onClick={() => { changeQuery(""); setTab("tracking"); }}>Xem tất cả lô</Button></section> : null}</div>
      {desktop ? <section className="store-date-detail" aria-label="Chi tiết lô DATE">{active ? <><div className="store-date-detail-heading"><h2>Chi tiết lô DATE</h2><span className={`store-date-status is-${active.status}`}>{statuses[active.status]}</span></div>{detail(active)}</> : <div className="store-date-detail-placeholder"><CalendarDays size={32} aria-hidden="true" /><h2>Chọn một lô để xem chi tiết</h2><p>Thông tin sản phẩm, ngày và thao tác xử lý sẽ hiển thị tại đây.</p></div>}</section> : null}
    </div>
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={value => { void search(value); }} presentation="screen" />
    <StoreSheet className="store-date-sheet" open={filterOpen} onOpenChange={setFilterOpen} title="Lọc DATE" description="Chọn trạng thái cảnh báo DATE"><div className="store-choices">{Object.entries(statuses).map(([key, label]) => <button key={key} aria-pressed={status === key && tab === "alerts"} className={status === key && tab === "alerts" ? "is-selected" : ""} onClick={() => { setStatus(key as MockDateLotStatus); setTab("alerts"); }}>{label}</button>)}</div><p className="store-muted">Bộ lọc áp dụng ngay trên các lô đang hiển thị.</p><Button className="store-button" onClick={() => setFilterOpen(false)}>Xong</Button></StoreSheet>
    {!desktop ? <StoreSheet className="store-date-sheet" open={!!active} onOpenChange={open => { if (!open) setActiveId(""); }} title="Xử lý cảnh báo DATE" description="Cập nhật trạng thái lô trong dữ liệu mẫu">{active ? detail(active) : null}</StoreSheet> : null}
  </div>;
}
