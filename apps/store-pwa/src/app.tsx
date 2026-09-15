import { parseDisplayDate, type KphKind, type LocalDate } from "@coopfood-kph/kph-rules";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, cn, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@coopfood-kph/ui";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, ChevronDown, ChevronsDown, ChevronsUp, FileDown, FileSpreadsheet, History, ListFilter, LoaderCircle, PackagePlus, RotateCcw, Salad, Trash2 } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import { assetUrl } from "./asset-url";
import { formatBusinessDate } from "./business-date";
import { CalendarInput } from "./calendar-input";
import { CreateRecordDialog, type CreatedRecordDraft } from "./create-record-dialog";
import { DEMO_RECORDS } from "./demo-records";
import { approvalLabels, type ApprovalStatus, type EvidencePhotoView, type RecordView } from "./record-view";
import { downloadKphWorkbook } from "./excel-export";
import { ExpiryWorkbench } from "./expiry-dialog";
import { RecordRow, RecordCard, type RecordActions } from "./history-records";
import { PwaStatus } from "./pwa-status";
import { loadPilotRecords, patchPilotRecords, recordPilotExport, savePilotRecord, type PilotRecord } from "./record-store";
import { readStorageHealth, requestPersistentStorage, storageHealthWarning, storageUsageLabel, type StorageHealth } from "./storage-health";
import { actorIdentity, DEFAULT_STORE_PROFILE, isStoreProfileConfigured, loadPilotStoreProfile, savePilotStoreProfile, storeIdentity, type StoreProfile } from "./store-profile";
import { StoreContext } from "./store-context";
import { StoreSettingsDialog } from "./store-settings-dialog";
import { UtilityPanelMeta } from "./utility-panel-meta";
import { createOnlineGateway, onlineModeEnabled, type OnlineGateway, type OnlineSession, type OnlineWorkspace } from "./online-kph";

export { formatBusinessDate } from "./business-date";

const kindCopy: Record<KphKind, { action: string; short: string }> = {
  TPCN: { action: "TP khô & khác", short: "TP Khô & khác" },
  TPTS: { action: "TP tươi sống", short: "TP Tươi sống" },
};
const kphKinds: KphKind[] = ["TPCN", "TPTS"];
type ApprovalFilter = "ALL" | ApprovalStatus;
type RecordSortKey = "approval" | "condition" | "detectedDate" | "product" | "quantity" | "resolution" | "supplier";
type RecordSort = { direction: "ascending" | "descending"; key: RecordSortKey };
type OnlineMutationScope = { generation: number; storeId: string | null; userId: string | null };
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
const onlinePersistenceEnabled = onlineModeEnabled();
const pilotPersistenceEnabled = import.meta.env.MODE !== "test" && !onlinePersistenceEnabled;
const initialRecords = pilotPersistenceEnabled || onlinePersistenceEnabled ? [] : DEMO_RECORDS;
const onlineSessionQueryKey = ["online", "session"] as const;

function hydrationPhotoUrl(photo: PilotRecord["photos"][number], ownedUrls: Set<string>): EvidencePhotoView {
  const src = URL.createObjectURL(photo.blob);
  ownedUrls.add(src);
  return { id: photo.id, src, alt: photo.alt, blob: photo.blob, fileName: photo.fileName };
}

function hydratePilotRecord(record: PilotRecord, ownedUrls: Set<string>): RecordView {
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

function PilotDataNotice({ configured, onConfigure, warning }: { configured: boolean; onConfigure: () => void; warning: ReturnType<typeof storageHealthWarning> }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;

  return (
    <span
      className="pilot-data-notice"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(false);
      }}
      onFocus={() => setHovered(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setHovered(false);
          setPinned(false);
        }
      }}
    >
      <button
        type="button"
        className={cn("pilot-data-notice-trigger", warning?.level === "critical" && "is-critical")}
        aria-controls="pilot-data-notice-content"
        aria-expanded={open}
        aria-label="Xem lưu ý dữ liệu Pilot"
        title="Lưu ý dữ liệu Pilot"
        onClick={() => setPinned((value) => {
          const next = !value;
          if (!next) setHovered(false);
          return next;
        })}
      >
        <AlertTriangle aria-hidden="true" />
      </button>
      {open ? (
        <span id="pilot-data-notice-content" className={cn("pilot-data-notice-content", warning?.level === "critical" && "is-critical")} role="note" aria-label="Lưu ý dữ liệu Pilot">
          <span><strong>Pilot local-only:</strong> dữ liệu chỉ nằm trên thiết bị này, không đồng bộ. Không xóa site data.</span>
          {warning ? <span>{warning.message}</span> : null}
          {!configured ? <button type="button" onClick={() => { setPinned(false); onConfigure(); }}>Thiết lập ngay</button> : null}
        </span>
      ) : null}
    </span>
  );
}

function detectedDateValue(value: string) {
  const [day = "", month = "", year = ""] = value.split("/");
  return `${year}${month}${day}`;
}

function sortValue(record: RecordView, key: RecordSortKey, approvalStatus: ApprovalStatus) {
  switch (key) {
    case "approval": return approvalLabels[approvalStatus];
    case "condition": return record.condition;
    case "detectedDate": return detectedDateValue(record.detectedDate);
    case "product": return `${record.sku} ${record.productName}`;
    case "quantity": return record.quantityValue;
    case "resolution": return record.resolution;
    case "supplier": return record.supplier;
  }
}

function WorkspaceApp() {
  const [records, setRecords] = useState<readonly RecordView[]>(initialRecords);
  const [activeKind, setActiveKind] = useState<KphKind>("TPCN");
  const [createKind, setCreateKind] = useState<KphKind | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [expandedMobileRecords, setExpandedMobileRecords] = useState<ReadonlySet<string>>(new Set());
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("ALL");
  const [recordSort, setRecordSort] = useState<RecordSort | null>(null);
  const [reviewingIds, setReviewingIds] = useState<ReadonlySet<string>>(new Set());
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [dateFilter, setDateFilter] = useState<{ detectedFrom?: LocalDate; detectedTo?: LocalDate }>({});
  const [dateFilterError, setDateFilterError] = useState("");
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
  const [onlineStoreId, setOnlineStoreId] = useState<string | null>(null);
  const [onlineGateway] = useState(() => onlinePersistenceEnabled ? createOnlineGateway() : null);
  const [onlineReload, setOnlineReload] = useState(0);
  const [onlineAuthRequired, setOnlineAuthRequired] = useState(false);
  const onlineMutationScopeRef = useRef<OnlineMutationScope>({ generation: 0, storeId: null, userId: null });
  const queryClient = useQueryClient();
  const onlineCapabilities = onlineGateway as unknown as Partial<OnlineGateway> | null;
  const supportsIdentityApi = Boolean(onlineCapabilities?.getSession && onlineCapabilities?.loadHistory);
  const legacyWorkspaceQuery = useQuery<OnlineWorkspace>({
    queryKey: ["online", "workspace", onlineReload],
    queryFn: ({ signal }) => onlineCapabilities?.loadWorkspace?.(signal) ?? Promise.reject(new Error("Gateway online chưa sẵn sàng.")),
    enabled: onlinePersistenceEnabled && !supportsIdentityApi && !onlineAuthRequired,
    retry: false,
  });
  const sessionQuery = useQuery<OnlineSession>({
    queryKey: onlineSessionQueryKey,
    queryFn: ({ signal }) => onlineCapabilities?.getSession?.(signal) ?? Promise.reject(new Error("Gateway phiên đăng nhập chưa sẵn sàng.")),
    enabled: onlinePersistenceEnabled && supportsIdentityApi && !onlineAuthRequired,
    retry: false,
  });
  const derivedOnlineSession = supportsIdentityApi ? sessionQuery.data : legacyWorkspaceQuery.data?.session;
  const onlineSession = onlineAuthRequired ? undefined : derivedOnlineSession;
  const onlineStores = onlineSession?.user.stores ?? [];
  const onlineHistoryKey = ["online", "history", onlineSession?.user.id ?? "anonymous", onlineStoreId ?? "none", dateFilter.detectedFrom ?? "", dateFilter.detectedTo ?? ""] as const;
  const onlineHistoryQuery = useQuery<readonly RecordView[]>({
    queryKey: onlineHistoryKey,
    queryFn: ({ signal }) => onlineCapabilities?.loadHistory?.(onlineStoreId!, dateFilter, signal) ?? Promise.reject(new Error("Gateway lịch sử chưa sẵn sàng.")),
    enabled: onlinePersistenceEnabled && supportsIdentityApi && !onlineAuthRequired && Boolean(onlineSession && onlineStoreId),
    retry: false,
  });
  const onlineLoading = onlinePersistenceEnabled && !onlineAuthRequired && (supportsIdentityApi
    ? sessionQuery.isPending || Boolean(onlineSession && onlineStoreId && onlineHistoryQuery.isPending)
    : legacyWorkspaceQuery.isPending);
  const onlineQueryError = supportsIdentityApi
    ? sessionQuery.error ?? onlineHistoryQuery.error
    : legacyWorkspaceQuery.error;

  function invalidateOnlineMutationScope() {
    onlineMutationScopeRef.current = {
      ...onlineMutationScopeRef.current,
      generation: onlineMutationScopeRef.current.generation + 1,
    };
  }

  function isOnlineMutationScopeCurrent(scope: OnlineMutationScope) {
    const current = onlineMutationScopeRef.current;
    return current.generation === scope.generation
      && current.userId === scope.userId
      && current.storeId === scope.storeId;
  }

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => onlineCapabilities?.login?.(username, password) ?? Promise.reject(new Error("Gateway đăng nhập chưa sẵn sàng.")),
    onSuccess: (session: OnlineSession) => {
      invalidateOnlineMutationScope();
      logoutMutation.reset();
      setOnlineAuthRequired(false);
      setStorageError("");
      setRecords([]);
      setSelected(new Set());
      setOnlineStoreId(session.user.stores[0]?.id ?? null);
      queryClient.setQueryData(onlineSessionQueryKey, session);
      queryClient.removeQueries({ queryKey: ["online", "history"] });
    },
    onError: (error: unknown) => setStorageError(error instanceof Error ? error.message : "Không thể đăng nhập lúc này."),
  });
  const logoutMutation = useMutation({
    mutationFn: () => onlineCapabilities?.logout?.() ?? Promise.reject(new Error("Gateway đăng xuất chưa sẵn sàng.")),
    onSuccess: () => {
      invalidateOnlineMutationScope();
      setOnlineAuthRequired(true);
      setOnlineStoreId(null);
      setRecords([]);
      setSelected(new Set());
      setDialogOpen(false);
      queryClient.removeQueries({ queryKey: ["online"] });
      setStorageError("Bạn đã đăng xuất khỏi phiên hiện tại.");
    },
    onError: (error: unknown) => {
      if (isSessionExpiryError(error)) expireOnlineSession(error);

    },
  });
  const ownedPhotoUrls = useRef(new Set<string>());
  const visibleRecords = useMemo(() => {
    const scopedRecords = records.filter(({ kind, id, approvalStatus, detectedDate }) => {
      const hasExpectedDeletionState = trashMode ? deletedIds.has(id) : !deletedIds.has(id);
      const detected = detectedDateValue(detectedDate);
      const afterStart = !dateFilter.detectedFrom || detected >= dateFilter.detectedFrom.replaceAll("-", "");
      const beforeEnd = !dateFilter.detectedTo || detected <= dateFilter.detectedTo.replaceAll("-", "");
      return kind === activeKind && hasExpectedDeletionState && afterStart && beforeEnd
        && (approvalFilter === "ALL" || approvalStatus === approvalFilter);
    });

    if (!recordSort) return scopedRecords;

    return [...scopedRecords].sort((left, right) => {
      const leftValue = sortValue(left, recordSort.key, left.approvalStatus);
      const rightValue = sortValue(right, recordSort.key, right.approvalStatus);
      const comparison = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : recordCollator.compare(String(leftValue), String(rightValue));
      return recordSort.direction === "ascending" ? comparison : -comparison;
    });
  }, [activeKind, approvalFilter, dateFilter, deletedIds, recordSort, records, trashMode]);
  const selectedRecords = useMemo(
    () => records.filter(({ id, kind }) => kind === activeKind && (trashMode ? deletedIds.has(id) : !deletedIds.has(id)) && selected.has(id)),
    [activeKind, deletedIds, records, selected, trashMode],
  );
  const allVisibleSelected = visibleRecords.length > 0 && visibleRecords.every(({ id }) => selected.has(id));
  const allVisibleExpanded = visibleRecords.length > 0 && visibleRecords.every(({ id }) => expandedMobileRecords.has(id));
  const storeConfigured = onlinePersistenceEnabled ? onlineStoreId !== null : isStoreProfileConfigured(storeProfile);
  const selectedOnlineStore = onlineStores.find(({ id }) => id === onlineStoreId);
  const canManageOnline = selectedOnlineStore?.role === "STORE_MANAGER";
  const selectedRecordsAreExportable = selectedRecords.length > 0
    && selectedRecords.every(({ approvalStatus }) => approvalStatus === "APPROVED");
  const dateFilterActive = Boolean(dateFilter.detectedFrom || dateFilter.detectedTo);
  const filterInitialMonth = formatBusinessDate(new Date()).iso as LocalDate;
  const storageWarning = storageReady ? storageHealthWarning(storageHealth) : null;

  useEffect(() => () => {
    ownedPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    ownedPhotoUrls.current.clear();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(""), 15_000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const onlineStoreSignature = onlineStores.map(({ id, role }) => `${id}:${role}`).join("|");

  useEffect(() => {
    const userId = onlineSession?.user.id ?? null;
    const current = onlineMutationScopeRef.current;
    if (current.userId === userId && current.storeId === onlineStoreId) return;
    onlineMutationScopeRef.current = {
      generation: current.generation + 1,
      storeId: onlineStoreId,
      userId,
    };
  }, [onlineSession?.user.id, onlineStoreId]);

  useEffect(() => {
    if (!onlinePersistenceEnabled) return;
    setOnlineStoreId((current) => current && onlineStores.some(({ id }) => id === current)
      ? current
      : onlineStores[0]?.id ?? null);
  }, [onlineSession?.user.id, onlineStoreSignature]);

  useEffect(() => {
    if (!onlinePersistenceEnabled || !onlineSession || !onlineStoreId) return;
    const store = onlineStores.find(({ id }) => id === onlineStoreId);
    if (!store) return;
    setStoreProfile({
      storeName: store.name,
      storeCode: store.code,
      role: store.role === "STORE_MANAGER" ? "STORE_MANAGER" : "STAFF",
      fullName: onlineSession.user.displayName,
      employeeCode: "",
    });
  }, [onlineSession, onlineStoreId, onlineStoreSignature]);

  const loadedOnlineRecords = supportsIdentityApi ? onlineHistoryQuery.data : legacyWorkspaceQuery.data?.records;

  useEffect(() => {
    if (!onlinePersistenceEnabled) return;
    if (loadedOnlineRecords) {
      setRecords(loadedOnlineRecords);
      setStorageError("");
      setOnlineAuthRequired(false);
    } else if (onlineLoading || onlineAuthRequired) {
      setRecords([]);
    }
  }, [loadedOnlineRecords, onlineLoading, onlineAuthRequired]);

  useEffect(() => {
    if (!onlinePersistenceEnabled || !onlineQueryError) return;
    if (isAbortError(onlineQueryError)) return;
    if (isSessionExpiryError(onlineQueryError)) {
      expireOnlineSession(onlineQueryError);
      return;
    }
    setStorageError(onlineQueryError instanceof Error ? onlineQueryError.message : "Không thể tải workspace online");
  }, [onlineQueryError]);

  useEffect(() => {
    if (!onlinePersistenceEnabled || !onlineSession || onlineLoading || onlineStores.length > 0 || storageError) return;
    setStorageError("Tài khoản chưa được gán cửa hàng hoạt động. Hãy liên hệ quản trị viên.");
  }, [onlineLoading, onlineSession, onlineStores.length, storageError]);

  function expireOnlineSession(error: unknown) {
    invalidateOnlineMutationScope();
    setOnlineAuthRequired(true);
    setOnlineStoreId(null);
    setRecords([]);
    setSelected(new Set());
    setDialogOpen(false);
    queryClient.removeQueries({ queryKey: ["online", "history"] });
    setStorageError(sessionExpiryMessage(error));
  }

  useEffect(() => {
    if (!pilotPersistenceEnabled) return;
    let cancelled = false;

    async function hydrate() {
      try {
        const [storedRecords, health, storedProfile] = await Promise.all([loadPilotRecords(), readStorageHealth(), loadPilotStoreProfile()]);
        if (cancelled) return;
        const hydrated = storedRecords.map((record) => hydratePilotRecord(record, ownedPhotoUrls.current));
        setRecords(hydrated);
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
    if (!storeConfigured) {
      setNotice(onlinePersistenceEnabled
        ? "Không có cửa hàng hợp lệ trong phiên đăng nhập. Hãy đăng nhập lại hoặc liên hệ quản trị viên."
        : "Thiết lập tên và mã cửa hàng trước khi tạo phiếu.");
      if (!onlinePersistenceEnabled) setStoreSettingsOpen(true);
      return;
    }
    setCreateKind(kind);
    setDialogOpen(true);
  }

  function retryOnlineWorkspace() {
    invalidateOnlineMutationScope();
    setOnlineAuthRequired(false);
    setOnlineStoreId(null);
    setRecords([]);
    setSelected(new Set());
    if (supportsIdentityApi) {
      void queryClient.invalidateQueries({ queryKey: onlineSessionQueryKey });
    } else {
      setOnlineReload((attempt) => attempt + 1);
    }
  }

  function changeOnlineStore(storeId: string) {
    if (!onlineStores.some(({ id }) => id === storeId) || storeId === onlineStoreId) return;
    invalidateOnlineMutationScope();
    setOnlineStoreId(storeId);
    setRecords([]);
    setSelected(new Set());
    setReviewingIds(new Set());
    setExpandedMobileRecords(new Set());
    setApprovalFilter("ALL");
    setRecordSort(null);
  }

  function openExport() {
    if (!storeConfigured) {
      setNotice(onlinePersistenceEnabled ? "Không có cửa hàng hợp lệ để xuất Excel." : "Thiết lập tên và mã cửa hàng trước khi xuất Excel.");
      if (!onlinePersistenceEnabled) setStoreSettingsOpen(true);
      return;
    }
    setExportError("");
    setExportOpen(true);
  }

  async function saveStoreSettings(profile: StoreProfile) {
    if (onlinePersistenceEnabled) return;
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

  function applyDateFilterInputs(nextFromInput: string, nextToInput: string) {
    const values = [nextFromInput.trim(), nextToInput.trim()];
    if (values.some((value) => value && value.length < 10)) {
      setDateFilterError("");
      return;
    }

    try {
      const detectedFrom = values[0] ? parseDisplayDate(values[0]) : undefined;
      const detectedTo = values[1] ? parseDisplayDate(values[1]) : undefined;
      if (detectedFrom && detectedTo && detectedFrom > detectedTo) {
        setDateFilterError("Từ ngày không được sau đến ngày.");
        return;
      }
      setDateFilter({
        ...(detectedFrom ? { detectedFrom } : {}),
        ...(detectedTo ? { detectedTo } : {}),
      });
      setDateFilterError("");
      setSelected(new Set());
    } catch {
      setDateFilterError("Nhập ngày hợp lệ theo định dạng dd/mm/yyyy.");
    }
  }

  function changeDateFromInput(value: string) {
    setDateFromInput(value);
    applyDateFilterInputs(value, dateToInput);
  }

  function changeDateToInput(value: string) {
    setDateToInput(value);
    applyDateFilterInputs(dateFromInput, value);
  }

  function clearDateFilter() {
    setDateFromInput("");
    setDateToInput("");
    setDateFilter({});
    setDateFilterError("");
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

  async function updateApproval(recordId: string, status: ApprovalStatus) {
    if (onlinePersistenceEnabled) {
      if (!canManageOnline || !onlineStoreId || !onlineCapabilities?.reviewRecord) return;
      setReviewingIds((current) => new Set([...current, recordId]));
      try {
        const reviewed = await onlineCapabilities.reviewRecord(onlineStoreId, recordId, status);
        setRecords((current) => current.map((record) => record.id === recordId ? reviewed : record));
        queryClient.setQueryData<readonly RecordView[]>(onlineHistoryKey, (current) => current?.map((record) => record.id === recordId ? reviewed : record));
        setSelected((current) => new Set([...current].filter((id) => id !== recordId)));
        setNotice(`Đã chuyển phiếu ${recordId} sang “${approvalLabels[status]}” trên máy chủ.`);
      } catch (error) {
        if (isSessionExpiryError(error)) expireOnlineSession(error);
        else setNotice(error instanceof Error ? error.message : "Không thể cập nhật trạng thái duyệt trên máy chủ");
      } finally {
        setReviewingIds((current) => new Set([...current].filter((id) => id !== recordId)));
      }
      return;
    }
    setReviewingIds((current) => new Set([...current, recordId]));
    try {
      if (pilotPersistenceEnabled) await patchPilotRecords([recordId], { approvalStatus: status });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu trạng thái duyệt trên thiết bị");
      return;
    } finally {
      setReviewingIds((current) => new Set([...current].filter((id) => id !== recordId)));
    }
    setSelected((current) => {
      const next = new Set(current);
      next.delete(recordId);
      return next;
    });
    setRecords((current) => current.map((record) => record.id === recordId ? { ...record, approvalStatus: status } : record));
    setNotice(`Đã chuyển phiếu ${recordId} sang “${approvalLabels[status]}” ${pilotPersistenceEnabled ? "trên thiết bị này" : "trong dữ liệu demo"}.`);
  }

  async function approveSelected() {
    if (onlinePersistenceEnabled) {
      if (!canManageOnline || !onlineStoreId || !onlineCapabilities?.reviewRecord) return;
      const recordIds = [...selected];
      setReviewingIds(new Set(recordIds));
      try {
        const reviewedRecords = await Promise.all(recordIds.map((recordId) => onlineCapabilities.reviewRecord!(onlineStoreId, recordId, "APPROVED")));
        const byId = new Map(reviewedRecords.map((record) => [record.id, record]));
        setRecords((current) => current.map((record) => byId.get(record.id) ?? record));
        queryClient.setQueryData<readonly RecordView[]>(onlineHistoryKey, (current) => current?.map((record) => byId.get(record.id) ?? record));
        setNotice(`Đã duyệt ${recordIds.length} phiếu trên máy chủ.`);
        setSelected(new Set());
      } catch (error) {
        void queryClient.invalidateQueries({ queryKey: ["online", "history"] });
        if (isSessionExpiryError(error)) expireOnlineSession(error);
        else setNotice(error instanceof Error ? error.message : "Không thể duyệt các phiếu đã chọn");
      } finally {
        setReviewingIds(new Set());
      }
      return;
    }
    const recordIds = [...selected];
    setReviewingIds(new Set(recordIds));
    try {
      if (pilotPersistenceEnabled) await patchPilotRecords(recordIds, { approvalStatus: "APPROVED" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu trạng thái duyệt trên thiết bị");
      return;
    } finally {
      setReviewingIds(new Set());
    }
    setRecords((current) => current.map((record) => recordIds.includes(record.id) ? { ...record, approvalStatus: "APPROVED" } : record));
    setNotice(`Đã duyệt ${recordIds.length} phiếu ${pilotPersistenceEnabled ? "trên thiết bị này" : "trong dữ liệu demo"}.`);
    setSelected(new Set());
  }

  function toggleTrashMode() {
    if (onlinePersistenceEnabled) return;
    setTrashMode((current) => !current);
    setSelected(new Set());
    setExpandedMobileRecords(new Set());
    setApprovalFilter("ALL");
    setRecordSort(null);
  }

  function requestDelete(recordId: string) {
    if (onlinePersistenceEnabled) {
      setNotice("Store PWA online không cho xóa hoặc vô hiệu hóa phiếu.");
      return;
    }
    setDeleteIds([recordId]);
  }

  function requestDeleteSelected() {
    if (onlinePersistenceEnabled) {
      setNotice("Store PWA online không cho xóa hoặc vô hiệu hóa phiếu.");
      return;
    }
    setDeleteIds(selectedRecords.map(({ id }) => id));
  }

  async function confirmDelete() {
    if (onlinePersistenceEnabled) return;
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
    if (onlinePersistenceEnabled) return;
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
    if (onlinePersistenceEnabled) return;
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
    if (!storeConfigured) throw new Error("Thiết lập tên và mã cửa hàng trước khi tạo phiếu.");
    if (onlinePersistenceEnabled) {
      if (!onlineCapabilities?.createRecord || !onlineStoreId) throw new Error("Không có phiên đăng nhập hợp lệ.");
      const mutationScope: OnlineMutationScope = {
        generation: onlineMutationScopeRef.current.generation,
        storeId: onlineStoreId,
        userId: onlineSession?.user.id ?? null,
      };
      try {
        const created = await onlineCapabilities.createRecord(onlineStoreId, draft);
        if (!isOnlineMutationScopeCurrent(mutationScope)) return;
        setRecords((current) => [created, ...current]);
        queryClient.setQueryData<readonly RecordView[]>(onlineHistoryKey, (current) => [created, ...(current ?? [])]);
        setActiveKind(draft.kind);
        setSelected(new Set([created.id]));
        setNotice(`Đã tạo phiếu ${created.id} và lưu trên máy chủ.`);
      } catch (error) {
        if (!isOnlineMutationScopeCurrent(mutationScope)) return;
        if (isSessionExpiryError(error)) expireOnlineSession(error);
        throw error;
      }
      return;
    }
    const dateDigits = draft.detectedDate.split("/").reverse().join("").slice(2);
    const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const id = `KPH-${dateDigits}-${uuid.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
    const photos = draft.photos.map(({ id: photoId, fileName, blob }) => {
      const src = URL.createObjectURL(blob);
      ownedPhotoUrls.current.add(src);
      return { id: photoId, src, alt: `Ảnh minh chứng ${fileName} đã đóng tem`, blob, fileName };
    });
    const record: RecordView = {
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
    setActiveKind(draft.kind);
    setSelected(new Set([id]));
    setNotice(`Đã tạo phiếu ${id} và lưu trên thiết bị này.`);
  }

  async function exportSelected() {
    if (!selectedRecords.length) return;
    if (!storeConfigured) {
      setExportOpen(false);
      setNotice("Thiết lập tên và mã cửa hàng trước khi xuất Excel.");
      setStoreSettingsOpen(true);
      return;
    }
    setExporting(true);
    setExportError("");
    try {
      let exportRecords = selectedRecords;
      if (onlinePersistenceEnabled) {
        if (!onlineStoreId || !onlineCapabilities?.prepareExport) {
          throw new Error("Gateway xuất Excel online chưa sẵn sàng.");
        }
        exportRecords = (await onlineCapabilities.prepareExport(
          onlineStoreId,
          activeKind,
          selectedRecords.map(({ id }) => id),
        )).records;
      }
      const fileName = await downloadKphWorkbook(activeKind, exportRecords, storeProfile);
      if (pilotPersistenceEnabled) await recordPilotExport(activeKind, selectedRecords, fileName);
      setExportOpen(false);
      setNotice(`Đã tạo file Excel gồm ${exportRecords.length} phiếu ${kindCopy[activeKind].short}; hãy gửi file này cho CHT.`);
    } catch (error) {
      if (isSessionExpiryError(error)) expireOnlineSession(error);
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

  const emptyHistoryMessage = onlinePersistenceEnabled
    ? onlineLoading ? "Đang tải lịch sử từ máy chủ…" : storageError ? "Chưa tải được lịch sử phiếu." : "Chưa có phiếu nào trên máy chủ."
    : storageReady ? (trashMode ? "Thùng rác đang trống." : "Chưa có phiếu nào được lưu trên thiết bị này.") : "Đang mở dữ liệu trên thiết bị…";

  const recordActions: RecordActions | undefined = onlinePersistenceEnabled
    ? canManageOnline ? { approve: updateApproval, busyIds: reviewingIds } : undefined
    : { approve: updateApproval, busyIds: reviewingIds, remove: requestDelete, restore: restoreRecord };
  const workspaceError = logoutMutation.isError && !isSessionExpiryError(logoutMutation.error)
    ? "Chưa xác nhận được đăng xuất. Hãy thử đăng xuất lại."
    : storageError;
  const onlineLoginAvailable = onlinePersistenceEnabled && Boolean(onlineCapabilities?.login);

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

      {onlineLoginAvailable && !onlineSession ? (
        onlineLoading ? (
          <main className="online-login-panel" aria-busy="true">
            <p className="online-login-copy" role="status">Đang mở cửa hàng của bạn…</p>
          </main>
        ) : (
          <OnlineLoginPanel
            busy={loginMutation.isPending}
            error={storageError}
            onSubmit={(username, password) => loginMutation.mutate({ username, password })}
          />
        )
      ) : <main className="workspace-layout mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7">
        <section className={cn("history-board", trashMode && "is-trash-mode")} aria-labelledby="workspace-title">
          <div className="workspace-header">
            <div className="workspace-header-meta">
              <h1 id="workspace-title">Theo dõi hàng không phù hợp</h1>
              <p>Khai báo và tra cứu phiếu tại cửa hàng</p>
            </div>

            <div className="workspace-actions" aria-label="Tạo phiếu theo loại thực phẩm">
              {kphKinds.map((kind) => (
                <button key={kind} type="button" disabled={!storageReady || onlineLoading || (onlinePersistenceEnabled && !storeConfigured)} className={cn("workspace-create", kind === "TPCN" ? "workspace-create-tpcn" : "workspace-create-tpts")} onClick={() => openCreate(kind)}>
                  {kind === "TPCN" ? <PackagePlus aria-hidden="true" /> : <Salad aria-hidden="true" />}
                  <span><small>Tạo phiếu</small>{kindCopy[kind].action}</span>
                </button>
              ))}
            </div>

            <StoreContext
              storeLabel={onlinePersistenceEnabled && !storeConfigured ? "Chưa có cửa hàng" : storeIdentity(storeProfile)}
              actorLabel={onlinePersistenceEnabled && !storeConfigured ? (onlineLoading ? "Đang tải phiên đăng nhập…" : onlineSession ? "Tài khoản chưa có cửa hàng" : "Chưa có phiên đăng nhập") : actorIdentity(storeProfile)}
              storageLabel={onlinePersistenceEnabled ? "dữ liệu: máy chủ" : storageReady ? storageUsageLabel(storageHealth) : "dữ liệu: đang mở…"}
              storageHint={onlinePersistenceEnabled ? "Phiếu được lưu trên máy chủ" : storageHealth.persistent ? "Dữ liệu pilot được trình duyệt cấp chế độ lưu bền" : "Dữ liệu pilot chỉ nằm trên thiết bị này và không đồng bộ"}
              disabled={!storageReady || (onlinePersistenceEnabled && !onlineSession)}
              onConfigure={onlinePersistenceEnabled ? undefined : () => setStoreSettingsOpen(true)}
              storeOptions={onlinePersistenceEnabled ? onlineStores : undefined}
              selectedStoreId={onlinePersistenceEnabled ? onlineStoreId : undefined}
              onStoreChange={onlinePersistenceEnabled ? changeOnlineStore : undefined}
              onLogout={onlinePersistenceEnabled && onlineSession ? () => logoutMutation.mutate() : undefined}
              loggingOut={logoutMutation.isPending}
            />
          </div>
          {workspaceError ? <div className="storage-error-banner" role="alert">
            <p>{workspaceError}</p>
            {onlinePersistenceEnabled ? <Button variant="ghost" disabled={loginMutation.isPending || logoutMutation.isPending} onClick={retryOnlineWorkspace}>Thử tải lại</Button> : null}
          </div> : null}
          <header className="history-header">
            <div className="history-title-row pr-3">
              <div className="history-title-group">
                <h2 id="history-title" className="history-title">
                  <span className="history-total-count" aria-label={`${visibleRecords.length} phiếu`}>{visibleRecords.length}</span>
                  {trashMode ? "Phiếu đã xoá" : "Phiếu đã khai báo"}
                </h2>
                {onlinePersistenceEnabled
                  ? <span className="text-xs font-semibold text-ink-muted">Dữ liệu: máy chủ</span>
                  : <PilotDataNotice configured={storeConfigured} warning={storageWarning} onConfigure={() => setStoreSettingsOpen(true)} />}
              </div>
              <div className="history-title-actions">
                <MobileHistoryControls
                  dateFilterActive={dateFilterActive}
                  dateFilterError={dateFilterError}
                  dateFromInput={dateFromInput}
                  dateToInput={dateToInput}
                  filter={approvalFilter}
                  filterInitialMonth={filterInitialMonth}
                  onDateFilterClear={clearDateFilter}
                  onDateFromChange={changeDateFromInput}
                  onDateToChange={changeDateToInput}
                  onFilterChange={changeApprovalFilter}
                  onSort={cycleMobileRecordSort}
                  onSortReset={() => setRecordSort(null)}
                  sort={recordSort}
                />
                  {!onlinePersistenceEnabled ? <button
                    type="button"
                    className="trash-mode-toggle"
                    aria-label={trashMode ? "Quay lại phiếu đã khai báo" : `Mở thùng rác, có ${deletedIds.size} phiếu`}
                    aria-pressed={trashMode}
                    title={trashMode ? "Quay lại phiếu đã khai báo" : "Mở thùng rác"}
                    onClick={toggleTrashMode}
                  >
                    <History aria-hidden="true" />
                    <span className="trash-mode-label">Phiếu đã xoá</span>
                  </button> : null}
              </div>
            </div>

            <HistoryDateFilter
              active={dateFilterActive}
              className="history-date-filter-desktop"
              error={dateFilterError}
              fromValue={dateFromInput}
              idPrefix="history-date"
              initialMonth={filterInitialMonth}
              onClear={clearDateFilter}
              onFromValueChange={changeDateFromInput}
              onToValueChange={changeDateToInput}
              toValue={dateToInput}
            />

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
                    {selected.size > 0 && (!onlinePersistenceEnabled || canManageOnline)
                      ? trashMode
                        ? <button type="button" className="selection-count selection-approve selection-restore" onClick={restoreSelected}>Khôi phục <strong>{selected.size}</strong> phiếu</button>
                        : <button type="button" className="selection-count selection-approve" disabled={reviewingIds.size > 0} onClick={approveSelected}>{reviewingIds.size > 0 ? "Đang duyệt…" : <>Duyệt <strong>{selected.size}</strong> phiếu</>}</button>
                      : <span className="selection-count" aria-live="polite">Đã chọn <strong>{selected.size}</strong></span>}
                    <label className="select-all-history" aria-label="Chọn tất cả phiếu" title="Chọn tất cả">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Chọn tất cả phiếu" />
                    </label>
                  </div>
                  {selected.size > 0 && (!onlinePersistenceEnabled || canManageOnline) ? (
                    <div className={cn("history-action-tools", onlinePersistenceEnabled && "is-online")}>
                      <Button variant="primary" className="history-export" aria-label="Xuất Excel" title={onlinePersistenceEnabled && !selectedRecordsAreExportable ? "Chỉ xuất các phiếu đã duyệt" : "Xuất Excel"} disabled={onlinePersistenceEnabled && !selectedRecordsAreExportable} onClick={openExport}><FileDown size={17} aria-hidden="true" /><span className="history-export-label">Xuất Excel</span></Button>
                      {!onlinePersistenceEnabled ? <Button variant="ghost" className="history-delete" aria-label="Xóa phiếu đã chọn" title={trashMode ? "Không thể xoá vĩnh viễn" : "Chuyển sang trạng thái đã xoá"} disabled={trashMode} onClick={requestDeleteSelected}><Trash2 size={17} aria-hidden="true" /><span className="history-delete-label">Xóa</span></Button> : null}
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
                ? visibleRecords.map((record) => <RecordRow key={record.id} actions={recordActions} record={record} selected={selected.has(record.id)} trashMode={trashMode} onToggle={toggleSelection} />)
                : <tr><td className="empty-history-cell" colSpan={10}>{emptyHistoryMessage}</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 mobile-history">
            {visibleRecords.length > 0
              ? visibleRecords.map((record) => <RecordCard key={record.id} actions={recordActions} expanded={expandedMobileRecords.has(record.id)} record={record} selected={selected.has(record.id)} trashMode={trashMode} onExpansionChange={setMobileRecordExpanded} onToggle={toggleSelection} />)
              : <p className="empty-history-card">{emptyHistoryMessage}</p>}
          </div>
        </section>

        <div className="workspace-side-stack">
          <ExpiryWorkbench />
        </div>
      </main>}

      <CreateRecordDialog
        kind={createKind}
        open={dialogOpen}
        profile={storeProfile}
        actorReadOnly={onlinePersistenceEnabled}
        onlineMode={onlinePersistenceEnabled}
        onOpenChange={setDialogOpen}
        onSaved={saveCreatedRecord}
        onBarcodeLookup={onlinePersistenceEnabled && onlineCapabilities?.lookupBarcode && onlineStoreId
          ? (barcode) => onlineCapabilities.lookupBarcode!(onlineStoreId, barcode).catch((error) => {
            if (isSessionExpiryError(error)) expireOnlineSession(error);
            throw error;
          })
          : undefined}
      />
      {!onlinePersistenceEnabled ? <StoreSettingsDialog open={storeSettingsOpen} profile={storeProfile} onOpenChange={setStoreSettingsOpen} onSaved={saveStoreSettings} /> : null}

      {!onlinePersistenceEnabled ?
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
      : null}
      {!onlinePersistenceEnabled || canManageOnline ?
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
              <Button type="button" disabled={exporting || selectedRecords.length === 0 || !storeConfigured || (onlinePersistenceEnabled && !selectedRecordsAreExportable)} onClick={exportSelected}>
                {exporting ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Đang xuất…</> : <><FileDown size={17} aria-hidden="true" />Xuất {selectedRecords.length} dòng</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      : null}
      {notice ? <button type="button" className="notice-toast fixed bottom-20 left-1/2 z-40 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl" onClick={() => setNotice("")}>{notice}</button> : null}
      <PwaStatus />
    </div>
  );
}

type OnlineLoginPanelProps = {
  busy: boolean;
  error: string;
  onSubmit: (username: string, password: string) => void;
};

function OnlineLoginPanel({ busy, error, onSubmit }: OnlineLoginPanelProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return <main className="online-login-panel" aria-labelledby="online-login-title">
    <div className="online-login-card">
      <div className="online-login-heading"><span className="online-login-eyebrow">QUẢN LÝ PHIẾU KPH</span><h1 id="online-login-title">Đăng nhập Store PWA</h1></div>
      <p className="online-login-copy">Sử dụng tài khoản được cấp để khai báo hàng không phù hợp và xem phiếu của cửa hàng.</p>
      {error ? <p className="online-login-error" role="status">{error}</p> : null}
      <form className="online-login-form" onSubmit={(event) => {
        event.preventDefault();
        if (!username.trim() || !password || busy) return;
        onSubmit(username.trim(), password);
      }}>
        <label>
          <span>Tên đăng nhập</span>
          <input type="text" autoComplete="username" value={username} disabled={busy} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          <span>Mật khẩu</span>
          <input type="password" autoComplete="current-password" value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <Button type="submit" disabled={busy || !username.trim() || !password}>{busy ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" />Đang đăng nhập…</> : "Đăng nhập"}</Button>
      </form>
    </div>
  </main>;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
    || error instanceof Error && error.name === "AbortError";
}

function isSessionExpiryError(error: unknown) {
  return hasUnauthorizedStatus(error)
    || error instanceof Error && /phiên(?: đăng nhập)?[^.]*hết hạn|đăng nhập lại/i.test(error.message);
}

function sessionExpiryMessage(error: unknown) {
  if (hasUnauthorizedStatus(error)) return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.";
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.";
}

function hasUnauthorizedStatus(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && (error as { status?: unknown }).status === 401;
}

const appQueryClientDefaults = {
  queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: false },
};

export function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: appQueryClientDefaults }));
  return <QueryClientProvider client={queryClient}><WorkspaceApp /></QueryClientProvider>;
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

type HistoryDateFilterProps = {
  active: boolean;
  className?: string;
  error: string;
  fromValue: string;
  idPrefix: string;
  initialMonth: LocalDate;
  onClear: () => void;
  onFromValueChange: (value: string) => void;
  onToValueChange: (value: string) => void;
  showClear?: boolean;
  toValue: string;
};

function HistoryDateFilter({ active, className, error, fromValue, idPrefix, initialMonth, onClear, onFromValueChange, onToValueChange, showClear = true, toValue }: HistoryDateFilterProps) {
  const errorId = `${idPrefix}-error`;
  const fromId = `${idPrefix}-from`;
  const toId = `${idPrefix}-to`;
  const clearDisabled = !fromValue && !toValue && !active;

  return <div
    className={cn("history-date-filter", className)}
    role="group"
    aria-label="Lọc phiếu theo ngày phát hiện"
  >
    <label className="history-date-field" htmlFor={fromId}>
      <span className="sr-only">Từ ngày</span>
      <CalendarInput {...(error ? { ariaDescribedBy: errorId } : {})} id={fromId} initialMonth={initialMonth} invalid={Boolean(error)} label="Từ ngày phát hiện" placeholder="Từ" value={fromValue} onValueChange={onFromValueChange} />
    </label>
    <ArrowRight className="history-date-arrow" aria-hidden="true" />
    <label className="history-date-field" htmlFor={toId}>
      <span className="sr-only">Đến ngày</span>
      <CalendarInput {...(error ? { ariaDescribedBy: errorId } : {})} id={toId} initialMonth={initialMonth} invalid={Boolean(error)} label="Đến ngày phát hiện" placeholder="Đến" value={toValue} onValueChange={onToValueChange} />
    </label>
    {showClear ? <button type="button" className="history-date-clear" aria-label="Xóa lọc ngày" title="Xóa lọc ngày" disabled={clearDisabled} onClick={onClear}>
      <RotateCcw aria-hidden="true" /><span>Xóa</span>
    </button> : null}
    {error ? <p id={errorId} className="history-date-error" role="alert">{error}</p> : null}
  </div>;
}

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

type MobileHistoryControlsProps = Omit<HistoryControlsContentProps, "idPrefix"> & {
  dateFilterActive: boolean;
  dateFilterError: string;
  dateFromInput: string;
  dateToInput: string;
  filterInitialMonth: LocalDate;
  onDateFilterClear: () => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

function MobileHistoryControls({ dateFilterActive, dateFilterError, dateFromInput, dateToInput, filter, filterInitialMonth, onDateFilterClear, onDateFromChange, onDateToChange, onFilterChange, onSort, onSortReset, sort }: MobileHistoryControlsProps) {
  const [open, setOpen] = useState(false);
  const active = dateFilterActive || filter !== "ALL" || sort !== null;
  const dateClearDisabled = !dateFromInput && !dateToInput && !dateFilterActive;

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <HistoryControlsTrigger active={active} className="history-controls-mobile" label="Mở lọc và sắp xếp trên mobile" />
    </DialogTrigger>
    <DialogContent className="mobile-history-dialog" aria-describedby="mobile-history-dialog-description">
      <header className="mobile-history-dialog-header">
        <span className="mobile-history-dialog-icon" aria-hidden="true"><ListFilter /></span>
        <div>
          <DialogTitle className="mobile-history-dialog-title">Lọc &amp; sắp xếp</DialogTitle>
          <DialogDescription id="mobile-history-dialog-description" className="mobile-history-dialog-description">Ngày và các lựa chọn áp dụng ngay</DialogDescription>
        </div>
      </header>

      <div className="mobile-history-dialog-body">
        <section className="mobile-history-section" aria-labelledby="mobile-date-filter-title">
          <header className="mobile-history-section-header">
            <h3 id="mobile-date-filter-title">Ngày phát hiện</h3>
            <button type="button" className="mobile-history-section-reset" aria-label="Xóa lọc ngày" disabled={dateClearDisabled} onClick={onDateFilterClear}>
              <RotateCcw aria-hidden="true" /><span>Xóa</span>
            </button>
          </header>
          <HistoryDateFilter
            active={dateFilterActive}
            className="history-date-filter-mobile"
            error={dateFilterError}
            fromValue={dateFromInput}
            idPrefix="mobile-history-date"
            initialMonth={filterInitialMonth}
            onClear={onDateFilterClear}
            onFromValueChange={onDateFromChange}
            onToValueChange={onDateToChange}
            showClear={false}
            toValue={dateToInput}
          />
        </section>
        <HistoryControlsContent filter={filter} idPrefix="mobile" onFilterChange={onFilterChange} onSort={onSort} onSortReset={onSortReset} sort={sort} />
      </div>
    </DialogContent>
  </Dialog>;
}

function HistoryControlsContent({ filter, idPrefix, onFilterChange, onSort, onSortReset, showSort = true, sort }: HistoryControlsContentProps) {
  function toggleFilter(event: MouseEvent<HTMLButtonElement>, nextFilter: ApprovalStatus) {
    const clearing = filter === nextFilter;
    onFilterChange(clearing ? "ALL" : nextFilter);
    if (clearing && document.documentElement.dataset.focusModality !== "keyboard") event.currentTarget.blur();
  }

  return <>
        <section className="mobile-history-section" aria-labelledby={`${idPrefix}-filter-title`}>
          <header className="mobile-history-section-header">
            <h3 id={`${idPrefix}-filter-title`}>Trạng thái duyệt</h3>
            <button type="button" className="mobile-history-section-reset" aria-label="Bỏ lọc trạng thái duyệt" disabled={filter === "ALL"} onClick={() => onFilterChange("ALL")}>
              <RotateCcw aria-hidden="true" /><span>Bỏ lọc</span>
            </button>
          </header>
          <div className="mobile-history-choice-grid mobile-history-filter-grid" role="group" aria-label="Lọc theo trạng thái duyệt">
            {approvalFilterOptions.slice(1).map(({ label, value }) => {
              const selected = filter === value;
              return <button key={value} type="button" className={cn("mobile-history-choice mobile-history-filter-choice", `is-${value.toLowerCase()}`, selected && "is-selected")} aria-label={selected ? `Bỏ lọc ${label}` : `Lọc ${label}`} aria-pressed={selected} onClick={(event) => toggleFilter(event, value as ApprovalStatus)}>
                <span>{label}</span>
              </button>;
            })}
          </div>
        </section>

        {showSort ? <section className="mobile-history-section" aria-labelledby={`${idPrefix}-sort-title`}>
          <header className="mobile-history-section-header">
            <h3 id={`${idPrefix}-sort-title`}>Sắp xếp theo</h3>
            <button type="button" className="mobile-history-section-reset" aria-label="Bỏ sắp xếp" disabled={sort === null} onClick={onSortReset}>
              <RotateCcw aria-hidden="true" /><span>Bỏ sắp xếp</span>
            </button>
          </header>
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
      </>;
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
