import { useEffect, useRef, useState, type ComponentProps } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@coopfood-kph/ui";
import { formatDisplayDate, type KphKind, type LocalDate } from "@coopfood-kph/kph-rules";

import { DateWorkspace, type WorkspaceLot } from "./store-date-workspace";
import { StoreBarcodeLookup } from "./store-barcode-lookup";
import { DateEditor } from "./store-date-editor";
import { OnlineApiError } from "./online-kph";
import { formatBusinessDate } from "./business-date";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import type { DateApi, DateFilters, DateLot, DateLotDetail } from "./date-api";
import { StoreSheet } from "./store-sheet";
import { KphCreateButton } from "./store-kph-create-button";
import { KphCreateControl, type KphCreateHandle } from "./store-kph-create-control";
import type { CreatedRecordDraft } from "./create-record-dialog";

type Props = ComponentProps<typeof StoreBarcodeLookup> & { api: DateApi; verifiedAt: number; csrf: string; profile?: import("./store-profile").StoreProfile };
const queryOptions = { retry: false, gcTime: 0, refetchOnWindowFocus: false } as const;

function row(lot: DateLot): WorkspaceLot {
  return { id: lot.id, lotCode: lot.lotCode, sku: lot.skuCode, name: lot.productName, date: lot.expiresOn as LocalDate,
    ...(lot.manufacturedOn && { manufactured: formatDisplayDate(lot.manufacturedOn as LocalDate) }),
    status: lot.processingStatus === "RESOLVED" ? "resolved" : "open" };
}

export function StoreOnlineDate({ suspended = false, verifiedAt, api, storeId, userId, csrf, kphCreate = false, ...lookup }: Props & { kphCreate?: boolean }) {
  const access = useQuery({ ...queryOptions, queryKey: ["date-access", userId, storeId, verifiedAt],
    queryFn: ({ signal }) => api.listStores(signal), enabled: !suspended, placeholderData: keepPreviousData });
  const capabilities = !access.isError && access.data?.find(store => store.id === storeId)?.capabilities;
  const expired = access.error instanceof OnlineApiError && access.error.status === 401;
  const expiredRefresh = useRef(false);
  useEffect(() => {
    if (expired && !expiredRefresh.current) { expiredRefresh.current = true; lookup.onSessionExpired(); }
    else if (!expired) expiredRefresh.current = false;
  }, [expired, lookup.onSessionExpired]);
  if (!capabilities || !capabilities.includes("VIEW")) {
    return <StorePageLayout className="store-date"><StorePageHero /><StorePageSurface className="store-date-workspace">
      <h2>Lô DATE</h2>
      {access.isError ? <div role="alert">Chưa tải được quyền DATE. <Button onClick={() => void access.refetch()}>Thử lại</Button></div>
        : <p role="status">{access.isPending ? "Đang tải quyền DATE…" : "Tài khoản chưa có quyền xem DATE tại cửa hàng này."}</p>}
    </StorePageSurface></StorePageLayout>;
  }
  return <DateRecords key={`${userId}:${storeId}`} {...lookup} api={api} userId={userId} storeId={storeId} csrf={csrf}
    suspended={suspended || access.isPlaceholderData} create={capabilities.includes("CREATE")} update={capabilities.includes("UPDATE")}
    process={capabilities.includes("PROCESS") && kphCreate} {...(lookup.profile ? { profile: lookup.profile } : {})} />;
}

function DateRecords({ api, storeId, userId, csrf, suspended, create, update, process, profile, ...lookup }: Omit<Props, "verifiedAt"> & { create: boolean; update: boolean; process: boolean }) {
  const client = useQueryClient();
  const rootKey = ["date-lots", userId, storeId];
  const [filters, setFilters] = useState<DateFilters>({ q: "", page: 1 });
  const [selectedId, selectLot] = useState("");
  const [editor, setEditor] = useState<"create" | DateLot | null>(null);
  const [notice, setNotice] = useState("");
  const [typeChoice, setTypeChoice] = useState<DateLotDetail | null>(null);
  const [processing, setProcessing] = useState<DateLotDetail | null>(null);
  const createRef = useRef<KphCreateHandle>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const list = useQuery({ ...queryOptions, queryKey: [...rootKey, "list", filters],
    queryFn: ({ signal }) => api.list(storeId, filters, signal), enabled: !suspended });
  const detail = useQuery({ ...queryOptions, queryKey: [...rootKey, "detail", selectedId],
    queryFn: ({ signal }) => api.detail(storeId, selectedId, signal), enabled: !!selectedId && !suspended });
  const denied = [list.error, detail.error].some(error => error instanceof OnlineApiError && (error.status === 401 || error.status === 403));
  const deniedRefresh = useRef(false);
  useEffect(() => {
    if (denied && !deniedRefresh.current) { deniedRefresh.current = true; lookup.onSessionExpired(); }
    else if (!denied) deniedRefresh.current = false;
  }, [denied, lookup.onSessionExpired]);
  useEffect(() => {
    if ((editor === "create" && !create) || (editor && editor !== "create" && !update)) setEditor(null);
  }, [create, update, editor]);
  const page = list.isSuccess ? list.data : undefined;
  const selected = detail.isSuccess ? detail.data : undefined;
  useEffect(() => {
    if (page && page.page > Math.max(1, page.totalPages)) setFilters(current => ({ ...current, page: Math.max(1, page.totalPages) }));
  }, [page]);
  function changeFilters(change: DateFilters) {
    selectLot(""); setNotice("");
    setFilters(current => {
      const next = { ...current, ...change, page: change.page ?? 1 };
      if (Object.hasOwn(change, "phase") && change.phase === undefined) delete next.phase;
      return next;
    });
  }
  async function saved(duplicate: boolean) {
    if (mounted.current) { setEditor(null); setNotice(duplicate ? "Đã lưu lô. Cửa hàng có lô khác trùng thông tin." : "Đã lưu lô DATE."); }
    await client.invalidateQueries({ queryKey: rootKey });
    await client.invalidateQueries({ queryKey: ["date-suggestions", userId, storeId] });
  }
  const mayEdit = update && selected?.processingStatus === "OPEN";
  function openProcessor(lot: DateLotDetail, kind: KphKind) {
    setTypeChoice(null); setProcessing(lot);
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const seed = { barcode: lot.barcode ?? lot.skuCode, skuCode: lot.skuCode, productName: lot.productName,
      supplier: lot.supplierName ?? "", unit: lot.unit, note: "",
      condition: lot.expiresOn < formatBusinessDate(new Date()).iso ? "EXPIRED" as const : "NEAR_EXPIRY" as const,
      quantityText: "" };
    window.requestAnimationFrame(() => createRef.current?.open(kind, seed, returnFocus, true));
  }
  async function processDraft(draft: CreatedRecordDraft) {
    const source = processing;
    if (!source || !process || suspended) throw new Error("Chưa thể xử lý lô DATE trong phiên này.");
    try {
      if (!api.process) throw new Error("Chưa bật xử lý lô DATE trên ứng dụng này.");
      const receipt = await api.process(storeId, source, draft, csrf);
      if (mounted.current) {
        setNotice(`Đã tạo phiếu KPH ${receipt.recordId}. Đang tải lại lượng còn lại…`);
        setProcessing(null);
      }
      try {
        await client.invalidateQueries({ queryKey: [...rootKey, "list"] });
        const refreshed = await detail.refetch();
        if (refreshed.isError) throw refreshed.error;
        if (mounted.current) setNotice("Đã gửi phiếu KPH và tải lại lô DATE.");
      } catch {
        if (mounted.current) setNotice("Đã gửi phiếu KPH, nhưng chưa tải lại được lô DATE. Hãy thử tải lại chi tiết.");
      }
    } catch (error) {
      if (error instanceof OnlineApiError && (error.status === 401 || error.status === 403)) lookup.onSessionExpired();
      throw error;
    }
  }
  return <>
    <DateWorkspace mode="online" suspended={!!suspended} lots={page?.items.map(row) ?? []}
      filters={filters} changeFilters={changeFilters} total={page?.totalItems} attentionCount={page?.attentionCount}
      lookupContent={<StoreBarcodeLookup {...lookup} userId={userId} storeId={storeId} suspended={!!suspended} />}
      onCreate={create ? () => { setNotice(""); setEditor("create"); } : undefined}
      selectLot={selectLot} selectedId={editor ? "" : selectedId} detailLot={selected && row(selected)}
      listState={list.isError ? <div role="alert">Chưa tải được danh sách lô DATE. <Button onClick={() => void list.refetch()}>Thử lại</Button></div>
        : list.isPending ? <p role="status">Đang tải lô DATE…</p> : notice && <p role="status">{notice}</p>}
      detailState={detail.isError ? <div role="alert">Chưa tải được chi tiết lô. <Button onClick={() => void detail.refetch()}>Thử lại</Button></div> : <p role="status">Đang tải chi tiết…</p>}
      detailActions={selected && <><p>Số lượng đang theo dõi: <strong>{selected.trackedQuantity} {selected.unit}</strong></p>
        <p>Đã xử lý: <strong>{selected.processedQuantity} {selected.unit}</strong> · Còn lại: <strong>{selected.remainingQuantity} {selected.unit}</strong></p>
        {selected.processingHistory?.length ? <section aria-label="Lịch sử xử lý"><h3>Lịch sử xử lý KPH</h3><a href="#kph">Mở lịch sử KPH</a><ol>{selected.processingHistory.map((receipt, index) => <li key={`${receipt.recordId}-${index}`}>
          Phiếu {receipt.recordId} · {receipt.quantity} {receipt.unit} · Còn {receipt.remainingAfter} {receipt.unit} · {new Date(receipt.processedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        </li>)}</ol></section> : null}
        {process && selected.processingStatus === "OPEN" && <Button type="button" disabled={!!suspended} onClick={() => selected.kphType ? openProcessor(selected, selected.kphType) : setTypeChoice(selected)}>Xử lý một phần</Button>}
        {mayEdit && <Button type="button" onClick={() => setEditor(selected)}>Sửa lô</Button>}</>}
      footer={page && page.totalPages > 1 && <nav className="store-online-pagination" aria-label="Phân trang lô DATE">
        <Button variant="secondary" disabled={page.page <= 1} onClick={() => changeFilters({ page: page.page - 1 })}>Trang trước</Button>
        <span>Trang {page.page}/{page.totalPages}</span>
        <Button variant="secondary" disabled={page.page >= page.totalPages} onClick={() => changeFilters({ page: page.page + 1 })}>Trang sau</Button>
      </nav>} />
    <StoreSheet open={!!typeChoice && !suspended} onOpenChange={open => { if (!open) setTypeChoice(null); }} title="Chọn loại phiếu KPH" description="Loại phiếu sẽ được lưu cho lô DATE và giữ nguyên ở các lần xử lý tiếp theo.">
      {typeChoice ? <><p>{typeChoice.productName} · SKU {typeChoice.skuCode}</p><div className="store-two-col">{(["TPCN", "TPTS"] as const).map(kind => <KphCreateButton key={kind} kind={kind} onClick={() => openProcessor(typeChoice, kind)} />)}</div></> : null}
    </StoreSheet>
    <KphCreateControl ref={createRef} suspended={!!suspended} {...(profile ? { profile } : {})} onBarcodeLookup={barcode => lookup.lookupBarcode(storeId, barcode)} onSaved={processDraft} />
    {editor && (editor === "create" ? create : update) && <DateEditor api={api} csrf={csrf} storeId={storeId} userId={userId}
      suspended={!!suspended} lookupBarcode={lookup.lookupBarcode} onSessionExpired={lookup.onSessionExpired}
      original={editor === "create" ? null : editor} onSaved={saved} onClose={() => setEditor(null)}
      onReload={async () => { const result = await detail.refetch(); if (result.isSuccess && mounted.current) setEditor(result.data); return result.isSuccess; }}
      key={editor === "create" ? "create" : editor.id} />}
  </>;
}
