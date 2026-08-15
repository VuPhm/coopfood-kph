import type { KphKind } from "@coopfood-kph/kph-rules";
import { Button, cn } from "@coopfood-kph/ui";
import { Check, FileDown, Leaf, PackagePlus, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { CreateRecordDialog } from "./create-record-dialog";
import { DEMO_RECORDS, type DemoRecord } from "./demo-records";
import { ExpiryDialog } from "./expiry-dialog";

const kindCopy: Record<KphKind, { action: string; short: string; description: string }> = {
  TPCN: { action: "Thực phẩm khô & khác", short: "TPCN", description: "Cận date, hết HSD hoặc tình trạng khác" },
  TPTS: { action: "Thực phẩm tươi sống", short: "TPTS", description: "Hư hỏng, cận date, hết HSD hoặc khác" },
};

export function App() {
  const [activeKind, setActiveKind] = useState<KphKind>("TPCN");
  const [createKind, setCreateKind] = useState<KphKind | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState("");
  const visibleRecords = useMemo(() => DEMO_RECORDS.filter(({ kind }) => kind === activeKind), [activeKind]);

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

  function selectKind(kind: KphKind) {
    setActiveKind(kind);
    setSelected(new Set());
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-30 bg-brand text-white shadow-md safe-top">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-brand" aria-hidden="true"><Leaf size={24} /></span>
            <div><p className="text-lg font-black leading-none">Co.op Food</p><p className="mt-1 text-xs text-white/75">Quản lý hàng không phù hợp</p></div>
          </div>
          <p className="hidden text-sm font-semibold text-white/85 sm:block">Thứ Bảy, 15/08/2026</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1200px] gap-5 px-3 py-5 sm:px-6 sm:py-7">
        <section className="overflow-hidden rounded-[20px] bg-white shadow-panel">
          <div className="grid gap-5 border-b border-line p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                <Check size={14} aria-hidden="true" /> Dữ liệu phát triển tổng hợp
              </span>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">Phiếu theo dõi hàng không phù hợp</h1>
              <div className="mt-3 flex items-start gap-2 text-sm text-ink-muted">
                <UserRound className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
                <p><strong className="text-ink">CF KPH Nguyễn Kiệm · KPH-042</strong><br />Nguyễn Minh An · Nhân viên cửa hàng</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[31rem]">
              {(Object.keys(kindCopy) as KphKind[]).map((kind) => (
                <button key={kind} type="button" className={cn("create-action group rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-lime-300", kind === "TPCN" ? "border-orange/25 bg-warning-soft hover:border-orange" : "border-brand/20 bg-brand-soft hover:border-brand")} onClick={() => openCreate(kind)}>
                  <span className={cn("mb-3 grid size-10 place-items-center rounded-xl text-white", kind === "TPCN" ? "bg-orange" : "bg-brand")}><PackagePlus size={21} aria-hidden="true" /></span>
                  <strong className="block text-base font-black">Tạo phiếu {kindCopy[kind].action}</strong>
                  <span className="mt-1 block text-xs leading-5 text-ink-muted">{kindCopy[kind].description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black">Lịch sử phiếu</h2>
                <p className="text-sm text-ink-muted">Dữ liệu server sẽ được nối qua OpenAPI; hiện chỉ là preview giao diện.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={selected.size === 0}><FileDown size={17} aria-hidden="true" />Xuất Excel</Button>
                <Button variant="ghost" className="text-danger" disabled={selected.size === 0}><Trash2 size={17} aria-hidden="true" />Vô hiệu hóa</Button>
              </div>
            </div>

            <div className="mt-4 flex gap-2" role="tablist" aria-label="Loại phiếu">
              {(Object.keys(kindCopy) as KphKind[]).map((kind) => {
                const count = DEMO_RECORDS.filter((record) => record.kind === kind).length;
                return (
                  <button key={kind} type="button" role="tab" aria-selected={activeKind === kind} className={cn("min-h-11 flex-1 rounded-xl px-4 text-sm font-black transition sm:flex-none", activeKind === kind ? "bg-brand text-white" : "bg-canvas text-ink-muted hover:text-brand")} onClick={() => selectKind(kind)}>
                    {kindCopy[kind].short} <span className={cn("ml-1 rounded-full px-2 py-0.5 text-xs", activeKind === kind ? "bg-white/20" : "bg-black/5")}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-line desktop-history">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-muted">
                  <tr><th className="w-12 p-3"><span className="sr-only">Chọn</span></th><th className="p-3">Ngày · người phát hiện</th><th className="p-3">Hàng hóa</th><th className="p-3">Nhà cung cấp</th><th className="p-3">SL</th><th className="p-3">Tình trạng · xử lý</th><th className="p-3">Ảnh</th></tr>
                </thead>
                <tbody>{visibleRecords.map((record) => <RecordRow key={record.id} record={record} selected={selected.has(record.id)} onToggle={toggleSelection} />)}</tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 mobile-history">
              {visibleRecords.map((record) => <RecordCard key={record.id} record={record} selected={selected.has(record.id)} onToggle={toggleSelection} />)}
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-20"><ExpiryDialog /></div>
      <CreateRecordDialog kind={createKind} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={(kind) => { setNotice(`Đã kiểm tra luồng lưu ${kind} ở chế độ demo.`); setActiveKind(kind); }} />
      {notice ? <button type="button" className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl" onClick={() => setNotice("")}>{notice}</button> : null}
    </div>
  );
}

type RecordProps = { record: DemoRecord; selected: boolean; onToggle: (id: string) => void };

function RecordRow({ onToggle, record, selected }: RecordProps) {
  return <tr className={cn("border-t border-line", selected && "bg-brand-soft")}>
    <td className="p-3"><input type="checkbox" checked={selected} onChange={() => onToggle(record.id)} aria-label={`Chọn phiếu ${record.id}`} /></td>
    <td className="p-3"><strong>{record.detectedDate}</strong><br /><span className="text-ink-muted">{record.detectedBy}</span></td>
    <td className="p-3"><strong>{record.productName}</strong><br /><span className="font-mono text-xs text-ink-muted">{record.sku}</span></td>
    <td className="max-w-56 p-3 text-ink-muted">{record.supplier}</td><td className="p-3 font-bold">{record.quantity}</td>
    <td className="p-3"><span className="status-badge">{record.condition}</span><br /><span className="mt-1 inline-block text-xs font-black text-brand">{record.resolution}</span></td>
    <td className="p-3"><span className="photo-count">{record.photos}</span></td>
  </tr>;
}

function RecordCard({ onToggle, record, selected }: RecordProps) {
  return <article className={cn("rounded-2xl border border-line bg-white p-4", selected && "border-brand bg-brand-soft")}>
    <header className="flex items-start justify-between gap-3"><div><p className="text-xs font-mono text-ink-muted">{record.id}</p><h3 className="mt-1 font-black">{record.productName}</h3></div><input type="checkbox" checked={selected} onChange={() => onToggle(record.id)} aria-label={`Chọn phiếu ${record.id}`} /></header>
    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-ink-muted">Ngày · người phát hiện</dt><dd className="font-bold">{record.detectedDate}<br />{record.detectedBy}</dd></div><div><dt className="text-xs text-ink-muted">SKU · số lượng</dt><dd className="font-bold">{record.sku}<br />{record.quantity}</dd></div></dl>
    <footer className="mt-3 flex items-center justify-between border-t border-line pt-3"><span className="status-badge">{record.condition}</span><span className="text-xs font-black text-brand">{record.resolution} · {record.photos} ảnh</span></footer>
  </article>;
}
