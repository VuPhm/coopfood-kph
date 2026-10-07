import { useEffect, useRef, useState } from "react";
import { Button } from "@coopfood-kph/ui";
import { getConditionTone, getResolutionTone, parseDisplayDate, type KphKind } from "@coopfood-kph/kph-rules";
import { CreateRecordDialog, type CreatedRecordDraft } from "./create-record-dialog";
import { approvalLabels, type ApprovalStatus, type RecordView } from "./record-view";
import { mockBarcodeLookup, mockProfile } from "./store-app-mock";
import { figmaAsset } from "./figma-assets";
import { StoreSheet, Summary } from "./store-app";
import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { EvidenceImageViewer } from "./image-viewer";

const labels: Record<KphKind, string> = { TPCN: "TP khô & khác", TPTS: "TP tươi sống" };
const PAGE_SIZE = 4;
export function KphWorkspace({ records, onRecordsChange, onNotice }: {
  records: RecordView[]; onRecordsChange: (records: RecordView[]) => void; onNotice: (message: string) => void;
}) {
  const [kind, setKind] = useState<KphKind>("TPTS");
  const [createKind, setCreateKind] = useState<KphKind | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [approval, setApproval] = useState<"ALL" | ApprovalStatus>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<RecordView | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
  // Record URLs outlive workspace navigation. StoreApp owns the records in memory.
  const latestRecords = useRef(records); latestRecords.current = records;
  useEffect(() => { setSelection([]); setPage(1); setActive(null); }, [kind, approval, from, to, sort]);
  function iso(value: string) { try { return parseDisplayDate(value); } catch { return null; } }
  const fromIso = from ? iso(from) : null, toIso = to ? iso(to) : null;
  const filterError = (from && !fromIso) || (to && !toIso) ? "Nhập ngày hợp lệ theo dd/mm/yyyy" : fromIso && toIso && fromIso > toIso ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" : "";
  const dateFiltered = filterError ? [] : records.filter(r => (!fromIso || (iso(r.detectedDate) ?? "") >= fromIso) && (!toIso || (iso(r.detectedDate) ?? "") <= toIso));
  const filtered = dateFiltered.filter(r => r.kind === kind && (approval === "ALL" || r.approvalStatus === approval)).sort((a, b) => {
    if (sort === "name") return a.productName.localeCompare(b.productName, "vi");
    const delta = (iso(b.detectedDate) ?? "").localeCompare(iso(a.detectedDate) ?? "");
    return sort === "oldest" ? -delta : delta;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const eligible = visible.filter(r => selection.includes(r.id) && r.approvalStatus === "APPROVED");
  const changePage = (next: number) => { setPage(next); setSelection([]); setActive(null); };
  async function save(draft: CreatedRecordDraft) {
    const record: RecordView = {
      id: draft.idempotencyKey ?? crypto.randomUUID(), kind: draft.kind,
      detectedDate: draft.detectedDate, detectedBy: draft.detectedBy,
      sku: draft.barcode, productName: draft.productName, supplier: draft.supplier,
      quantity: `${draft.quantity} ${draft.unit}`, quantityValue: draft.quantity, unit: draft.unit,
      condition: draft.condition, resolution: draft.resolution, treatmentDate: draft.treatmentDate,
      approvalStatus: "PENDING", note: draft.note,
      photos: draft.photos.map((p, i) => ({ id: p.id, blob: p.blob, fileName: p.fileName, src: URL.createObjectURL(p.blob), alt: `Ảnh minh chứng ${i + 1}` })),
    };
    onRecordsChange([record, ...latestRecords.current]); setKind(draft.kind); setApproval("ALL"); setFrom(""); setTo(""); setPage(1); setSelection([]);
    onNotice("Đã tạo phiếu trong phiên dữ liệu mẫu; chưa gửi lên hệ thống.");
  }
  function review(status: ApprovalStatus) {
    if (!active) return;
    const next = { ...active, approvalStatus: status, reviewedBy: mockProfile.fullName };
    onRecordsChange(records.map(r => r.id === next.id ? next : r)); setActive(next);
    onNotice("Đã cập nhật trạng thái trong dữ liệu mẫu.");
  }
  async function download() {
    if (!eligible.length || exporting) return;
    setExporting(true); setError("");
    try {
      const { buildKphWorkbook } = await import("./excel-export");
      const workbook = await buildKphWorkbook(kind, eligible, mockProfile);
      const bytes = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a"); link.href = url; link.download = `KPH-MAU-${kind}.xlsx`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportOpen(false); onNotice("Đã tải file Excel từ dữ liệu mẫu.");
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể xuất Excel. Thử lại."); }
    finally { setExporting(false); }
  }

  return <div className="store-kph">
    <section className="store-create-actions"><h2>Tạo phiếu KPH</h2><div className="store-two-col">{(["TPCN", "TPTS"] as const).map(k => <button key={k} onClick={() => setCreateKind(k)}><span><img src={figmaAsset("main-2", k === "TPCN" ? "imgFeatherPackage" : "imgFeatherShoppingBag")} alt="" /></span><strong>{labels[k]}</strong></button>)}</div></section>
    <section className="store-ticket-list" aria-label="Phiếu khai báo">
      <div className="store-list-heading"><h2>Phiếu khai báo</h2><div><button className="store-compact" onClick={() => { setSelectionMode(!selectionMode); setSelection([]); }}>{selectionMode ? "Xong" : "Chọn"}</button><button className="store-filter" aria-label="Lọc phiếu KPH" onClick={() => setFilterOpen(true)}><img src={figmaAsset("main-2", "imgFeatherFilter")} alt="" /></button></div></div>
      <div className="store-tabs" role="group" aria-label="Loại phiếu">{(["TPCN", "TPTS"] as const).map(k => <button key={k} aria-pressed={kind === k} className={kind === k ? "is-active" : ""} onClick={() => setKind(k)}>{labels[k]}<small>{dateFiltered.filter(r => r.kind === k).length}</small></button>)}</div>
      {selectionMode ? <div className="store-batch"><label><input type="checkbox" checked={visible.length > 0 && visible.every(r => selection.includes(r.id))} onChange={e => setSelection(e.target.checked ? visible.map(r => r.id) : [])} />Chọn tất cả</label><span>{selection.length} đã chọn</span><Button className="store-export" disabled={!selection.length} onClick={() => { setError(""); setExportOpen(true); }}><img src={figmaAsset("124-445", "imgFileDown")} alt="" />Xuất Excel</Button></div> : null}
      {filterError ? <p className="store-error" role="alert">{filterError}</p> : null}
      <div className="store-tickets">{visible.map(record => <div key={record.id} className="store-ticket">
        {selectionMode ? <label className="store-ticket-selector"><input className="store-ticket-check" type="checkbox" aria-label={`Chọn ${record.productName}`} checked={selection.includes(record.id)} onChange={e => setSelection(e.target.checked ? [...selection, record.id] : selection.filter(id => id !== record.id))} /></label> : null}
        <button className="store-ticket-open" onClick={() => setActive(record)}><strong>{record.productName}</strong><span className="store-ticket-sku">{record.sku || "Nhập tay"}</span><span className="store-ticket-meta">{record.detectedDate} · {record.quantity}</span><span className="store-ticket-tags"><span className={`store-chip chip-${getConditionTone(record.condition)}`}>{record.condition}</span><span className={`store-chip chip-${getResolutionTone(record.resolution)}`}>{record.resolution}</span><span className={`store-chip chip-${record.approvalStatus === "APPROVED" ? "safe" : record.approvalStatus === "PENDING" ? "warning" : "neutral"}`}>{approvalLabels[record.approvalStatus]}</span></span><img className="store-ticket-chevron" src={figmaAsset("main-2", "imgFeatherChevronRight")} alt="" /></button>
      </div>)}</div>
      {!visible.length ? <p className="store-muted store-empty">Không có phiếu phù hợp bộ lọc.</p> : null}
      {totalPages > 1 ? <div className="store-pagination"><span>{currentPage}/{totalPages} trang</span><button disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)} aria-label="Trang trước">‹</button><button disabled={currentPage >= totalPages} onClick={() => changePage(currentPage + 1)} aria-label="Trang sau">›</button></div> : null}
    </section>
    <CreateRecordDialog kind={createKind} open={createKind !== null} onOpenChange={open => { if (!open) setCreateKind(null); }} onSaved={save} onBarcodeLookup={mockBarcodeLookup} profile={mockProfile} actorReadOnly onlineMode presentation="screen" />
    <StoreSheet open={filterOpen} onOpenChange={setFilterOpen} title="Lọc & sắp xếp" description="Bộ lọc phiếu áp dụng ngay khi thay đổi">
      <h3>Ngày phát hiện hàng KPH</h3><div className="store-date-range"><div className="store-field"><label htmlFor="filter-from">Từ ngày</label><CalendarInput id="filter-from" label="Từ ngày" initialMonth={formatBusinessDate(new Date()).iso} value={from} onValueChange={setFrom} /></div><span>→</span><div className="store-field"><label htmlFor="filter-to">Đến ngày</label><CalendarInput id="filter-to" label="Đến ngày" initialMonth={formatBusinessDate(new Date()).iso} value={to} onValueChange={setTo} /></div></div>
      {filterError ? <p className="store-error" role="alert">{filterError}</p> : null}
      <h3>Trạng thái duyệt</h3><div className="store-choices">{([ ["ALL", "Tất cả"], ["PENDING", "Chờ duyệt"], ["APPROVED", "Đã duyệt"], ["REJECTED", "Không duyệt"] ] as const).map(([key, label]) => <button key={key} aria-pressed={approval === key} className={approval === key ? "is-selected" : ""} onClick={() => setApproval(key)}>{label}</button>)}</div>
      <h3>Sắp xếp</h3><div className="store-choices">{[["newest", "Mới nhất"], ["oldest", "Cũ nhất"], ["name", "Tên hàng"]].map(([key, label]) => <button key={key} aria-pressed={sort === key} className={sort === key ? "is-selected" : ""} onClick={() => setSort(key!)}>{label}</button>)}</div>
      <p className="store-muted">Bộ lọc áp dụng ngay. Lựa chọn phiếu được đặt lại khi đổi bộ lọc hoặc trang.</p><button className="store-reset-filter" onClick={() => { setFrom(""); setTo(""); setApproval("ALL"); setSort("newest"); }}>Đặt lại bộ lọc</button>
    </StoreSheet>
    <StoreSheet open={exportOpen} onOpenChange={open => { if (!exporting) setExportOpen(open); }} title="Xuất Excel" description="Xác nhận xuất các phiếu đủ điều kiện">
      <Summary rows={[["Cửa hàng", mockProfile.storeName], ["Loại phiếu", labels[kind]], ["Đủ điều kiện", `${eligible.length} phiếu đã duyệt`], ["Không đưa vào file", `${selection.length - eligible.length} phiếu`]]} />
      <p className="store-muted">Chỉ phiếu đã gửi và đã duyệt được đưa vào file. File này dùng dữ liệu mẫu.</p>{error ? <p className="store-error" role="alert">{error}</p> : null}
      <div className="store-sheet-actions"><Button variant="ghost" disabled={exporting} onClick={() => setExportOpen(false)}>Hủy</Button><Button className="store-button" disabled={!eligible.length || exporting} onClick={() => void download()}>{exporting ? "Đang xuất…" : "Tải xuống"}</Button></div>
    </StoreSheet>
    <StoreSheet open={active !== null} onOpenChange={open => { if (!open) setActive(null); }} title="Chi tiết phiếu KPH" description="Nội dung và trạng thái phiếu trong dữ liệu mẫu">
      {active ? <><Summary rows={[["Tên hàng hóa", active.productName], ["Mã SKU / UPC", active.sku || "—"], ["Ngày phát hiện", active.detectedDate], ["Số lượng", active.quantity], ["Nhà cung cấp", active.supplier || "—"], ["Tình trạng", active.condition], ["Biện pháp", active.resolution], ["Người phát hiện", active.detectedBy], ["Trạng thái", approvalLabels[active.approvalStatus]], ["Ghi chú", active.note || "Không có"]]} /><div className="store-review-photos">{active.photos.map(p => <button key={p.id} onClick={() => setImage(p)}><img src={p.src} alt={p.alt} /></button>)}</div>{!active.photos.length ? <p className="store-muted">Phiếu mẫu chưa có ảnh minh chứng.</p> : null}<div className="store-sheet-actions"><Button variant="ghost" onClick={() => review("REJECTED")}>Không duyệt</Button><Button className="store-button" onClick={() => review("APPROVED")}>Duyệt phiếu</Button></div></> : null}
    </StoreSheet>
    <EvidenceImageViewer image={image} open={image !== null} onOpenChange={open => { if (!open) setImage(null); }} />
  </div>;
}
