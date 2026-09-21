import { Button, Field, Tag } from "@coopfood-kph/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileSearch, Leaf, ListChecks, LogOut, RefreshCw, Upload } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

import type { AdminSession, CatalogImportBatch, LifecycleAdminGateway } from "./lifecycle-admin";

const catalogKeys = {
  imports: ["catalog-imports"] as const,
  detail: ["catalog-import"] as const,
};

export function CatalogWorkspace({ gateway, session, onLogout, logoutBusy, onError, onOpenLifecycle, onOpenIdentity }: {
  gateway: LifecycleAdminGateway;
  session: AdminSession;
  onLogout(): void;
  logoutBusy: boolean;
  onError(error: unknown): void;
  onOpenLifecycle?: () => void;
  onOpenIdentity?: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const imports = useQuery({
    queryKey: [...catalogKeys.imports, session.user.id],
    queryFn: ({ signal }) => gateway.listCatalogImports(signal),
    retry: false,
  });
  const selected = selectedId ?? imports.data?.[0]?.id ?? null;
  const detail = useQuery({
    queryKey: [...catalogKeys.detail, session.user.id, selected, offset],
    queryFn: ({ signal }) => gateway.getCatalogImport(selected!, offset, signal),
    enabled: Boolean(selected),
    retry: false,
  });
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Hãy chọn file CSV cần kiểm tra.");
      if (file.size > 5 * 1024 * 1024) throw new Error("File catalog không được vượt quá 5 MiB.");
      return gateway.uploadCatalogImport(file);
    },
    onError,
    async onSuccess(result) {
      setNotice(result.replayed
        ? `File này đã được kiểm tra trước đó; đang mở batch ${shortId(result.batch.id)}.`
        : result.batch.status === "VALIDATED"
          ? `Đã kiểm tra ${result.batch.rowCount} dòng, không có lỗi.`
          : `Đã kiểm tra ${result.batch.rowCount} dòng, có ${result.batch.errorRowCount} dòng lỗi.`);
      setSelectedId(result.batch.id);
      setOffset(0);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      await queryClient.invalidateQueries({ queryKey: catalogKeys.imports });
      await queryClient.invalidateQueries({ queryKey: catalogKeys.detail });
    },
  });

  useEffect(() => {
    if (imports.error) onError(imports.error);
    if (detail.error) onError(detail.error);
  }, [detail.error, imports.error, onError]);
  useEffect(() => {
    if (upload.error) errorSummary.current?.focus();
  }, [upload.error]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    upload.mutate();
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setNotice(null);
    upload.reset();
  }

  const loadError = imports.error instanceof Error ? imports.error.message : detail.error instanceof Error ? detail.error.message : null;
  return <div className="min-h-dvh bg-canvas text-ink">
    <a href="#admin-main" className="sr-only fixed left-4 top-4 z-50 rounded-xl bg-white px-4 py-3 font-bold text-brand shadow-panel focus:not-sr-only">Bỏ qua đến nội dung chính</a>
    <header className="sticky top-0 z-20 bg-brand text-white shadow-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-brand"><Leaf aria-hidden="true" /></span><div className="min-w-0"><strong className="block truncate text-base font-black sm:text-lg">Co.op Food KPH</strong><span className="block truncate text-xs text-white/80">Catalog staging & validation</span></div></div>
        <div className="flex flex-wrap items-center justify-end gap-2">{onOpenIdentity ? <Button className="border-white/25 bg-white/10 text-white hover:bg-white/20" onClick={onOpenIdentity} variant="secondary">Tài khoản</Button> : null}{onOpenLifecycle ? <Button className="border-white/25 bg-white/10 text-white hover:bg-white/20" onClick={onOpenLifecycle} variant="secondary">Lifecycle</Button> : null}<span className="hidden text-right text-xs leading-5 text-white/80 sm:block"><strong className="block text-sm text-white">{session.user.displayName}</strong>{session.user.username}</span><Button aria-label="Đăng xuất" className="border-white/25 bg-white/10 text-white hover:bg-white/20" disabled={logoutBusy} onClick={onLogout} size="icon" variant="secondary"><LogOut aria-hidden="true" size={18} /></Button></div>
      </div>
    </header>

    <main id="admin-main" className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:py-8">
      <section className="self-start rounded-3xl border border-surface-strong bg-white p-5 shadow-panel sm:p-6" aria-labelledby="upload-heading">
        <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><Upload aria-hidden="true" /></span><div><p className="text-xs font-black uppercase tracking-[.14em] text-brand">C01 · Chỉ staging</p><h1 id="upload-heading" className="mt-1 text-2xl font-black tracking-tight">Kiểm tra catalog CSV</h1></div></div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">File hợp lệ vẫn chưa được publish và không xuất hiện trong lookup cửa hàng.</p>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <Field htmlFor="catalog-file" label="File UTF-8 CSV" hint="Tối đa 5 MiB / 50.000 dòng. Header: NCC, Tên NCC, UPC, SKU, Tên sản phẩm." required>
            <input ref={fileInput} id="catalog-file" type="file" accept=".csv,text/csv" onChange={chooseFile} disabled={upload.isPending} className="min-h-11 w-full rounded-xl border-2 border-surface-strong bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-bold file:text-brand" />
          </Field>
          {file ? <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm"><strong className="block break-all">{file.name}</strong><span className="text-ink-muted">{formatBytes(file.size)}</span></p> : null}
          {upload.error instanceof Error ? <div ref={errorSummary} tabIndex={-1} className="rounded-xl bg-danger-soft px-3 py-3 text-sm font-semibold text-danger" role="alert"><p>Chưa thể kiểm tra file.</p><p className="mt-1 font-medium">{upload.error.message}</p></div> : null}
          <Button disabled={upload.isPending || !file} type="submit"><FileSearch aria-hidden="true" size={18} />{upload.isPending ? "Đang kiểm tra…" : "Tải lên và kiểm tra"}</Button>
        </form>
        <div className="mt-6 rounded-2xl border border-surface-strong bg-surface-muted p-4 text-sm leading-6 text-ink-muted"><strong className="text-ink">Upload lại rõ ràng</strong><p>Cùng bytes trả lại batch cũ; file khác tạo batch mới. Không batch nào ghi đè batch trước.</p></div>
      </section>

      <section className="min-w-0 rounded-3xl border border-surface-strong bg-white p-5 shadow-panel sm:p-6" aria-labelledby="imports-heading">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-brand">50 batch gần nhất</p><h2 id="imports-heading" className="mt-1 text-2xl font-black tracking-tight">Kết quả kiểm tra</h2></div><Button aria-label="Tải lại lịch sử catalog" onClick={() => void imports.refetch()} size="icon" variant="secondary"><RefreshCw aria-hidden="true" size={18} /></Button></div>
        {notice ? <p className="mt-4 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-soft px-3 py-3 text-sm font-semibold text-brand" role="status"><CheckCircle2 className="mt-0.5 shrink-0" aria-hidden="true" size={17} />{notice}</p> : null}
        {loadError ? <p className="mt-4 rounded-xl bg-danger-soft px-3 py-3 text-sm font-semibold text-danger" role="alert">{loadError}</p> : null}
        {imports.isPending ? <p className="mt-6 text-sm text-ink-muted" role="status">Đang tải lịch sử…</p> : null}
        {!imports.isPending && imports.data?.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center"><ListChecks className="mx-auto text-brand" aria-hidden="true" /><p className="mt-3 font-black">Chưa có batch catalog</p><p className="mt-1 text-sm text-ink-muted">Chọn file CSV để tạo kết quả kiểm tra đầu tiên.</p></div> : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">{imports.data?.map((batch) => <BatchButton key={batch.id} batch={batch} selected={batch.id === selected} onClick={() => { setSelectedId(batch.id); setOffset(0); }} />)}</div>

        {detail.data ? <div className="mt-8 border-t border-line pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-brand">Batch {shortId(detail.data.batch.id)}</p><h3 className="mt-1 break-all text-xl font-black">{detail.data.batch.originalFilename}</h3><p className="mt-2 text-sm text-ink-muted">{detail.data.batch.validRowCount} hợp lệ · {detail.data.batch.errorRowCount} lỗi · {formatDateTime(detail.data.batch.createdAt)}</p></div><StatusTag status={detail.data.batch.status} /></div>
          <RowsTable rows={detail.data.rows} />
          {detail.data.rowTotal > detail.data.rowLimit ? <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Phân trang dòng catalog"><Button variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - detail.data!.rowLimit))}>Trang trước</Button><span className="text-sm font-semibold text-ink-muted">{offset + 1}–{Math.min(offset + detail.data.rowLimit, detail.data.rowTotal)} / {detail.data.rowTotal}</span><Button variant="secondary" disabled={offset + detail.data.rowLimit >= detail.data.rowTotal} onClick={() => setOffset(offset + detail.data!.rowLimit)}>Trang sau</Button></nav> : null}
        </div> : selected && detail.isPending ? <p className="mt-8 text-sm text-ink-muted" role="status">Đang tải chi tiết batch…</p> : null}
      </section>
    </main>
  </div>;
}

function BatchButton({ batch, selected, onClick }: { batch: CatalogImportBatch; selected: boolean; onClick(): void }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`min-h-24 rounded-2xl border-2 p-4 text-left transition-colors ${selected ? "border-brand bg-brand-soft" : "border-surface-strong bg-surface-muted hover:border-brand/40"}`}><span className="flex items-start justify-between gap-3"><strong className="min-w-0 break-all text-sm">{batch.originalFilename}</strong><StatusTag status={batch.status} /></span><span className="mt-3 block text-xs text-ink-muted">{batch.rowCount} dòng · {batch.errorRowCount} lỗi · {formatDateTime(batch.createdAt)}</span></button>;
}

function RowsTable({ rows }: { rows: Awaited<ReturnType<LifecycleAdminGateway["getCatalogImport"]>>["rows"] }) {
  if (rows.length === 0) return <p className="mt-6 rounded-2xl bg-brand-soft p-5 text-sm font-semibold text-brand">Batch không có dòng dữ liệu.</p>;
  return <>
    <div className="mt-6 hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm"><thead><tr className="text-xs uppercase tracking-wide text-ink-muted"><th className="px-3 py-2">Dòng</th><th className="px-3 py-2">UPC / SKU</th><th className="px-3 py-2">Sản phẩm / NCC</th><th className="px-3 py-2">Kết quả</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowNumber} className="bg-surface-muted align-top"><td className="rounded-l-xl px-3 py-3 font-black">{row.rowNumber}</td><td className="px-3 py-3"><code className="block">{row.normalized.barcode || "—"}</code><code className="mt-1 block text-ink-muted">{row.normalized.skuCode || "—"}</code></td><td className="px-3 py-3"><strong>{row.normalized.productName || "—"}</strong><span className="mt-1 block text-ink-muted">{row.normalized.supplierCode || "—"} · {row.normalized.supplierName || "—"}</span></td><td className="rounded-r-xl px-3 py-3"><RowResult row={row} /></td></tr>)}</tbody></table></div>
    <div className="mt-6 grid gap-3 md:hidden">{rows.map((row) => <article key={row.rowNumber} className="rounded-2xl border border-surface-strong bg-surface-muted p-4"><div className="flex items-start justify-between gap-3"><strong>Dòng {row.rowNumber}</strong><Tag tone={row.status === "ERROR" ? "red" : "green"}>{row.status === "ERROR" ? "Có lỗi" : "Hợp lệ"}</Tag></div><p className="mt-3 break-words text-sm font-bold">{row.normalized.productName || "Chưa có tên sản phẩm"}</p><p className="mt-1 break-all text-xs text-ink-muted">UPC {row.normalized.barcode || "—"} · SKU {row.normalized.skuCode || "—"}</p><div className="mt-3"><RowResult row={row} /></div></article>)}</div>
  </>;
}

function RowResult({ row }: { row: Awaited<ReturnType<LifecycleAdminGateway["getCatalogImport"]>>["rows"][number] }) {
  if (row.validationMessages.length === 0) return <span className="inline-flex items-center gap-2 font-semibold text-brand"><CheckCircle2 aria-hidden="true" size={17} />Hợp lệ</span>;
  return <ul className="grid gap-2 text-danger">{row.validationMessages.map((message, index) => <li key={`${message.code}-${index}`} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" size={16} /><span><strong className="block">{message.field}</strong>{message.message}</span></li>)}</ul>;
}

function StatusTag({ status }: { status: CatalogImportBatch["status"] }) {
  if (status === "VALIDATED") return <Tag tone="green">Hợp lệ</Tag>;
  if (status === "REJECTED") return <Tag tone="red">Có lỗi</Tag>;
  if (status === "PUBLISHED") return <Tag tone="blue">Đã publish</Tag>;
  return <Tag tone="orange">Đang xử lý</Tag>;
}

function shortId(id: string) { return id.slice(0, 8); }
function formatBytes(bytes: number) { return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KiB`; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)); }
