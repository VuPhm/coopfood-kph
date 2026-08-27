import { getConditionTone, getResolutionTone, type KphKind } from "@coopfood-kph/kph-rules";
import { Button, cn, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, Tag } from "@coopfood-kph/ui";
import { AlertTriangle, ArrowDown, ArrowUp, Building2, CalendarDays, ChevronDown, ChevronRight, ChevronUp, ChevronsDown, ChevronsUp, FileDown, FileSpreadsheet, History, ListFilter, LoaderCircle, PackagePlus, RotateCcw, Salad, Scale, Store, Trash2, UserRound } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import { assetUrl } from "./asset-url";
import { formatBusinessDate } from "./business-date";
import { CreateRecordDialog, type CreatedRecordDraft } from "./create-record-dialog";
import { DEMO_RECORDS, type DemoApprovalStatus, type DemoPhoto, type DemoRecord } from "./demo-records";
import { downloadKphWorkbook } from "./excel-export";
import { ExpiryWorkbench } from "./expiry-dialog";
import { EvidenceImageViewer } from "./image-viewer";
import { PwaStatus } from "./pwa-status";
import { loadPilotRecords, patchPilotRecords, recordPilotExport, savePilotRecord, type PilotRecord } from "./record-store";
import { readStorageHealth, requestPersistentStorage, storageUsageLabel, type StorageHealth } from "./storage-health";
import { actorIdentity, DEFAULT_STORE_PROFILE, loadPilotStoreProfile, savePilotStoreProfile, storeIdentity, type StoreProfile } from "./store-profile";
import { StoreSettingsDialog } from "./store-settings-dialog";
import { UtilityPanelMeta } from "./utility-panel-meta";

export { formatBusinessDate } from "./business-date";

const kindCopy: Record<KphKind, { action: string; short: string }> = {
  TPCN: { action: "TP khô & khác", short: "TP Khô & khác" },
  TPTS: { action: "TP tươi sống", short: "TP Tươi sống" },
};
const kphKinds: KphKind[] = ["TPCN", "TPTS"];
const approvalLabels: Record<DemoApprovalStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Không duyệt",
};
type ApprovalFilter = "ALL" | DemoApprovalStatus;
type RecordSortKey = "approval" | "condition" | "detectedDate" | "product" | "quantity" | "resolution" | "supplier";
type RecordSort = { direction: "ascending" | "descending"; key: RecordSortKey };
const approvalFilterOptions: readonly { label: string; value: ApprovalFilter }[] = [
  { label: "Tất cả trạng thái", value: "ALL" },
  { label: approvalLabels.PENDING, value: "PENDING" },
  { label: approvalLabels.APPROVED, value: "APPROVED" },
  { label: approvalLabels.REJECTED, value: "REJECTED" },
];
const recordSortOptions: readonly { label: string; value: RecordSortKey }[] = [
  { label: "Ngày phát hiện", value: "detectedDate" },
  { label: "SKU / Tên SP", value: "product" },
  { label: "Nhà cung cấp", value: "supplier" },
  { label: "Số lượng", value: "quantity" },
  { label: "Tình trạng KPH", value: "condition" },
  { label: "Biện pháp xử lý", value: "resolution" },
  { label: "Trạng thái duyệt", value: "approval" },
];
const recordCollator = new Intl.Collator("vi", { numeric: true, sensitivity: "base" });
const pilotPersistenceEnabled = import.meta.env.MODE !== "test";
const initialRecords = pilotPersistenceEnabled ? [] : DEMO_RECORDS;
const initialApproval = Object.fromEntries(initialRecords.map(({ approvalStatus, id }) => [id, approvalStatus]));

function hydrationPhotoUrl(photo: PilotRecord["photos"][number], ownedUrls: Set<string>): DemoPhoto {
  const src = URL.createObjectURL(photo.blob);
  ownedUrls.add(src);
  return { id: photo.id, src, alt: photo.alt, blob: photo.blob, fileName: photo.fileName };
}

function hydratePilotRecord(record: PilotRecord, ownedUrls: Set<string>): DemoRecord {
  return {
    id: record.id,
    kind: record.kind,
    detectedDate: record.detectedDate,
    detectedBy: record.detectedBy,
    sku: record.sku,
    productName: record.productName,
    supplier: record.supplier,
    quantity: record.quantity,
    quantityValue: record.quantityValue,
    unit: record.unit,
    condition: record.condition,
    resolution: record.resolution,
    treatmentDate: record.treatmentDate,
    approvalStatus: record.approvalStatus,
    photos: record.photos.map((photo) => hydrationPhotoUrl(photo, ownedUrls)),
    note: record.note,
    createdAt: record.createdAt,
    lastExportedAt: record.lastExportedAt,
  };
}

function TodayDate() {
  const [now, setNow] = useState(() => new Date());
  const today = formatBusinessDate(now);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="header-today" aria-label={`Hôm nay: ${today.display}`}>
      <span className="header-today-label">Hôm nay:</span>
      <time dateTime={today.iso}>{today.display}</time>
    </div>
  );
}

function detectedDateValue(value: string) {
  const [day = "", month = "", year = ""] = value.split("/");
  return `${year}${month}${day}`;
}

function quantityValue(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortValue(record: DemoRecord, key: RecordSortKey, approvalStatus: DemoApprovalStatus) {
  switch (key) {
    case "approval": return approvalLabels[approvalStatus];
    case "condition": return record.condition;
    case "detectedDate": return detectedDateValue(record.detectedDate);
    case "product": return `${record.sku} ${record.productName}`;
    case "quantity": return quantityValue(record.quantity);
    case "resolution": return record.resolution;
    case "supplier": return record.supplier;
  }
}

export function App() {
  const [records, setRecords] = useState<readonly DemoRecord[]>(initialRecords);
  const [activeKind, setActiveKind] = useState<KphKind>("TPCN");
  const [createKind, setCreateKind] = useState<KphKind | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [expandedMobileRecords, setExpandedMobileRecords] = useState<ReadonlySet<string>>(new Set());
  const [approvalByRecord, setApprovalByRecord] = useState<Record<string, DemoApprovalStatus>>(() => initialApproval);
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("ALL");
  const [recordSort, setRecordSort] = useState<RecordSort | null>(null);
  const [notice, setNotice] = useState("");
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<string>>(new Set());
  const [deleteIds, setDeleteIds] = useState<readonly string[]>([]);
  const [trashMode, setTrashMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [storeSettingsOpen, setStoreSettingsOpen] = useState(false);
  const [storageHealth, setStorageHealth] = useState<StorageHealth>({ persistent: false, quota: null, usage: null });
  const [storageReady, setStorageReady] = useState(!pilotPersistenceEnabled);
  const [storageError, setStorageError] = useState("");
  const ownedPhotoUrls = useRef(new Set<string>());
  const visibleRecords = useMemo(() => {
    const scopedRecords = records.filter(({ kind, id, approvalStatus }) => {
      const currentApproval = approvalByRecord[id] ?? approvalStatus;
      const hasExpectedDeletionState = trashMode ? deletedIds.has(id) : !deletedIds.has(id);
      return kind === activeKind && hasExpectedDeletionState && (approvalFilter === "ALL" || currentApproval === approvalFilter);
    });

    if (!recordSort) return scopedRecords;

    return [...scopedRecords].sort((left, right) => {
      const leftApproval = approvalByRecord[left.id] ?? left.approvalStatus;
      const rightApproval = approvalByRecord[right.id] ?? right.approvalStatus;
      const leftValue = sortValue(left, recordSort.key, leftApproval);
      const rightValue = sortValue(right, recordSort.key, rightApproval);
      const comparison = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : recordCollator.compare(String(leftValue), String(rightValue));
      return recordSort.direction === "ascending" ? comparison : -comparison;
    });
  }, [activeKind, approvalByRecord, approvalFilter, deletedIds, recordSort, records, trashMode]);
  const selectedRecords = useMemo(
    () => records.filter(({ id, kind }) => kind === activeKind && (trashMode ? deletedIds.has(id) : !deletedIds.has(id)) && selected.has(id)),
    [activeKind, deletedIds, records, selected, trashMode],
  );
  const allVisibleSelected = visibleRecords.length > 0 && visibleRecords.every(({ id }) => selected.has(id));
  const allVisibleExpanded = visibleRecords.length > 0 && visibleRecords.every(({ id }) => expandedMobileRecords.has(id));

  useEffect(() => () => {
    ownedPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    ownedPhotoUrls.current.clear();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(""), 15_000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (!pilotPersistenceEnabled) return;
    let cancelled = false;

    async function hydrate() {
      try {
        const [storedRecords, health, storedProfile] = await Promise.all([loadPilotRecords(), readStorageHealth(), loadPilotStoreProfile()]);
        if (cancelled) return;
        const hydrated = storedRecords.map((record) => hydratePilotRecord(record, ownedPhotoUrls.current));
        setRecords(hydrated);
        setApprovalByRecord(Object.fromEntries(storedRecords.map(({ approvalStatus, id }) => [id, approvalStatus])));
        setDeletedIds(new Set(storedRecords.filter(({ trashState }) => trashState === "trash").map(({ id }) => id)));
        setStoreProfile(storedProfile);
        setStorageHealth(health);
      } catch (error) {
        if (!cancelled) setStorageError(error instanceof Error ? error.message : "Không thể mở dữ liệu pilot trên thiết bị");
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    }

    void hydrate();
    const handleStorageFailure = () => setStorageError("Dữ liệu pilot vừa bị gián đoạn. Hãy đóng các cửa sổ app khác rồi tải lại.");
    window.addEventListener("kph-storage-blocked", handleStorageFailure);
    window.addEventListener("kph-storage-version-change", handleStorageFailure);
    window.addEventListener("kph-storage-terminated", handleStorageFailure);
    return () => {
      cancelled = true;
      window.removeEventListener("kph-storage-blocked", handleStorageFailure);
      window.removeEventListener("kph-storage-version-change", handleStorageFailure);
      window.removeEventListener("kph-storage-terminated", handleStorageFailure);
    };
  }, []);

  function openCreate(kind: KphKind) {
    setCreateKind(kind);
    setDialogOpen(true);
  }

  async function saveStoreSettings(profile: StoreProfile) {
    try {
      if (pilotPersistenceEnabled) {
        await savePilotStoreProfile(profile);
        setStorageHealth(await requestPersistentStorage());
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error("Không thể lưu thiết lập cửa hàng trên thiết bị");
    }
    setStoreProfile(profile);
    setNotice(`Đã cập nhật ${storeIdentity(profile)}.`);
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

  function setMobileRecordExpanded(recordId: string, expanded: boolean) {
    setExpandedMobileRecords((current) => {
      const next = new Set(current);
      if (expanded) next.add(recordId);
      else next.delete(recordId);
      return next;
    });
  }

  function toggleAllVisibleExpansion() {
    setExpandedMobileRecords((current) => {
      const next = new Set(current);
      visibleRecords.forEach(({ id }) => {
        if (allVisibleExpanded) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }

  function selectKind(kind: KphKind) {
    setActiveKind(kind);
    setSelected(new Set());
  }

  function changeApprovalFilter(filter: ApprovalFilter) {
    setApprovalFilter(filter);
    setSelected(new Set());
  }

  function toggleRecordSort(key: RecordSortKey) {
    setRecordSort((current) => current?.key === key
      ? { key, direction: current.direction === "ascending" ? "descending" : "ascending" }
      : { key, direction: "ascending" });
  }

  function cycleMobileRecordSort(key: RecordSortKey) {
    setRecordSort((current) => {
      if (current?.key !== key) return { key, direction: "ascending" };
      if (current.direction === "ascending") return { key, direction: "descending" };
      return null;
    });
  }

  async function updateApproval(recordId: string, status: DemoApprovalStatus) {
    try {
      if (pilotPersistenceEnabled) await patchPilotRecords([recordId], { approvalStatus: status });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu trạng thái duyệt trên thiết bị");
      return;
    }
    setApprovalByRecord((current) => ({ ...current, [recordId]: status }));
    setSelected((current) => {
      const next = new Set(current);
      next.delete(recordId);
      return next;
    });
    setRecords((current) => current.map((record) => record.id === recordId ? { ...record, approvalStatus: status } : record));
    setNotice(`Đã chuyển phiếu ${recordId} sang “${approvalLabels[status]}” ${pilotPersistenceEnabled ? "trên thiết bị này" : "trong dữ liệu demo"}.`);
  }

  async function approveSelected() {
    const recordIds = [...selected];
    try {
      if (pilotPersistenceEnabled) await patchPilotRecords(recordIds, { approvalStatus: "APPROVED" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu trạng thái duyệt trên thiết bị");
      return;
    }
    setApprovalByRecord((current) => {
      const next = { ...current };
      selected.forEach((recordId) => { next[recordId] = "APPROVED"; });
      return next;
    });
    setRecords((current) => current.map((record) => recordIds.includes(record.id) ? { ...record, approvalStatus: "APPROVED" } : record));
    setNotice(`Đã duyệt ${recordIds.length} phiếu ${pilotPersistenceEnabled ? "trên thiết bị này" : "trong dữ liệu demo"}.`);
    setSelected(new Set());
  }

  function toggleTrashMode() {
    setTrashMode((current) => !current);
    setSelected(new Set());
    setExpandedMobileRecords(new Set());
    setApprovalFilter("ALL");
    setRecordSort(null);
  }

  function requestDelete(recordId: string) {
    setDeleteIds([recordId]);
  }

  function requestDeleteSelected() {
    setDeleteIds(selectedRecords.map(({ id }) => id));
  }

  async function confirmDelete() {
    const targetIds = new Set(deleteIds);
    try {
      if (pilotPersistenceEnabled) await patchPilotRecords([...targetIds], { trashState: "trash", deletedAt: new Date().toISOString() });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể chuyển phiếu vào thùng rác");
      return;
    }
    setDeletedIds((current) => new Set([...current, ...targetIds]));
    setSelected((current) => new Set([...current].filter((id) => !targetIds.has(id))));
    setExpandedMobileRecords((current) => new Set([...current].filter((id) => !targetIds.has(id))));
    setDeleteIds([]);
    setNotice(`Đã chuyển ${targetIds.size} phiếu sang trạng thái đã xoá ${pilotPersistenceEnabled ? "trên thiết bị này" : "trong dữ liệu demo"}.`);
  }

  async function restoreRecord(recordId: string) {
    try {
      if (pilotPersistenceEnabled) await patchPilotRecords([recordId], { trashState: "active", deletedAt: null });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể khôi phục phiếu");
      return;
    }
    setDeletedIds((current) => {
      const next = new Set(current);
      next.delete(recordId);
      return next;
    });
    setSelected((current) => new Set([...current].filter((id) => id !== recordId)));
    setExpandedMobileRecords((current) => new Set([...current].filter((id) => id !== recordId)));
    setNotice(`Đã khôi phục phiếu ${recordId} ${pilotPersistenceEnabled ? "trên thiết bị này" : "trong dữ liệu demo"}.`);
  }

  async function restoreSelected() {
    const targetIds = new Set(selectedRecords.map(({ id }) => id));
    try {
      if (pilotPersistenceEnabled) await patchPilotRecords([...targetIds], { trashState: "active", deletedAt: null });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể khôi phục các phiếu đã chọn");
      return;
    }
    setDeletedIds((current) => new Set([...current].filter((id) => !targetIds.has(id))));
    setSelected((current) => new Set([...current].filter((id) => !targetIds.has(id))));
    setExpandedMobileRecords((current) => new Set([...current].filter((id) => !targetIds.has(id))));
    setNotice(`Đã khôi phục ${targetIds.size} phiếu ${pilotPersistenceEnabled ? "trên thiết bị này" : "trong dữ liệu demo"}.`);
  }

  async function saveCreatedRecord(draft: CreatedRecordDraft) {
    const dateDigits = draft.detectedDate.split("/").reverse().join("").slice(2);
    const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const id = `KPH-${dateDigits}-${uuid.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
    const photos = draft.photos.map(({ id: photoId, fileName, blob }) => {
      const src = URL.createObjectURL(blob);
      ownedPhotoUrls.current.add(src);
      return { id: photoId, src, alt: `Ảnh minh chứng ${fileName} đã đóng tem`, blob, fileName };
    });
    const record: DemoRecord = {
      id,
      kind: draft.kind,
      detectedDate: draft.detectedDate,
      detectedBy: draft.detectedBy,
      sku: draft.barcode || "NHẬP TAY",
      productName: draft.productName || `Sản phẩm ${draft.barcode}`,
      supplier: draft.supplier || "Chưa nhập nhà cung cấp",
      quantity: `${draft.quantity} ${draft.unit}`,
      quantityValue: draft.quantity,
      unit: draft.unit,
      condition: draft.condition,
      resolution: draft.resolution,
      treatmentDate: draft.treatmentDate,
      approvalStatus: "PENDING",
      photos,
      note: draft.note,
      createdAt: new Date().toISOString(),
      lastExportedAt: null,
    };
    try {
      if (pilotPersistenceEnabled) {
        await savePilotRecord(record);
        setStorageHealth(await requestPersistentStorage());
      }
    } catch (error) {
      photos.forEach(({ src }) => {
        URL.revokeObjectURL(src);
        ownedPhotoUrls.current.delete(src);
      });
      throw error instanceof Error ? error : new Error("Không thể lưu phiếu trên thiết bị");
    }
    setRecords((current) => [record, ...current]);
    setApprovalByRecord((current) => ({ ...current, [id]: "PENDING" }));
    setActiveKind(draft.kind);
    setSelected(new Set([id]));
    setNotice(`Đã tạo phiếu ${id} và lưu trên thiết bị này.`);
  }

  async function exportSelected() {
    if (!selectedRecords.length) return;
    setExporting(true);
    setExportError("");
    try {
      const fileName = await downloadKphWorkbook(activeKind, selectedRecords, storeProfile);
      if (pilotPersistenceEnabled) await recordPilotExport(activeKind, selectedRecords, fileName);
      setExportOpen(false);
      setNotice(`Đã tạo file Excel gồm ${selectedRecords.length} phiếu ${kindCopy[activeKind].short}; hãy gửi file này cho CHT.`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Không thể xuất file Excel");
    } finally {
      setExporting(false);
    }
  }
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, kind: KphKind) {
    const currentIndex = kphKinds.indexOf(kind);
    const nextKind = event.key === "ArrowRight"
      ? kphKinds[(currentIndex + 1) % kphKinds.length]
      : event.key === "ArrowLeft"
        ? kphKinds[(currentIndex - 1 + kphKinds.length) % kphKinds.length]
        : event.key === "Home"
          ? kphKinds[0]
          : event.key === "End"
            ? kphKinds[kphKinds.length - 1]
            : null;

    if (!nextKind) return;
    event.preventDefault();
    selectKind(nextKind);
    document.getElementById(`history-tab-${nextKind.toLowerCase()}`)?.focus();
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="app-header sticky top-0 z-30 bg-brand text-white shadow-md safe-top">
        <div className="app-header-inner">
          <img
            className="app-brand-logo"
            src={assetUrl("brand/coopfood-logo.png")}
            alt="Co.op Food - an toàn, tiện lợi, tươi ngon"
          />
          <TodayDate />
        </div>
      </header>

      <main className="workspace-layout mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7">
        <section className={cn("history-board", trashMode && "is-trash-mode")} aria-labelledby="workspace-title">
          <div className="workspace-header">
            <div className="utility-panel-meta workspace-header-meta">
              <p id="workspace-title">Phiếu theo dõi hàng không phù hợp</p>
            </div>

            <div className="workspace-actions" aria-label="Tạo phiếu theo loại thực phẩm">
              {kphKinds.map((kind) => (
                <button key={kind} type="button" disabled={!storageReady} className={cn("workspace-create", kind === "TPCN" ? "workspace-create-tpcn" : "workspace-create-tpts")} onClick={() => openCreate(kind)}>
                  {kind === "TPCN" ? <PackagePlus aria-hidden="true" /> : <Salad aria-hidden="true" />}
                  <span><small>Tạo phiếu</small>{kindCopy[kind].action}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="store-context"
              aria-label={`Thiết lập cửa hàng: ${storeIdentity(storeProfile)}`}
              disabled={!storageReady}
              onClick={() => setStoreSettingsOpen(true)}
            >
              <Store className="store-context-icon" size={20} aria-hidden="true" />
              <span className="store-context-copy">
                <strong>{storeIdentity(storeProfile)}</strong>
                <span>{actorIdentity(storeProfile)}</span>
                <small title={storageHealth.persistent ? "Dữ liệu pilot được trình duyệt cấp chế độ lưu bền" : "Dữ liệu pilot chỉ nằm trên thiết bị này và không đồng bộ"}>
                  {storageReady ? storageUsageLabel(storageHealth) : "dữ liệu: đang mở…"}
                </small>
              </span>
              <ChevronRight className="store-context-disclosure" aria-hidden="true" />
            </button>
          </div>
          {storageError ? <p className="storage-error-banner" role="alert">{storageError}</p> : null}
          <header className="history-header">
            <div className="history-title-row pr-3">
              <h2 id="history-title" className="history-title">
                <span className="history-total-count" aria-label={`${visibleRecords.length} phiếu`}>{visibleRecords.length}</span>
                {trashMode ? "Phiếu đã xoá" : "Phiếu đã khai báo"}
              </h2>
              <div className="history-title-actions">
                <MobileHistoryControls filter={approvalFilter} onFilterChange={changeApprovalFilter} onSort={cycleMobileRecordSort} onSortReset={() => setRecordSort(null)} sort={recordSort} />
                <button
                  type="button"
                  className="trash-mode-toggle"
                  aria-label={trashMode ? "Quay lại phiếu đã khai báo" : `Mở thùng rác, có ${deletedIds.size} phiếu`}
                  aria-pressed={trashMode}
                  title={trashMode ? "Quay lại phiếu đã khai báo" : "Mở thùng rác"}
                  onClick={toggleTrashMode}
                >
                  <History aria-hidden="true" />
                  <span className="trash-mode-label">Phiếu đã xoá</span>
                </button>
              </div>
            </div>

            <div className="history-controls-row">
              <div className="history-tabs" role="tablist" aria-label="Loại phiếu">
                {kphKinds.map((kind) => {
                  const count = records.filter((record) => record.kind === kind && (trashMode ? deletedIds.has(record.id) : !deletedIds.has(record.id))).length;
                  return (
                    <button
                      key={kind}
                      id={`history-tab-${kind.toLowerCase()}`}
                      type="button"
                      role="tab"
                      aria-selected={activeKind === kind}
                      tabIndex={activeKind === kind ? 0 : -1}
                      className={cn("history-tab", activeKind === kind && "is-active")}
                      onClick={() => selectKind(kind)}
                      onKeyDown={(event) => handleTabKeyDown(event, kind)}
                    >
                      <span className="history-tab-label">{kindCopy[kind].short}</span>
                      <span className="history-tab-count" aria-label={`${count} phiếu`}>{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="history-actions">
                <div className="history-list-controls">
                  <button type="button" className="expand-all-mobile" onClick={toggleAllVisibleExpansion}>
                    {allVisibleExpanded ? <ChevronsUp size={16} aria-hidden="true" /> : <ChevronsDown size={16} aria-hidden="true" />}
                    {allVisibleExpanded ? "Thu gọn tất cả" : "Mở rộng tất cả"}
                  </button>
                </div>
                <div className="history-action-buttons">
                  <div className="history-selection-slot">
                    {selected.size > 0
                      ? trashMode
                        ? <button type="button" className="selection-count selection-approve selection-restore" onClick={restoreSelected}>Khôi phục <strong>{selected.size}</strong> phiếu</button>
                        : <button type="button" className="selection-count selection-approve" onClick={approveSelected}>Duyệt <strong>{selected.size}</strong> phiếu</button>
                      : <span className="selection-count" aria-live="polite">Đã chọn <strong>0</strong></span>}
                    <label className="select-all-history" aria-label="Chọn tất cả phiếu" title="Chọn tất cả">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Chọn tất cả phiếu" />
                    </label>
                  </div>
                  {selected.size > 0 ? (
                    <div className="history-action-tools">
                      <Button variant="primary" className="history-export" aria-label="Xuất Excel" onClick={() => { setExportError(""); setExportOpen(true); }}><FileDown size={17} aria-hidden="true" /><span className="history-export-label">Xuất Excel</span></Button>
                      <Button variant="ghost" className="history-delete" aria-label="Xóa phiếu đã chọn" title={trashMode ? "Không thể xoá vĩnh viễn" : "Chuyển sang trạng thái đã xoá"} disabled={trashMode} onClick={requestDeleteSelected}><Trash2 size={17} aria-hidden="true" /><span className="history-delete-label">Xóa</span></Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <div className="overflow-x-auto desktop-history">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="w-12 px-3 py-0 text-center"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Chọn tất cả" /></th>
                  <SortableHeader label="Phát hiện" onSort={toggleRecordSort} sort={recordSort} sortKey="detectedDate" />
                  <SortableHeader label="SKU/UPC · Tên hàng hóa" onSort={toggleRecordSort} sort={recordSort} sortKey="product" />
                  <SortableHeader label="NCC" onSort={toggleRecordSort} sort={recordSort} sortKey="supplier" />
                  <SortableHeader label="SL · ĐVT" onSort={toggleRecordSort} sort={recordSort} sortKey="quantity" />
                  <SortableHeader label="Tình trạng KPH" onSort={toggleRecordSort} sort={recordSort} sortKey="condition" />
                  <SortableHeader label="Biện pháp xử lý" onSort={toggleRecordSort} sort={recordSort} sortKey="resolution" />
                  <th className="px-3 py-0">Ảnh</th>
                  <SortableHeader label="Duyệt" onSort={toggleRecordSort} sort={recordSort} sortKey="approval" />
                  <th className="w-12 px-3 py-0 text-center"><span className="sr-only">Thao tác dòng</span></th>
                </tr>
              </thead>
              <tbody>{visibleRecords.length > 0
                ? visibleRecords.map((record) => <RecordRow key={record.id} approvalStatus={approvalByRecord[record.id] ?? record.approvalStatus} record={record} selected={selected.has(record.id)} trashMode={trashMode} onApprovalChange={updateApproval} onDelete={requestDelete} onRestore={restoreRecord} onToggle={toggleSelection} />)
                : <tr><td className="empty-history-cell" colSpan={10}>{storageReady ? (trashMode ? "Thùng rác đang trống." : "Chưa có phiếu nào được lưu trên thiết bị này.") : "Đang mở dữ liệu trên thiết bị…"}</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 mobile-history">
            {visibleRecords.length > 0
              ? visibleRecords.map((record) => <RecordCard key={record.id} approvalStatus={approvalByRecord[record.id] ?? record.approvalStatus} expanded={expandedMobileRecords.has(record.id)} record={record} selected={selected.has(record.id)} trashMode={trashMode} onApprovalChange={updateApproval} onDelete={requestDelete} onRestore={restoreRecord} onExpansionChange={setMobileRecordExpanded} onToggle={toggleSelection} />)
              : <p className="empty-history-card">{storageReady ? (trashMode ? "Thùng rác đang trống." : "Chưa có phiếu nào được lưu trên thiết bị này.") : "Đang mở dữ liệu trên thiết bị…"}</p>}
          </div>
        </section>

        <div className="workspace-side-stack">
          <ExpiryWorkbench />
        </div>
      </main>

      <CreateRecordDialog kind={createKind} open={dialogOpen} profile={storeProfile} onOpenChange={setDialogOpen} onSaved={saveCreatedRecord} />
      <StoreSettingsDialog open={storeSettingsOpen} profile={storeProfile} onOpenChange={setStoreSettingsOpen} onSaved={saveStoreSettings} />

      <Dialog open={deleteIds.length > 0} onOpenChange={(open) => { if (!open) setDeleteIds([]); }}>
        <DialogContent className="action-dialog" aria-describedby="delete-description">
          <div className="action-dialog-icon is-danger"><AlertTriangle aria-hidden="true" /></div>
          <DialogTitle>Chuyển {deleteIds.length} phiếu sang trạng thái đã xoá?</DialogTitle>
          <DialogDescription id="delete-description">
            Dữ liệu phiếu vẫn được giữ nguyên để phần thùng rác có thể khôi phục sau đó; không có thao tác xoá vĩnh viễn.
          </DialogDescription>
          <div className="action-dialog-actions">
            <Button type="button" variant="ghost" onClick={() => setDeleteIds([])}>Hủy</Button>
            <Button type="button" className="action-danger-button" onClick={confirmDelete}><Trash2 size={17} aria-hidden="true" />Xóa phiếu</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={(open) => { if (!exporting) { setExportOpen(open); if (!open) setExportError(""); } }}>
        <DialogContent className="action-dialog export-dialog" aria-describedby="export-description">
          <div className="action-dialog-icon is-export"><FileSpreadsheet aria-hidden="true" /></div>
          <DialogTitle>Xuất phiếu ra Excel</DialogTitle>
          <DialogDescription id="export-description">
            File BM-331.CF được dàn ngang, khóa định dạng và giữ tối đa ba ảnh minh chứng theo đúng thứ tự.
          </DialogDescription>
          <dl className="export-summary">
            <div><dt>Loại phiếu</dt><dd>{kindCopy[activeKind].short}</dd></div>
            <div><dt>Số phiếu</dt><dd>{selectedRecords.length}</dd></div>
            <div><dt>Số ảnh</dt><dd>{selectedRecords.reduce((total, record) => total + record.photos.length, 0)}</dd></div>
            <div><dt>Cửa hàng</dt><dd>{storeIdentity(storeProfile)}</dd></div>
          </dl>
          {exportError ? <p className="action-dialog-error" role="alert">{exportError}</p> : null}
          <div className="action-dialog-actions">
            <Button type="button" variant="ghost" disabled={exporting} onClick={() => setExportOpen(false)}>Hủy</Button>
            <Button type="button" disabled={exporting || selectedRecords.length === 0} onClick={exportSelected}>
              {exporting ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Đang xuất…</> : <><FileDown size={17} aria-hidden="true" />Xuất {selectedRecords.length} dòng</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {notice ? <button type="button" className="notice-toast fixed bottom-20 left-1/2 z-40 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl" onClick={() => setNotice("")}>{notice}</button> : null}
      <PwaStatus />
    </div>
  );
}

type HistoryControlsContentProps = {
  filter: ApprovalFilter;
  idPrefix: string;
  onFilterChange: (filter: ApprovalFilter) => void;
  onSort: (key: RecordSortKey) => void;
  onSortReset: () => void;
  showSort?: boolean;
  sort: RecordSort | null;
};

function HistoryControlsTrigger({ active, className, controls, expanded, label, onClick }: { active: boolean; className?: string; controls?: string; expanded?: boolean; label: string; onClick?: () => void }) {
  return <button
    type="button"
    className={cn("history-controls-trigger", className, active && "is-active")}
    aria-controls={controls}
    aria-expanded={expanded}
    aria-label={label}
    title="Lọc và sắp xếp"
    onClick={onClick}
  >
    <span className="history-controls-icon" aria-hidden="true">
      <ListFilter />
      {active ? <span className="history-controls-indicator" /> : null}
    </span>
  </button>;
}

function MobileHistoryControls({ filter, onFilterChange, onSort, onSortReset, sort }: Omit<HistoryControlsContentProps, "idPrefix">) {
  const [open, setOpen] = useState(false);
  const active = filter !== "ALL" || sort !== null;

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <HistoryControlsTrigger active={active} className="history-controls-mobile" label="Mở lọc và sắp xếp trên mobile" />
    </DialogTrigger>
    <DialogContent className="mobile-history-dialog" aria-describedby="mobile-history-dialog-description">
      <DialogTitle className="sr-only">Lọc và sắp xếp</DialogTitle>
      <DialogDescription id="mobile-history-dialog-description" className="sr-only">Chọn trạng thái duyệt, cột và chiều sắp xếp cho danh sách phiếu.</DialogDescription>
      <UtilityPanelMeta actionLabel="Đóng lọc và sắp xếp" dialogClose label="Tùy chọn lọc" />

      <HistoryControlsContent filter={filter} idPrefix="mobile" onFilterChange={onFilterChange} onSort={onSort} onSortReset={onSortReset} sort={sort} />
    </DialogContent>
  </Dialog>;
}

function HistoryControlsContent({ filter, idPrefix, onFilterChange, onSort, onSortReset, showSort = true, sort }: HistoryControlsContentProps) {
  function toggleFilter(nextFilter: DemoApprovalStatus) {
    onFilterChange(filter === nextFilter ? "ALL" : nextFilter);
  }

  return <div className="mobile-history-dialog-body">
        <section className="expiry-focus-zone" aria-label="Lọc trạng thái">
          <div className="mobile-history-choice-grid mobile-history-filter-grid" role="group" aria-label="Lọc theo trạng thái duyệt">
            {approvalFilterOptions.slice(1).map(({ label, value }) => {
              const selected = filter === value;
              return <button key={value} type="button" className={cn("mobile-history-choice mobile-history-filter-choice", `is-${value.toLowerCase()}`, selected && "is-selected")} aria-label={selected ? `Bỏ lọc ${label}` : `Lọc ${label}`} aria-pressed={selected} onClick={() => toggleFilter(value as DemoApprovalStatus)}>
                <span>{label}</span>
              </button>;
            })}
          </div>
        </section>

        {showSort ? <section className="expiry-focus-zone" aria-label="Sắp xếp">
          <div className="mobile-history-choice-grid mobile-history-sort-grid" role="group" aria-label="Sắp xếp danh sách phiếu">
            {recordSortOptions.map(({ label, value }) => {
              const selected = sort?.key === value;
              const SortIcon = sort?.direction === "ascending" ? ArrowUp : ArrowDown;
              const selectedLabel = sort?.direction === "ascending"
                ? `Sắp xếp ${label} tăng dần; bấm để chuyển giảm dần`
                : `Sắp xếp ${label} giảm dần; bấm để huỷ sắp xếp`;
              return <button key={value} type="button" className={cn("mobile-history-choice mobile-history-sort-choice", selected && "is-selected")} aria-label={selected ? selectedLabel : `Sắp xếp theo ${label}`} aria-pressed={selected} onClick={() => onSort(value)}>
                <span>{label}</span>{selected ? <span className="mobile-history-sort-state"><SortIcon aria-hidden="true" /></span> : null}
              </button>;
            })}
          </div>
        </section> : null}
      </div>;
}

function SortableHeader({ label, onSort, sort, sortKey }: { label: string; onSort: (key: RecordSortKey) => void; sort: RecordSort | null; sortKey: RecordSortKey }) {
  const active = sort?.key === sortKey;
  const direction = active ? sort.direction : "none";
  const SortIcon = sort?.direction === "ascending" ? ArrowUp : ArrowDown;

  return <th className="px-3 py-0" aria-sort={direction}>
    <button type="button" className={cn("table-sort", active && "is-active")} aria-label={`Sắp xếp theo ${label}`} onClick={() => onSort(sortKey)}>
      <span>{label}</span>{active ? <SortIcon aria-hidden="true" /> : null}
    </button>
  </th>;
}

type RecordProps = {
  approvalStatus: DemoApprovalStatus;
  expanded?: boolean;
  record: DemoRecord;
  selected: boolean;
  trashMode: boolean;
  onApprovalChange: (id: string, status: DemoApprovalStatus) => void;
  onDelete: (id: string) => void;
  onExpansionChange?: (id: string, expanded: boolean) => void;
  onRestore: (id: string) => void;
  onToggle: (id: string) => void;
};

function RecordRow({ approvalStatus, onApprovalChange, onDelete, onRestore, onToggle, record, selected, trashMode }: RecordProps) {
  return <tr className={cn("record-row", selected && "is-selected")}>
    <td className="p-3 text-center"><input type="checkbox" checked={selected} onChange={() => onToggle(record.id)} aria-label={`Chọn phiếu ${record.id}`} /></td>
    <td className="p-3"><strong>{record.detectedDate}</strong><br /><span className="text-ink-muted">{record.detectedBy}</span></td>
    <td className="p-3"><span className="font-mono text-xs font-bold text-brand">{record.sku}</span><br /><strong>{record.productName}</strong></td>
    <td className="max-w-56 p-3 text-ink-muted">{record.supplier}</td>
    <td className="p-3 font-bold">{record.quantity}</td>
    <td className="p-3"><Tag className="status-badge" tone={getConditionTone(record.condition)}>{record.condition}</Tag></td>
    <td className="p-3"><Tag className="resolution-badge" tone={getResolutionTone(record.resolution)}>{record.resolution}</Tag></td>
    <td className="p-3"><RecordPhotoGallery photos={record.photos} recordId={record.id} variant="table" /></td>
    <td className="p-3"><ApprovalControl recordId={record.id} status={approvalStatus} onChange={onApprovalChange} /></td>
    <td className="p-3 text-center"><RecordHistoryActionButton recordId={record.id} trashMode={trashMode} onDelete={onDelete} onRestore={onRestore} /></td>
  </tr>;
}

function RecordCard({ approvalStatus, expanded = false, onApprovalChange, onDelete, onExpansionChange, onRestore, onToggle, record, selected, trashMode }: RecordProps) {
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
        <RecordCardStatuses approvalStatus={approvalStatus} compact onApprovalChange={onApprovalChange} record={record} />
      ) : (
        <div className="record-card-approval"><ApprovalControl recordId={record.id} status={approvalStatus} onChange={onApprovalChange} /></div>
      )}
      <RecordHistoryActionButton recordId={record.id} trashMode={trashMode} onDelete={onDelete} onRestore={onRestore} />
    </footer>
  </article>;
}

function RecordCardStatuses({ approvalStatus, compact = false, onApprovalChange, record }: { approvalStatus: DemoApprovalStatus; compact?: boolean; onApprovalChange: RecordProps["onApprovalChange"]; record: DemoRecord }) {
  return <div className={cn("record-card-statuses", compact && "record-card-compact-outcomes")} aria-label="Tình trạng, biện pháp và duyệt">
    <Tag className="status-badge" tone={getConditionTone(record.condition)} title={`Tình trạng: ${record.condition}`}>{record.condition}</Tag>
    <Tag className="resolution-badge" tone={getResolutionTone(record.resolution)} title={`Biện pháp: ${record.resolution}`}>{record.resolution}</Tag>
    <div className="record-card-approval"><ApprovalControl recordId={record.id} status={approvalStatus} onChange={onApprovalChange} /></div>
  </div>;
}

function ApprovalControl({ onChange, recordId, status }: { onChange: (id: string, status: DemoApprovalStatus) => void; recordId: string; status: DemoApprovalStatus }) {
  return <label className="approval-control">
    <span className="sr-only">Duyệt</span>
    <span className="approval-select-shell">
      <select className={cn("approval-select", `is-${status.toLowerCase()}`)} aria-label={`Trạng thái duyệt phiếu ${recordId}`} value={status} onChange={(event) => onChange(recordId, event.target.value as DemoApprovalStatus)}>
        {(Object.keys(approvalLabels) as DemoApprovalStatus[]).map((value) => <option key={value} value={value}>{approvalLabels[value]}</option>)}
      </select>
      <ChevronDown className="approval-select-icon" size={13} strokeWidth={2.5} aria-hidden="true" />
    </span>
  </label>;
}

function RecordHistoryActionButton({ onDelete, onRestore, recordId, trashMode }: { onDelete: RecordProps["onDelete"]; onRestore: RecordProps["onRestore"]; recordId: string; trashMode: boolean }) {
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

function RecordPhotoGallery({ photos, recordId, variant }: { photos: readonly DemoPhoto[]; recordId: string; variant: "table" | "card" }) {
  const [activePhoto, setActivePhoto] = useState<DemoPhoto | null>(null);
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
