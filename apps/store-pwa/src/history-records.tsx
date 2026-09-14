import { getConditionTone, getResolutionTone } from "@coopfood-kph/kph-rules";
import { Button, cn, Tag } from "@coopfood-kph/ui";
import { Building2, CalendarDays, ChevronDown, ChevronUp, RotateCcw, Scale, Trash2, UserRound } from "lucide-react";
import { useState, type MouseEvent } from "react";

import { EvidenceImageViewer } from "./image-viewer";
import { approvalLabels, type ApprovalStatus, type EvidencePhotoView, type RecordView } from "./record-view";

export type RecordActions = {
  approve?: (id: string, status: ApprovalStatus) => void | Promise<void>;
  busyIds?: ReadonlySet<string>;
  remove?: (id: string) => void;
  restore?: (id: string) => void;
};

type RecordProps = {
  actions?: RecordActions | undefined;
  expanded?: boolean;
  record: RecordView;
  selected: boolean;
  trashMode: boolean;
  onExpansionChange?: (id: string, expanded: boolean) => void;
  onToggle: (id: string) => void;
};

export function RecordRow({ actions, onToggle, record, selected, trashMode }: RecordProps) {
  return <tr className={cn("record-row", selected && "is-selected")}>
    <td className="p-3 text-center"><input type="checkbox" checked={selected} onChange={() => onToggle(record.id)} aria-label={`Chọn phiếu ${record.id}`} /></td>
    <td className="p-3"><strong>{record.detectedDate}</strong><br /><span className="text-ink-muted">{record.detectedBy}</span></td>
    <td className="p-3"><span className="font-mono text-xs font-bold text-brand">{record.sku}</span><br /><strong>{record.productName}</strong></td>
    <td className="max-w-56 p-3 text-ink-muted">{record.supplier}</td>
    <td className="p-3 font-bold">{record.quantity}</td>
    <td className="p-3"><Tag className="status-badge" tone={getConditionTone(record.condition)}>{record.condition}</Tag></td>
    <td className="p-3"><Tag className="resolution-badge" tone={getResolutionTone(record.resolution)}>{record.resolution}</Tag></td>
    <td className="p-3"><RecordPhotoGallery photos={record.photos} recordId={record.id} variant="table" /></td>
    <td className="p-3"><ApprovalControl busy={actions?.busyIds?.has(record.id)} recordId={record.id} status={record.approvalStatus} onChange={actions?.approve} /></td>
    <td className="p-3 text-center">{actions?.remove && actions.restore ? <RecordHistoryActionButton recordId={record.id} trashMode={trashMode} onDelete={actions.remove!} onRestore={actions.restore!} /> : null}</td>
  </tr>;
}

export function RecordCard({ actions, expanded = false, onExpansionChange, onToggle, record, selected, trashMode }: RecordProps) {
  function isInteractiveTarget(event: MouseEvent<HTMLElement>) {
    return event.target instanceof HTMLElement && event.target.closest("button, input, select, label") !== null;
  }

  function expandFromCard(event: MouseEvent<HTMLElement>) {
    if (!expanded && !isInteractiveTarget(event)) onExpansionChange?.(record.id, true);
  }

  function collapseFromHeader(event: MouseEvent<HTMLElement>) {
    if (expanded && !isInteractiveTarget(event)) onExpansionChange?.(record.id, false);
  }

  return <article className={cn("record-card", !expanded && "is-compact", selected && "is-selected")} onClick={expandFromCard}>
    <header className="record-card-header" onClick={collapseFromHeader}>
      <div className="record-card-product"><p className="font-mono text-xs font-bold text-brand">{record.sku}</p><h3 className="font-black">{record.productName}</h3></div>
      <div className="record-card-controls" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="record-card-expand" aria-expanded={expanded} aria-label={`${expanded ? "Thu gọn" : "Mở rộng"} phiếu ${record.id}`} title={expanded ? "Thu gọn phiếu" : "Mở rộng phiếu"} onClick={() => onExpansionChange?.(record.id, !expanded)}>
          {expanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </button>
        <label className="record-card-select-slot">
          <input type="checkbox" checked={selected} onChange={() => onToggle(record.id)} aria-label={`Chọn phiếu ${record.id}`} />
        </label>
      </div>
    </header>

    {expanded ? <>
      <div className="record-card-meta" aria-label="Thông tin phiếu">
        <span className="record-card-meta-item" aria-label={`Ngày phát hiện ${record.detectedDate}`} title="Ngày phát hiện"><CalendarDays aria-hidden="true" /><strong>{record.detectedDate}</strong></span>
        <span className="record-card-meta-item" aria-label={`Người phát hiện ${record.detectedBy}`} title="Người phát hiện"><UserRound aria-hidden="true" /><span>{record.detectedBy}</span></span>
        <span className="record-card-meta-item" aria-label={`Số lượng ${record.quantity}`} title="Số lượng"><Scale aria-hidden="true" /><strong>{record.quantity}</strong></span>
        <span className="record-card-meta-item is-supplier" aria-label={`Nhà cung cấp ${record.supplier}`} title="Nhà cung cấp"><Building2 aria-hidden="true" /><span>{record.supplier}</span></span>
      </div>
      <div className="record-card-outcomes" aria-label="Tình trạng và biện pháp">
        <Tag className="status-badge" tone={getConditionTone(record.condition)} title={`Tình trạng: ${record.condition}`}>{record.condition}</Tag>
        <Tag className="resolution-badge" tone={getResolutionTone(record.resolution)} title={`Biện pháp: ${record.resolution}`}>{record.resolution}</Tag>
      </div>
      <RecordPhotoGallery photos={record.photos} recordId={record.id} variant="card" />
      <div className="record-card-note" aria-label={`Ghi chú: ${record.note || "Không có ghi chú"}`}>
        <span className="record-card-note-label">Ghi chú:</span>
        <span className="record-card-note-content">{record.note || "—"}</span>
      </div>
    </> : null}
    <footer className="record-card-footer">
      {!expanded ? (
        <RecordCardStatuses compact actions={actions} record={record} />
      ) : (
        <div className="record-card-approval"><ApprovalControl busy={actions?.busyIds?.has(record.id)} recordId={record.id} status={record.approvalStatus} onChange={actions?.approve} /></div>
      )}
      {actions?.remove && actions.restore ? <RecordHistoryActionButton recordId={record.id} trashMode={trashMode} onDelete={actions.remove!} onRestore={actions.restore!} /> : null}
    </footer>
  </article>;
}

function RecordCardStatuses({ compact = false, actions, record }: { compact?: boolean; actions?: RecordActions | undefined; record: RecordView }) {
  return <div className={cn("record-card-statuses", compact && "record-card-compact-outcomes")} aria-label="Tình trạng, biện pháp và duyệt">
    <Tag className="status-badge" tone={getConditionTone(record.condition)} title={`Tình trạng: ${record.condition}`}>{record.condition}</Tag>
    <Tag className="resolution-badge" tone={getResolutionTone(record.resolution)} title={`Biện pháp: ${record.resolution}`}>{record.resolution}</Tag>
    <div className="record-card-approval"><ApprovalControl busy={actions?.busyIds?.has(record.id)} recordId={record.id} status={record.approvalStatus} onChange={actions?.approve} /></div>
  </div>;
}

function ApprovalControl({ busy = false, onChange, recordId, status }: { busy?: boolean | undefined; onChange?: ((id: string, status: ApprovalStatus) => void | Promise<void>) | undefined; recordId: string; status: ApprovalStatus }) {
  if (!onChange) return <span>{approvalLabels[status]}</span>;
  return <label className="approval-control">
    <span className="sr-only">Duyệt</span>
    <span className="approval-select-shell">
      <select className={cn("approval-select", `is-${status.toLowerCase()}`)} aria-label={`Trạng thái duyệt phiếu ${recordId}`} aria-busy={busy} disabled={busy} value={status} onChange={(event) => void onChange(recordId, event.target.value as ApprovalStatus)}>
        {(Object.keys(approvalLabels) as ApprovalStatus[]).map((value) => <option key={value} value={value}>{approvalLabels[value]}</option>)}
      </select>
      <ChevronDown className="approval-select-icon" size={13} strokeWidth={2.5} aria-hidden="true" />
    </span>
  </label>;
}

function RecordHistoryActionButton({ onDelete, onRestore, recordId, trashMode }: { onDelete: NonNullable<RecordActions["remove"]>; onRestore: NonNullable<RecordActions["restore"]>; recordId: string; trashMode: boolean }) {
  return <Button
    variant="ghost"
    size="icon"
    className={cn("record-delete", trashMode && "is-restore")}
    aria-label={`${trashMode ? "Khôi phục" : "Xóa"} phiếu ${recordId}`}
    title={trashMode ? "Khôi phục phiếu" : "Chuyển sang trạng thái đã xoá"}
    onClick={() => trashMode ? onRestore(recordId) : onDelete(recordId)}
  >
    {trashMode ? <RotateCcw size={17} aria-hidden="true" /> : <Trash2 size={17} aria-hidden="true" />}
  </Button>;
}

function RecordPhotoGallery({ photos, recordId, variant }: { photos: readonly EvidencePhotoView[]; recordId: string; variant: "table" | "card" }) {
  const [activePhoto, setActivePhoto] = useState<EvidencePhotoView | null>(null);
  return (
    <>
      <div className={cn("record-photo-gallery", variant === "table" ? "is-table" : "is-card")} aria-label={`${photos.length} ảnh minh chứng của phiếu ${recordId}`}>
        {photos.map((photo, index) => (
          <button key={photo.id} type="button" className="record-photo-button" onClick={() => setActivePhoto(photo)} aria-label={`Xem ảnh minh chứng ${index + 1} của phiếu ${recordId}`}>
            <img src={photo.src} alt="" />
            {variant === "card" ? <span>{index + 1}</span> : null}
          </button>
        ))}
      </div>
      <EvidenceImageViewer image={activePhoto} open={activePhoto !== null} onOpenChange={(open) => { if (!open) setActivePhoto(null); }} />
    </>
  );
}
