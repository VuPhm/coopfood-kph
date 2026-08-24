import type { KphKind } from "@coopfood-kph/kph-rules";
import { Button, cn } from "@coopfood-kph/ui";
import { Check, FileDown, Leaf, PackagePlus, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { CreateRecordDialog } from "./create-record-dialog";
import { DEMO_RECORDS, type DemoRecord } from "./demo-records";
import { ExpiryWorkbench } from "./expiry-dialog";

const kindCopy: Record<KphKind, { action: string; short: string }> = {
  TPCN: { action: "Thực phẩm khô & khác", short: "TP Khô & khác" },
  TPTS: { action: "Thực phẩm tươi sống", short: "TP Tươi sống" },
};

export function App() {
  const [activeKind, setActiveKind] = useState<KphKind>("TPCN");
  const [createKind, setCreateKind] = useState<KphKind | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState("");
  const visibleRecords = useMemo(() => DEMO_RECORDS.filter(({ kind }) => kind === activeKind), [activeKind]);
  const allVisibleSelected = visibleRecords.length > 0 && visibleRecords.every(({ id }) => selected.has(id));

  function openCreate(kind: KphKind) {
    setCreateKind(kind);
    setDialogOpen(true);
  }

  function toggleSelection(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleRecords.map(({ id }) => id)));
  }

  function selectKind(kind: KphKind) {
    setActiveKind(kind);
    setSelected(new Set());
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-30 bg-brand text-white shadow-md safe-top">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-brand" aria-hidden="true"><Leaf size={24} /></span>
            <div><p className="text-lg font-black leading-none">Co.op Food</p><p className="mt-1 text-xs text-white/75">Quản lý hàng không phù hợp</p></div>
          </div>
          <p className="hidden text-sm font-semibold text-white/85 sm:block"><span className="font-normal text-white/65">Hôm nay · </span>Thứ Bảy, 15/08/2026</p>
        </div>
      </header>

      <main className="workspace-layout mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7">
        <div className="kph-workspace-stack">
          <section className="workspace-header" aria-labelledby="workspace-title">
          <div className="workspace-title">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
              <Check size={14} aria-hidden="true" /> Dữ liệu tổng hợp
            </span>
            <h1 id="workspace-title" className="mt-2 text-2xl font-black tracking-tight sm:text-[1.7rem]">Phiếu theo dõi hàng không phù hợp</h1>
          </div>

          <div className="workspace-actions" aria-label="Tạo phiếu theo loại thực phẩm">
            {(Object.keys(kindCopy) as KphKind[]).map((kind) => (
              <button key={kind} type="button" className={cn("workspace-create", kind === "TPCN" ? "workspace-create-tpcn" : "workspace-create-tpts")} onClick={() => openCreate(kind)}>
                <PackagePlus size={19} aria-hidden="true" />
                <span><small>Tạo phiếu</small>{kindCopy[kind].action}</span>
              </button>
            ))}
          </div>

          <div className="store-context" aria-label="Cửa hàng và tài khoản hiện tại">
            <ShieldCheck className="store-context-icon" size={20} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Cửa hàng hiện tại</p>
              <p className="truncate text-sm font-black text-brand">Co.op Food Nguyễn Kiệm · CF-DEMO-001</p>
              <p className="mt-0.5 truncate text-xs text-ink-muted">Nguyễn Văn Demo · Cửa hàng trưởng</p>
            </div>
          </div>
          </section>

          <section className="history-board" aria-labelledby="history-title">
          <header className="history-header">
            <div className="history-heading-group">
              <h2 id="history-title" className="text-lg font-black">Phiếu đã khai báo <span className="text-ink-muted">({visibleRecords.length})</span></h2>
              <div className="history-tabs" role="tablist" aria-label="Loại phiếu">
                {(Object.keys(kindCopy) as KphKind[]).map((kind) => {
                  const count = DEMO_RECORDS.filter((record) => record.kind === kind).length;
                  return (
                    <button key={kind} type="button" role="tab" aria-selected={activeKind === kind} className={cn("history-tab", activeKind === kind && "is-active")} onClick={() => selectKind(kind)}>
                      {kindCopy[kind].short} <span>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="history-actions">
              <label className="select-all-mobile">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                Chọn tất cả
              </label>
              <span className="selection-count" aria-live="polite">Đã chọn <strong>{selected.size}</strong> dòng</span>
              <Button variant="secondary" disabled={selected.size === 0} onClick={() => setNotice("Luồng xuất Excel sẽ được nối backend trong slice riêng.")}><FileDown size={17} aria-hidden="true" />Xuất Excel</Button>
              <Button variant="ghost" className="text-danger" disabled={selected.size === 0} onClick={() => setNotice("Vô hiệu hóa cần lý do và kiểm tra quyền Cửa hàng trưởng ở backend.")}><Trash2 size={17} aria-hidden="true" />Vô hiệu hóa</Button>
            </div>
          </header>

          <div className="overflow-x-auto desktop-history">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="w-12 p-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Chọn tất cả phiếu trong loại hiện tại" /></th>
                  <th className="p-3">Phát hiện</th><th className="p-3">SKU/UPC · Tên hàng hóa</th><th className="p-3">NCC</th><th className="p-3">SL · ĐVT</th><th className="p-3">Tình trạng KPH</th><th className="p-3">Biện pháp xử lý</th><th className="p-3">Ảnh</th>
                </tr>
              </thead>
              <tbody>{visibleRecords.map((record) => <RecordRow key={record.id} record={record} selected={selected.has(record.id)} onToggle={toggleSelection} />)}</tbody>
            </table>
          </div>

          <div className="grid gap-3 mobile-history">
            {visibleRecords.map((record) => <RecordCard key={record.id} record={record} selected={selected.has(record.id)} onToggle={toggleSelection} />)}
          </div>
          </section>
        </div>

        <ExpiryWorkbench />
      </main>

      <CreateRecordDialog kind={createKind} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={(kind) => { setNotice(`Đã kiểm tra luồng lưu ${kind} ở chế độ demo.`); setActiveKind(kind); setSelected(new Set()); }} />
      {notice ? <button type="button" className="fixed bottom-20 left-1/2 z-40 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl" onClick={() => setNotice("")}>{notice}</button> : null}
    </div>
  );
}

type RecordProps = { record: DemoRecord; selected: boolean; onToggle: (id: string) => void };

function RecordRow({ onToggle, record, selected }: RecordProps) {
  return <tr className={cn("record-row", selected && "is-selected")}>
    <td className="p-3"><input type="checkbox" checked={selected} onChange={() => onToggle(record.id)} aria-label={`Chọn phiếu ${record.id}`} /></td>
    <td className="p-3"><strong>{record.detectedDate}</strong><br /><span className="text-ink-muted">{record.detectedBy}</span></td>
    <td className="p-3"><span className="font-mono text-xs font-bold text-brand">{record.sku}</span><br /><strong>{record.productName}</strong></td>
    <td className="max-w-56 p-3 text-ink-muted">{record.supplier}</td>
    <td className="p-3 font-bold">{record.quantity}</td>
    <td className="p-3"><span className="status-badge">{record.condition}</span></td>
    <td className="p-3 text-xs font-black text-brand">{record.resolution}</td>
    <td className="p-3"><span className="photo-count">{record.photos}</span></td>
  </tr>;
}

function RecordCard({ onToggle, record, selected }: RecordProps) {
  return <article className={cn("record-card", selected && "is-selected")}>
    <header className="flex min-h-11 items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold text-brand">{record.sku}</p><h3 className="mt-1 font-black">{record.productName}</h3></div><input type="checkbox" checked={selected} onChange={() => onToggle(record.id)} aria-label={`Chọn phiếu ${record.id}`} /></header>
    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-ink-muted">Phát hiện</dt><dd className="font-bold">{record.detectedDate}<br />{record.detectedBy}</dd></div><div><dt className="text-xs text-ink-muted">Số lượng · NCC</dt><dd className="font-bold">{record.quantity}<br /><span className="font-normal text-ink-muted">{record.supplier}</span></dd></div></dl>
    <footer className="record-card-footer"><span className="status-badge">{record.condition}</span><span className="text-xs font-black text-brand">{record.resolution} · {record.photos} ảnh</span></footer>
  </article>;
}
