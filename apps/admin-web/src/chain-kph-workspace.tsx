import { formatDisplayDate, KPH_OPTIONS, parseDisplayDate, resolveChoiceLabel, type LocalDate } from "@coopfood-kph/kph-rules";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Field, Input } from "@coopfood-kph/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import type { ChainKphQuery, KphDecision, KphRecord, LifecycleAdminGateway } from "./lifecycle-admin";
import "./chain-kph.css";

export const chainKphRootKey = ["admin-chain-kph"] as const;
const approvalLabels: Record<KphRecord["approvalStatus"], string> = {
  PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Không duyệt",
};

function message(error: unknown) {
  return error instanceof Error ? error.message : "Không thể tải dữ liệu.";
}

function product(record: KphRecord) {
  return record.catalogSnapshot.productName || record.catalogSnapshot.skuCode || record.barcode || "Hàng nhập tay";
}

type Gateway = Pick<LifecycleAdminGateway, "listChainKphRecords" | "listKphStores" | "reviewKphRecord">;

export function ChainKphWorkspace({ gateway, actorId, onError }: {
  gateway: Gateway; actorId: string; onError(error: unknown): void;
}) {
  const client = useQueryClient();
  const [query, setQuery] = useState<ChainKphQuery>({ page: 1 });
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [filterError, setFilterError] = useState("");
  const stores = useQuery({
    queryKey: [...chainKphRootKey, actorId, "stores"], queryFn: ({ signal }) => gateway.listKphStores(signal),
    retry: false, gcTime: 0,
  });
  const list = useQuery({
    queryKey: [...chainKphRootKey, actorId, "list", query], queryFn: ({ signal }) => gateway.listChainKphRecords(query, signal),
    retry: false, gcTime: 0,
  });
  useEffect(() => {
    if (list.error) onError(list.error);
    if (stores.error) onError(stores.error);
  }, [list.error, stores.error, onError]);
  const page = list.isSuccess ? list.data : null;
  const record = page?.items.find(item => item.id === selectedId);
  useEffect(() => {
    if (page && page.page > Math.max(1, page.totalPages)) {
      setQuery(current => ({ ...current, page: Math.max(1, page.totalPages) }));
    }
  }, [page]);

  const review = useMutation({
    mutationFn: ({ record, decision }: { record: KphRecord; decision: KphDecision }) =>
      gateway.reviewKphRecord(record.store.id, record.id, decision),
  });
  function decide(record: KphRecord, decision: KphDecision) {
    setNotice("");
    setReviewError("");
    review.mutate({ record, decision }, {
      onSuccess(updated) {
        setSelectedId("");
        setNotice(`${approvalLabels[updated.approvalStatus]} · ${product(updated)}`);
        void client.invalidateQueries({ queryKey: [...chainKphRootKey, actorId, "list"] });
      },
      onError(error) {
        setSelectedId("");
        setReviewError(message(error));
        onError(error);
        void client.resetQueries({ queryKey: [...chainKphRootKey, actorId, "list"] });
      },
    });
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const from = String(form.get("from") ?? "").trim();
    const to = String(form.get("to") ?? "").trim();
    const storeId = String(form.get("store") ?? "");
    const approval = String(form.get("approval") ?? "") as KphRecord["approvalStatus"] | "";
    try {
      const detectedFrom = from ? parseDisplayDate(from) : undefined;
      const detectedTo = to ? parseDisplayDate(to) : undefined;
      if (detectedFrom && detectedTo && detectedFrom > detectedTo) throw new Error("Ngày bắt đầu phải trước hoặc trùng ngày kết thúc.");
      setQuery({ page: 1, ...(storeId && { storeId }), ...(detectedFrom && { detectedFrom }),
        ...(detectedTo && { detectedTo }), ...(approval && { approvalStatus: approval }) });
      setSelectedId("");
      setFilterError("");
      setNotice("");
      setReviewError("");
    } catch (error) {
      setFilterError(message(error));
    }
  }

  return <div className="admin-workspace admin-business-workspace chain-kph">
    <section className="admin-panel" aria-labelledby="chain-kph-heading">
      <header className="chain-kph-heading"><h1 id="chain-kph-heading">Phiếu KPH</h1>
        <Button variant="secondary" size="icon" aria-label="Tải lại phiếu KPH" disabled={list.isFetching}
          onClick={() => void list.refetch()}><RefreshCw size={18} aria-hidden="true" /></Button></header>
      <form className="chain-kph-filters" onSubmit={apply}>
        <Field label="Cửa hàng" htmlFor="kph-store"><select id="kph-store" name="store" disabled={!stores.isSuccess}>
          <option value="">Tất cả cửa hàng</option>
          {stores.data?.map(store => <option key={store.id} value={store.id}>{store.code} · {store.name}</option>)}
        </select></Field>
        <Field label="Từ ngày phát hiện" htmlFor="kph-from"><Input id="kph-from" name="from" placeholder="dd/mm/yyyy" /></Field>
        <Field label="Đến ngày phát hiện" htmlFor="kph-to"><Input id="kph-to" name="to" placeholder="dd/mm/yyyy" /></Field>
        <Field label="Trạng thái duyệt" htmlFor="kph-approval"><select id="kph-approval" name="approval">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(approvalLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select></Field>
        <Button type="submit">Lọc phiếu</Button>
      </form>
      {filterError && <p role="alert" className="admin-error">{filterError}</p>}
      {stores.isError && <p role="alert" className="admin-error">{message(stores.error)} <button onClick={() => void stores.refetch()}>Tải lại cửa hàng</button></p>}
    </section>
    <section className="admin-panel" aria-labelledby="chain-kph-list">
      <header className="chain-kph-heading"><h2 id="chain-kph-list">Danh sách phiếu</h2>
        {page && <span className="chain-kph-count">{page.totalItems} phiếu</span>}</header>
      {notice && <p role="status" className="membership-notice">{notice}</p>}
      {reviewError && <p role="alert" className="admin-error">{reviewError}</p>}
      {list.isPending && <p role="status">Đang tải phiếu…</p>}
      {list.isError && <p role="alert" className="admin-error">{message(list.error)} <button onClick={() => void list.refetch()}>Thử lại</button></p>}
      {page && (page.items.length === 0 ? <p>Không có phiếu phù hợp.</p> : <ul className="chain-kph-list">
        {page.items.map(item => <li key={item.id}>
          <div><button className="chain-kph-product" onClick={() => setSelectedId(item.id)}>{product(item)}</button>
            <small>{item.type} · {item.catalogSnapshot.skuCode || item.barcode || "Nhập tay"}</small></div>
          <span>{item.store.code} · {item.store.name}</span>
          <time dateTime={item.detectedDate}>{formatDisplayDate(item.detectedDate as LocalDate)}</time>
          <span className="chain-kph-status" data-state={item.approvalStatus}>{approvalLabels[item.approvalStatus]}</span>
        </li>)}
      </ul>)}
      {page && page.totalPages > 1 && <nav className="chain-kph-pager" aria-label="Phân trang phiếu KPH">
        <Button size="icon" variant="secondary" aria-label="Trang trước" disabled={page.page <= 1}
          onClick={() => setQuery({ ...query, page: page.page - 1 })}><ChevronLeft aria-hidden="true" size={18} /></Button>
        <span>Trang {page.page} / {page.totalPages}</span>
        <Button size="icon" variant="secondary" aria-label="Trang sau" disabled={page.page >= page.totalPages}
          onClick={() => setQuery({ ...query, page: page.page + 1 })}><ChevronRight aria-hidden="true" size={18} /></Button>
      </nav>}
    </section>
    {record && <RecordDetail record={record} pending={review.isPending} onClose={() => setSelectedId("")}
      onDecision={decision => decide(record, decision)} />}
  </div>;
}

function RecordDetail({ record, pending, onClose, onDecision }: {
  record: KphRecord; pending: boolean; onClose(): void; onDecision(decision: KphDecision): void;
}) {
  const { catalogSnapshot: catalog, store } = record;
  const choices = KPH_OPTIONS[record.type];
  const condition = choices.conditions.find(choice => choice.value === record.condition);
  const resolution = choices.resolutions.find(choice => choice.value === record.resolution);
  const rows = [
    ["Mã phiếu", record.id], ["Loại phiếu", record.type], ["SKU", catalog.skuCode], ["Barcode", record.barcode],
    ["Nhà cung cấp", [catalog.supplierCode, catalog.supplierName].filter(Boolean).join(" · ")],
    ["Số lượng", `${record.quantity} ${record.unit}`],
    ["Ngày phát hiện", formatDisplayDate(record.detectedDate as LocalDate)], ["Người phát hiện", record.detectedBy.displayName],
    ["Tình trạng", condition ? resolveChoiceLabel(condition, record.conditionDetail ?? undefined) : record.condition],
    ["Biện pháp", resolution ? resolveChoiceLabel(resolution, record.resolutionDetail ?? undefined) : record.resolution],
    ["Ngày xử lý", record.processedDate && formatDisplayDate(record.processedDate as LocalDate)],
    ["Trạng thái duyệt", approvalLabels[record.approvalStatus]], ["Người duyệt", record.reviewedBy?.displayName], ["Ghi chú", record.note],
  ];
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent closeTone="neutral" closeDisabled={pending} className="chain-kph-detail">
      <DialogHeader><DialogTitle>{product(record)}</DialogTitle>
        <DialogDescription>{store.code} · {store.name}</DialogDescription></DialogHeader>
      <dl>{rows.map(([label, value]) => value && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="chain-kph-photos">{record.photos.map(photo => <a key={photo.ordinal} href={photo.stampedContentPath}
        target="_blank" rel="noreferrer" aria-label={`Mở ảnh minh chứng ${photo.ordinal}`}>
        <img src={photo.stampedContentPath} alt={`Ảnh minh chứng ${photo.ordinal}`} /></a>)}</div>
      {record.lifecycleState === "SUBMITTED" ? <div className="chain-kph-actions" aria-busy={pending}>
        <Button variant="secondary" disabled={pending || record.approvalStatus === "REJECTED"} onClick={() => onDecision("REJECTED")}>Không duyệt</Button>
        <Button disabled={pending || record.approvalStatus === "APPROVED"} onClick={() => onDecision("APPROVED")}>Duyệt phiếu</Button>
      </div> : <p>Phiếu đã vô hiệu hóa.</p>}
    </DialogContent>
  </Dialog>;
}
