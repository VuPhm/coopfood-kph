import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ListChecks, SlidersHorizontal } from "lucide-react";
import { StorePageLayout, StorePageHero, StorePageSurface } from "./store-page-hero";
import { revealBelowStickyTabs } from "./store-sticky-tabs";
import { KPH_DATE_SHORTCUTS, kphDateRange } from "./store-kph-history";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@coopfood-kph/ui";
import { parseDisplayDate, type KphKind } from "@coopfood-kph/kph-rules";
import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { StoreFoodKindTabs } from "./store-food-kind-tabs";
import type { RecordView } from "./record-view";
import { StoreKphList, StoreKphMore } from "./store-kph-list";
import { useStoreDesktopLayout } from "./use-store-desktop-layout";
import { StoreSheet, Summary } from "./store-sheet";
import { EvidenceImageViewer } from "./image-viewer";
import { approvalLabels, type ApprovalStatus, type EvidencePhotoView } from "./record-view";
import { ONLINE_EXPORT_MAX_RECORDS, onlineExportSelectionError, OnlineApiError, type OnlineHistoryFilter, type OnlineHistoryPage } from "./online-kph";
import type { StoreSessionGateway } from "./store-session-api";
import { KphCreateButton } from "./store-kph-create-button";
import { KphCreateControl, preloadKphCreateForm, type KphCreateHandle } from "./store-kph-create-control";
import type { CreatedRecordDraft } from "./create-record-dialog";
import type { StoreProfile } from "./store-profile";
import "./store-online-kph.css";

type Filters = { kind: KphKind; approval: "ALL" | ApprovalStatus; from: string; to: string; sort: "newest" | NonNullable<OnlineHistoryFilter["sort"]>; direction: NonNullable<OnlineHistoryFilter["direction"]> };
const defaults: Filters = { kind: "TPTS", approval: "ALL", from: "", to: "", sort: "newest", direction: "descending" };
function iso(value: string) { try { return value ? parseDisplayDate(value) : undefined; } catch { return null; } }

export function StoreOnlineKph({ suspended = false, userId, storeId, loadHistory, createRecord, lookupBarcode, profile, canCreate = false, reviewRecord, prepareExport, canReview = false, canExport = false, onSessionExpired }: {
  suspended?: boolean; userId: string; storeId: string; loadHistory: StoreSessionGateway["loadHistory"]; onSessionExpired: () => void;
  createRecord?: StoreSessionGateway["createRecord"]; lookupBarcode?: StoreSessionGateway["lookupBarcode"];
  profile?: StoreProfile; canCreate?: boolean;
  reviewRecord?: StoreSessionGateway["reviewRecord"]; prepareExport?: StoreSessionGateway["prepareExport"];
  canReview?: boolean; canExport?: boolean;
}) {
  const id = useId();
  const client = useQueryClient();
  const create = useRef<KphCreateHandle>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState<"review" | "export" | null>(null);
  const actionLock = useRef(false);
  const authority = useRef({ userId, storeId, suspended, canReview, canExport, generation: 0 });
  const previous = authority.current;
  authority.current = { userId, storeId, suspended, canReview, canExport, generation: previous.generation + Number(previous.userId !== userId || previous.storeId !== storeId || previous.suspended !== suspended || previous.canReview !== canReview || previous.canExport !== canExport) };
  const [selectionMode, setSelectionMode] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [completeDays, setCompleteDays] = useState<Record<string, RecordView[]>>({});
  const [dayLoading, setDayLoading] = useState(false);
  const dayRequest = useRef<AbortController | null>(null);
  const cancelDay = useCallback(() => { dayRequest.current?.abort(); dayRequest.current = null; setDayLoading(false); }, []);
  useEffect(() => { cancelDay(); setCompleteDays({}); setSelection([]); setExportOpen(false); }, [userId, storeId, cancelDay]);
  useEffect(() => {
    if (suspended || !canExport) cancelDay();
    if (!canExport) setCompleteDays({});
    return () => { dayRequest.current?.abort(); };
  }, [suspended, canExport, userId, storeId, cancelDay]);
  useEffect(() => {
    if (!canExport) { setSelection([]); setSelectionMode(false); setExportOpen(false); }
    if (suspended) { setActionError(""); setNotice(""); }
  }, [canExport, suspended]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const lookup = useCallback(async (barcode: string) => {
    if (!lookupBarcode) throw new Error("Không thể tra cứu barcode.");
    try { return await lookupBarcode(storeId, barcode); }
    catch (error) { if (error instanceof OnlineApiError && (error.status === 401 || error.status === 403)) onSessionExpired(); throw error; }
  }, [lookupBarcode, storeId, onSessionExpired]);
  const desktop = useStoreDesktopLayout();
  const [filters, setFilters] = useState(defaults);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [image, setImage] = useState<EvidencePhotoView | null>(null);
  const from = iso(filters.from), to = iso(filters.to);
  const dateError = from === null || to === null ? "Nhập ngày dd/mm/yyyy" : from && to && from > to ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" : "";
  const query = useInfiniteQuery({
    queryKey: ["store-kph", userId, storeId, filters],
    initialPageParam: 1,
    getNextPageParam: (last: OnlineHistoryPage) => last.page < last.totalPages ? last.page + 1 : undefined,
    queryFn: ({ signal, pageParam }) => loadHistory(storeId, {
      type: filters.kind, page: pageParam, pageSize: 25,
      ...(filters.approval !== "ALL" ? { approvalStatus: filters.approval } : {}),
      ...(from ? { detectedFrom: from } : {}), ...(to ? { detectedTo: to } : {}),
      ...(filters.sort !== "newest" ? { sort: filters.sort, direction: filters.direction } : {}),
    }, signal),
    enabled: !dateError,
    placeholderData: previous => previous,
    retry: false, networkMode: "always", gcTime: 0,
    refetchOnWindowFocus: false, refetchOnReconnect: true,
  });
  const expired = query.error instanceof OnlineApiError && (query.error.status === 401 || query.error.status === 403);
  useEffect(() => { if (expired) onSessionExpired(); }, [expired, onSessionExpired]);
  // Filters reset the loaded window; appending keeps its records and selection.
  function change(patch: Partial<Filters>) {
    if (actionLock.current) return;
    setActionError(""); setNotice("");
    setActiveId(null); setImage(null); setCollapsed([]); setSelection([]); setExportOpen(false);
    cancelDay(); setCompleteDays({});
    setFilters(current => ({ ...current, ...patch }));
  }
  async function save(draft: CreatedRecordDraft) {
    if (suspended || !canCreate || !createRecord) throw new Error("Chưa thể gửi phiếu trong phiên này.");
    try {
      await createRecord(storeId, draft);
      if (!mounted.current) return;
      change({ ...defaults, kind: draft.kind });
      setNotice("Đã gửi phiếu");
      await client.invalidateQueries({ queryKey: ["store-kph", userId, storeId] });
    } catch (error) {
      if (error instanceof OnlineApiError && (error.status === 401 || error.status === 403)) onSessionExpired();
      throw error;
    }
  }
  const blockedHistory = query.isError && (!query.isFetchNextPageError || expired);
  const records = !dateError && !blockedHistory ? [...new Map((query.data?.pages.flatMap(page => page.records) ?? []).map(record => [record.id, record])).values()] : [];
  const active = records.find(record => record.id === activeId) ?? null;
  useEffect(() => { if (blockedHistory || dateError) { setActiveId(null); setImage(null); setSelection([]); setExportOpen(false); } }, [blockedHistory, dateError]);
  const pending = (query.isFetching && !query.isFetchingNextPage) || dayLoading || !!dateError || !!actionBusy || suspended;
  const allRecords = blockedHistory || dateError ? [] : [...new Map([...Object.values(completeDays).flat(), ...records].map(record => [record.id, record])).values()];
  const selected = allRecords.filter(record => selection.includes(record.id));
  const selectedDates = new Set(Object.entries(completeDays).filter(([, rows]) => rows.length > 0 && rows.every(record => selection.includes(record.id))).map(([date]) => date));
  const unseenSelected = selected.filter(record => !records.some(visible => visible.id === record.id)).length;
  async function selectDay(date: string, checked: boolean) {
    if (pending || !canExport) return;
    if (!checked) { const ids = new Set(allRecords.filter(record => record.detectedDate === date).map(record => record.id)); setSelection(current => current.filter(id => !ids.has(id))); return; }
    cancelDay();
    const request = new AbortController(); dayRequest.current = request;
    const generation = authority.current.generation;
    const current = () => mounted.current && !request.signal.aborted && dayRequest.current === request && authority.current.generation === generation;
    setDayLoading(true); setActionError("");
    try {
      const rows = new Map<string, RecordView>();
      let page = 1, totalPages = 1, expectedTotal: number | undefined;
      do {
        const response = await loadHistory(storeId, { type: filters.kind, page, pageSize: 100,
          detectedFrom: parseDisplayDate(date), detectedTo: parseDisplayDate(date),
          ...(filters.approval !== "ALL" ? { approvalStatus: filters.approval } : {}),
          ...(filters.sort !== "newest" ? { sort: filters.sort, direction: filters.direction } : {}),
        }, request.signal);
        if (!current()) return;
        if (response.totalItems > ONLINE_EXPORT_MAX_RECORDS) throw new Error(`Ngày này có hơn ${ONLINE_EXPORT_MAX_RECORDS} phiếu. Hãy lọc trạng thái hoặc chọn từng phiếu để xuất tối đa ${ONLINE_EXPORT_MAX_RECORDS} phiếu mỗi lần.`);
        if (expectedTotal !== undefined && expectedTotal !== response.totalItems) throw new Error("Danh sách vừa thay đổi. Hãy chọn lại ngày để tải đủ phiếu.");
        expectedTotal = response.totalItems;
        if (response.totalPages > Math.ceil(response.totalItems / 100)) throw new Error("Phân trang ngày không hợp lệ. Hãy tải lại phiếu.");
        for (const row of response.records) {
          if (row.kind !== filters.kind || row.detectedDate !== date) throw new Error("Danh sách ngày không khớp. Hãy tải lại phiếu.");
          rows.set(row.id, row);
        }
        totalPages = response.totalPages; page += 1;
      } while (page <= totalPages);
      if (!current()) return;
      if (rows.size !== expectedTotal) throw new Error("Danh sách vừa thay đổi. Hãy chọn lại ngày để tải đủ phiếu.");
      if (new Set([...selection, ...rows.keys()]).size > ONLINE_EXPORT_MAX_RECORDS) throw new Error(`Chỉ chọn tối đa ${ONLINE_EXPORT_MAX_RECORDS} phiếu để xuất mỗi lần. Hãy bỏ bớt lựa chọn rồi thử lại.`);
      setCompleteDays(previous => ({ ...previous, [date]: [...rows.values()] }));
      setSelection(previous => [...new Set([...previous, ...rows.keys()])]);
    } catch (error) {
      if (!current()) return;
      if (error instanceof OnlineApiError && (error.status === 401 || error.status === 403)) { setSelection([]); setCompleteDays({}); onSessionExpired(); }
      else setActionError(error instanceof Error ? error.message : "Chưa chọn được cả ngày. Hãy thử lại.");
    } finally { if (dayRequest.current === request) { dayRequest.current = null; setDayLoading(false); } }
  }
  const eligible = selected.filter(record => record.approvalStatus === "APPROVED");
  const exportLimitError = onlineExportSelectionError(eligible.length);
  async function actOnRecord(action: "review" | "export", status?: "APPROVED" | "REJECTED") {
    if (actionLock.current || pending || expired || (action === "review" ? !canReview || !reviewRecord || !active : !canExport || !prepareExport || !eligible.length || !!exportLimitError)) return;
    const generation = authority.current.generation;
    const current = () => mounted.current && !authority.current.suspended && authority.current.generation === generation;
    actionLock.current = true; setActionBusy(action); setActionError(""); setNotice("");
    try {
      if (action === "review" && active && reviewRecord && status) {
        await reviewRecord(storeId, active.id, status);
        if (current()) {
          setActiveId(null); setImage(null); setSelection([]); setCompleteDays({});
          setNotice(status === "APPROVED" ? "Đã duyệt phiếu" : "Đã ghi nhận không duyệt");
        }
        // A benign context recheck may hide the response, but the committed
        // mutation must still refresh the captured actor/store history.
        await client.invalidateQueries({ queryKey: ["store-kph", userId, storeId] });
      } else if (action === "export" && prepareExport) {
        const bundle = await prepareExport(storeId, filters.kind, eligible.map(record => record.id));
        if (!current()) return;
        if (bundle.store.id !== storeId || bundle.records.length !== eligible.length || new Set(bundle.records.map(record => record.id)).size !== eligible.length || bundle.records.some(record => !eligible.some(item => item.id === record.id))) throw new Error("Dữ liệu xuất không khớp các phiếu đã chọn. Hãy tải lại danh sách.");
        const { downloadOnlineKphExport } = await import("./store-online-export");
        if (!current()) return;
        if (await downloadOnlineKphExport(bundle, filters.kind, current) && current()) {
          setNotice("Đã tạo file Excel"); setExportOpen(false); setSelection([]);
        }
      }
    } catch (error) {
      const sameScope = mounted.current && authority.current.userId === userId && authority.current.storeId === storeId;
      if (sameScope && error instanceof OnlineApiError && (error.status === 401 || error.status === 403)) {
        setSelection([]); setExportOpen(false); setActiveId(null); setImage(null); onSessionExpired();
      } else if (current()) {
        if (action === "review") void client.invalidateQueries({ queryKey: ["store-kph", userId, storeId] });
        setActionError(action === "review" ? "Chưa cập nhật được trạng thái duyệt. Hãy tải lại phiếu để kiểm tra trước khi thử lại." : "Chưa tạo được file Excel. Hãy thử lại.");
      }
    } finally {
      actionLock.current = false;
      if (mounted.current) setActionBusy(null);
    }
  }
  const denied = query.error instanceof OnlineApiError && query.error.status === 403;
  return <StorePageLayout className="store-kph store-online-kph" aria-label="Phiếu KPH" aria-busy={query.isFetching || !!actionBusy}>
    <StorePageHero className="store-kph-underlay">
      {canCreate && createRecord && lookupBarcode && profile ? <section className="store-create-actions"><h2>Tạo phiếu KPH</h2><div className="store-two-col">{(["TPCN", "TPTS"] as const).map(kind => <KphCreateButton key={kind} kind={kind} disabled={suspended || expired || !!actionBusy} onPointerEnter={preloadKphCreateForm} onFocus={preloadKphCreateForm} onClick={() => { setNotice(""); create.current?.open(kind); }} />)}</div></section> : null}
    </StorePageHero>
    <StorePageSurface className="store-ticket-list" aria-label="Phiếu khai báo" onFocusCapture={revealBelowStickyTabs}>
    <StoreFoodKindTabs value={filters.kind} counts={(!dateError && !blockedHistory ? query.data?.pages[0]?.typeTotals : undefined) ?? { TPCN: 0, TPTS: 0 }} onChange={kind => change({ kind })} />
    <div className="store-kph-list-controls"><div className="store-list-heading"><h2>Phiếu khai báo</h2><span className="store-result-count">{query.data?.pages[0]?.totalItems ?? 0} phiếu</span></div><div className="store-kph-list-toolbar">{canExport && prepareExport ? <button className="store-compact" disabled={pending} aria-pressed={selectionMode} onClick={() => { setSelectionMode(!selectionMode); setSelection([]); setActionError(""); }}><ListChecks size={20} aria-hidden="true" /><span>{selectionMode ? "Xong" : "Chọn"}</span></button> : null}<button className="store-filter" aria-label="Lọc phiếu KPH" disabled={!!actionBusy || suspended} onClick={() => setFilterOpen(true)}><SlidersHorizontal size={20} aria-hidden="true" /></button></div></div>
    {notice ? <p role="status">{notice}</p> : null}
    {actionError && !active && !exportOpen ? <p role="alert">{actionError}</p> : null}
    {selectionMode && canExport ? <div className="store-batch"><span>{selected.length} đã chọn</span><small>Giữ lựa chọn khi hiển thị thêm</small>{unseenSelected > 0 ? <small>{unseenSelected} phiếu được chọn theo ngày chưa nằm trong danh sách đã tải</small> : null}<Button className="store-export" disabled={pending || !selected.length} onClick={() => { setActionError(""); setExportOpen(true); }}>Xuất Excel</Button></div> : null}
    <StoreSheet open={filterOpen && !suspended} onOpenChange={setFilterOpen} className="store-kph-sheet store-kph-filter" title="Lọc & sắp xếp" description="Bộ lọc phiếu áp dụng ngay khi thay đổi">
    <div className="store-online-kph-filters">
      <section className="store-kph-filter-section"><h3>Ngày phát hiện hàng KPH</h3><div className="store-kph-date-shortcuts" role="group" aria-label="Lọc nhanh ngày phát hiện">{KPH_DATE_SHORTCUTS.map(shortcut => { const range = kphDateRange(shortcut.value); return <button type="button" key={shortcut.value} aria-pressed={filters.from === range.from && filters.to === range.to} onClick={() => change(range)}>{shortcut.label}</button>; })}</div></section>
      <div><label htmlFor={`${id}-from`}>Từ ngày</label><CalendarInput id={`${id}-from`} label="Từ ngày" value={filters.from} initialMonth={formatBusinessDate(new Date()).iso} onValueChange={value => change({ from: value })} invalid={!!dateError} /></div>
      <div><label htmlFor={`${id}-to`}>Đến ngày</label><CalendarInput id={`${id}-to`} label="Đến ngày" value={filters.to} initialMonth={formatBusinessDate(new Date()).iso} onValueChange={value => change({ to: value })} invalid={!!dateError} /></div>
      <label>Trạng thái<select aria-label="Trạng thái" value={filters.approval} onChange={event => change({ approval: event.target.value as Filters["approval"] })}><option value="ALL">Tất cả</option>{Object.entries(approvalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Sắp xếp<select aria-label="Sắp xếp" value={filters.sort} onChange={event => change({ sort: event.target.value as Filters["sort"] })}>{[["newest", "Mới tạo"], ["detectedDate", "Ngày phát hiện"], ["product", "Tên hàng"], ["supplier", "NCC"], ["quantity", "Số lượng"], ["condition", "Tình trạng"], ["resolution", "Xử lý"], ["approval", "Trạng thái duyệt"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Thứ tự<select aria-label="Thứ tự" value={filters.direction} disabled={filters.sort === "newest"} onChange={event => change({ direction: event.target.value as Filters["direction"] })}><option value="descending">Giảm dần</option><option value="ascending">Tăng dần</option></select></label>
      {dateError ? <p role="alert">{dateError}</p> : null}
      <label className="store-online-group"><input type="checkbox" checked={groupByDate} onChange={event => { setGroupByDate(event.target.checked); setCollapsed([]); }} />Nhóm theo ngày</label>
      <Button variant="ghost" onClick={() => { if (actionLock.current) return; cancelDay(); setCompleteDays({}); setFilters(defaults); setActiveId(null); setImage(null); setCollapsed([]); setSelection([]); setExportOpen(false); setGroupByDate(true); }}>Đặt lại</Button>
      <Button onClick={() => setFilterOpen(false)}>Xong</Button>
    </div></StoreSheet>
    {dateError && !filterOpen ? <p role="alert">{dateError}</p> : null}
    {query.isError ? <div role="alert"><p>{query.isFetchNextPageError && !expired ? "Chưa tải thêm được phiếu. Các phiếu đã tải và lựa chọn vẫn được giữ." : denied ? "Không có quyền xem phiếu tại cửa hàng này." : "Không tải được phiếu."}</p>{!denied && !expired ? <Button variant="secondary" onClick={() => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); }}>Thử lại</Button> : null}</div> : null}
    {!dateError && !blockedHistory ? <>
      {query.isFetching ? <span className="sr-only" role="status">Đang tải…</span> : null}
      {dayLoading ? <p role="status">Đang chọn đủ phiếu trong ngày…</p> : null}
      <StoreKphList allSelectionLabel="Chọn tất cả phiếu đã tải" onSelectDate={(date, checked) => { void selectDay(date, checked); }} selectedDates={selectedDates} totalByDate={new Map(Object.entries(completeDays).map(([date, rows]) => [date, rows.length]))} desktop={desktop} visible={records} selectionMode={selectionMode && canExport} selection={selection} setSelection={setSelection} groupByDate={groupByDate} loading={pending} collapsedDates={collapsed} onToggleDate={date => setCollapsed(current => current.includes(date) ? current.filter(item => item !== date) : [...current, date])} setActive={record => { if (!pending) { setActionError(""); setActiveId(record.id); } }} />
      {!query.isPending && !query.isFetching && !records.length ? <p>Không có phiếu</p> : null}
      <StoreKphMore hasMore={!!query.hasNextPage} shown={records.length} total={query.data?.pages[0]?.totalItems ?? 0} loading={pending || query.isFetchingNextPage} onMore={() => { if (!pending && query.hasNextPage) void query.fetchNextPage(); }} />
    </> : null}
    </StorePageSurface>
    {canCreate && createRecord && lookupBarcode && profile ? <KphCreateControl ref={create} profile={profile} suspended={suspended} onBarcodeLookup={lookup} onSaved={save} /> : null}
    <StoreSheet open={!!active && !blockedHistory && !suspended} onOpenChange={open => { if (!open && !actionLock.current) { setActionError(""); setActiveId(null); setImage(null); } }} title="Phiếu KPH" description="Chi tiết phiếu" className="store-kph-sheet store-kph-detail">
      {active ? <><p className={`store-kph-detail-kind kind-${active.kind.toLowerCase()}`}>{active.kind === "TPCN" ? "TP khô & khác" : "TP tươi sống"}</p><section><h3>Hàng hóa</h3><Summary rows={[["Tên hàng hóa", active.productName], ["SKU", active.sku], ["Barcode", active.barcode || "—"], ["NCC", active.supplier], ["Số lượng", active.quantity]]} /></section><section><h3>Phát hiện & xử lý</h3><Summary rows={[["Ngày phát hiện", active.detectedDate], ["Người phát hiện", active.detectedBy], ["Tình trạng", active.condition], ["Xử lý", active.resolution], ["Ngày xử lý", active.treatmentDate || "—"], ["Duyệt", approvalLabels[active.approvalStatus]], ["Người duyệt", active.reviewedBy || "—"]]} />
        </section><section><h3>Ảnh minh chứng</h3>{active.note ? <p>{active.note}</p> : null}<div className="store-review-photos">{active.photos.map((photo, index) => <button key={photo.id} aria-label={`Xem ảnh ${index + 1}`} onClick={() => setImage(photo)}><img src={photo.src} alt={photo.alt} loading="lazy" /></button>)}</div></section>{actionError ? <p role="alert">{actionError}</p> : null}{canReview && reviewRecord ? <div className="store-sheet-actions"><Button variant="ghost" disabled={pending || active.approvalStatus === "REJECTED"} onClick={() => void actOnRecord("review", "REJECTED")}>Không duyệt</Button><Button className="store-button" disabled={pending || active.approvalStatus === "APPROVED"} onClick={() => void actOnRecord("review", "APPROVED")}>{actionBusy === "review" ? "Đang cập nhật…" : "Duyệt phiếu"}</Button></div> : null}</> : null}
    </StoreSheet>
    <StoreSheet open={exportOpen && canExport && !suspended && !blockedHistory} onOpenChange={open => { if (!actionLock.current) { setExportOpen(open); setActionError(""); } }} title="Xuất Excel" description="Xác nhận xuất các phiếu đủ điều kiện" className="store-kph-sheet store-kph-export">
      <Summary rows={[["Cửa hàng", profile?.storeName ?? storeId], ["Loại phiếu", filters.kind === "TPCN" ? "TP khô & khác" : "TP tươi sống"], ["Đủ điều kiện", `${eligible.length} phiếu đã duyệt`], ["Không đưa vào file", `${selected.length - eligible.length} phiếu`]]} />
      {actionError || exportLimitError ? <p role="alert">{actionError || exportLimitError}</p> : null}
      <div className="store-sheet-actions"><Button variant="ghost" disabled={!!actionBusy} onClick={() => setExportOpen(false)}>Hủy</Button><Button className="store-button" disabled={pending || !eligible.length || !!exportLimitError} onClick={() => void actOnRecord("export")}>{actionBusy === "export" ? "Đang xuất…" : "Tải xuống"}</Button></div>
    </StoreSheet>
    <EvidenceImageViewer image={image} open={!!image && !!active && !query.isError && !suspended} presentation="screen" index={Math.max(0, active?.photos.findIndex(photo => photo.id === image?.id) ?? 0)} total={active?.photos.length ?? 0} onPrevious={() => { if (active && image) { const index = active.photos.findIndex(photo => photo.id === image.id); if (index > 0) setImage(active.photos[index - 1]!); } }} onNext={() => { if (active && image) { const index = active.photos.findIndex(photo => photo.id === image.id); if (index < active.photos.length - 1) setImage(active.photos[index + 1]!); } }} onOpenChange={open => { if (!open) setImage(null); }} />
  </StorePageLayout>;
}
