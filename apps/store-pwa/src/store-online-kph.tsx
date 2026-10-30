import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@coopfood-kph/ui";
import { parseDisplayDate, type KphKind } from "@coopfood-kph/kph-rules";
import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { StoreFoodKindTabs } from "./store-food-kind-tabs";
import { StoreKphList } from "./store-kph-list";
import { useStoreDesktopLayout } from "./use-store-desktop-layout";
import { StoreSheet, Summary } from "./store-sheet";
import { EvidenceImageViewer } from "./image-viewer";
import { approvalLabels, type ApprovalStatus, type EvidencePhotoView, type RecordView } from "./record-view";
import { OnlineApiError, type OnlineHistoryFilter } from "./online-kph";
import type { StoreSessionGateway } from "./store-session-api";
import "./store-online-kph.css";

type Filters = { kind: KphKind; approval: "ALL" | ApprovalStatus; from: string; to: string; sort: "newest" | NonNullable<OnlineHistoryFilter["sort"]>; direction: NonNullable<OnlineHistoryFilter["direction"]>; page: number };
const defaults: Filters = { kind: "TPTS", approval: "ALL", from: "", to: "", sort: "newest", direction: "descending", page: 1 };
function iso(value: string) { try { return value ? parseDisplayDate(value) : undefined; } catch { return null; } }

export function StoreOnlineKph({ userId, storeId, loadHistory, onSessionExpired }: {
  userId: string; storeId: string; loadHistory: StoreSessionGateway["loadHistory"]; onSessionExpired: () => void;
}) {
  const id = useId();
  const desktop = useStoreDesktopLayout();
  const [filters, setFilters] = useState(defaults);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [active, setActive] = useState<RecordView | null>(null);
  const [image, setImage] = useState<EvidencePhotoView | null>(null);
  const from = iso(filters.from), to = iso(filters.to);
  const dateError = from === null || to === null ? "Nhập ngày dd/mm/yyyy" : from && to && from > to ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" : "";
  const query = useQuery({
    queryKey: ["store-kph", userId, storeId, filters],
    queryFn: ({ signal }) => loadHistory(storeId, {
      type: filters.kind, page: filters.page, pageSize: 25,
      ...(filters.approval !== "ALL" ? { approvalStatus: filters.approval } : {}),
      ...(from ? { detectedFrom: from } : {}), ...(to ? { detectedTo: to } : {}),
      ...(filters.sort !== "newest" ? { sort: filters.sort, direction: filters.direction } : {}),
    }, signal),
    enabled: !dateError,
    placeholderData: previous => previous,
    retry: false, networkMode: "always", gcTime: 0,
    refetchOnWindowFocus: false, refetchOnReconnect: true,
  });
  const expired = query.error instanceof OnlineApiError && query.error.status === 401;
  useEffect(() => { if (expired) onSessionExpired(); }, [expired, onSessionExpired]);
  useEffect(() => {
    if (query.data && !query.isPlaceholderData && query.data.totalPages > 0 && filters.page > query.data.totalPages) {
      setActive(null); setImage(null); setCollapsed([]);
      setFilters(current => ({ ...current, page: query.data.totalPages }));
    }
  }, [query.data, query.isPlaceholderData, filters.page]);
  // Every parameter/page change clears detail and grouping state together.
  function change(patch: Partial<Filters>) {
    setActive(null); setImage(null); setCollapsed([]);
    setFilters(current => ({ ...current, ...patch, page: patch.page ?? 1 }));
  }
  const records = !dateError && !query.isError ? query.data?.records ?? [] : [];
  const pending = query.isFetching || !!dateError;
  const denied = query.error instanceof OnlineApiError && query.error.status === 403;
  return <section className="store-online-kph" aria-label="Phiếu KPH" aria-busy={query.isFetching}>
    <StoreFoodKindTabs value={filters.kind} counts={query.data?.typeTotals ?? { TPCN: 0, TPTS: 0 }} onChange={kind => change({ kind })} />
    <div className="store-online-kph-filters">
      <div><label htmlFor={`${id}-from`}>Từ ngày</label><CalendarInput id={`${id}-from`} label="Từ ngày" value={filters.from} initialMonth={formatBusinessDate(new Date()).iso} onValueChange={value => change({ from: value })} invalid={!!dateError} /></div>
      <div><label htmlFor={`${id}-to`}>Đến ngày</label><CalendarInput id={`${id}-to`} label="Đến ngày" value={filters.to} initialMonth={formatBusinessDate(new Date()).iso} onValueChange={value => change({ to: value })} invalid={!!dateError} /></div>
      <label>Trạng thái<select value={filters.approval} onChange={event => change({ approval: event.target.value as Filters["approval"] })}><option value="ALL">Tất cả</option>{Object.entries(approvalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Sắp xếp<select value={filters.sort} onChange={event => change({ sort: event.target.value as Filters["sort"] })}>{[["newest", "Mới tạo"], ["detectedDate", "Ngày phát hiện"], ["product", "Tên hàng"], ["supplier", "NCC"], ["quantity", "Số lượng"], ["condition", "Tình trạng"], ["resolution", "Xử lý"], ["approval", "Trạng thái duyệt"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Thứ tự<select value={filters.direction} disabled={filters.sort === "newest"} onChange={event => change({ direction: event.target.value as Filters["direction"] })}><option value="descending">Giảm dần</option><option value="ascending">Tăng dần</option></select></label>
      <Button variant="ghost" onClick={() => { setFilters(defaults); setActive(null); setImage(null); setCollapsed([]); }}>Đặt lại</Button>
    </div>
    {dateError ? <p role="alert">{dateError}</p> : null}
    {query.isError ? <div role="alert"><p>{denied ? "Không có quyền xem phiếu tại cửa hàng này." : "Không tải được phiếu."}</p>{!denied && !expired ? <Button variant="secondary" onClick={() => { void query.refetch(); }}>Thử lại</Button> : null}</div> : null}
    {!dateError && !query.isError ? <>
      <div className="store-online-kph-count"><span>{query.data?.totalItems ?? 0} phiếu</span>{query.isFetching ? <span role="status">Đang tải…</span> : null}</div>
      <StoreKphList desktop={desktop} visible={records} loading={pending} collapsedDates={collapsed} onToggleDate={date => setCollapsed(current => current.includes(date) ? current.filter(item => item !== date) : [...current, date])} setActive={setActive} />
      {!query.isPending && !query.isFetching && !records.length ? <p>Không có phiếu</p> : null}
      <nav className="store-online-pagination" aria-label="Phân trang"><Button variant="secondary" disabled={pending || filters.page <= 1} onClick={() => change({ page: filters.page - 1 })}>Trang trước</Button><span>Trang {query.data?.totalPages ? filters.page : 0}/{query.data?.totalPages ?? 0}</span><Button variant="secondary" disabled={pending || filters.page >= (query.data?.totalPages ?? 0)} onClick={() => change({ page: filters.page + 1 })}>Trang sau</Button></nav>
    </> : null}
    <StoreSheet open={!!active && !query.isError} onOpenChange={open => { if (!open) { setActive(null); setImage(null); } }} title="Phiếu KPH" description="Chi tiết phiếu" className="store-kph-sheet store-kph-detail">
      {active ? <><h3>{active.productName}</h3><Summary rows={[["SKU", active.sku], ["Barcode", active.barcode || "—"], ["NCC", active.supplier], ["Số lượng", active.quantity], ["Ngày phát hiện", active.detectedDate], ["Người phát hiện", active.detectedBy], ["Tình trạng", active.condition], ["Xử lý", active.resolution], ["Ngày xử lý", active.treatmentDate || "—"], ["Duyệt", approvalLabels[active.approvalStatus]], ["Người duyệt", active.reviewedBy || "—"]]} />
        {active.note ? <p>{active.note}</p> : null}<div className="store-review-photos">{active.photos.map((photo, index) => <button key={photo.id} aria-label={`Xem ảnh ${index + 1}`} onClick={() => setImage(photo)}><img src={photo.src} alt={photo.alt} loading="lazy" /></button>)}</div></> : null}
    </StoreSheet>
    <EvidenceImageViewer image={image} open={!!image && !!active && !query.isError} onOpenChange={open => { if (!open) setImage(null); }} />
  </section>;
}
