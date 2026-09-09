import { createKphApiClient, type components } from "@coopfood-kph/api";
import { KPH_OPTIONS, resolveChoiceLabel } from "@coopfood-kph/kph-rules";

import type { CreatedRecordDraft } from "./create-record-dialog";
import type { EvidencePhotoView, RecordView } from "./record-view";

type Session = components["schemas"]["SessionResponse"];
type KphRecord = components["schemas"]["KphRecord"];

export type OnlineSession = Session;

export class OnlineApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "OnlineApiError";
    this.status = status;
    this.code = code;
  }
}

export type OnlineWorkspace = {
  session: Session;
  store: components["schemas"]["StoreContext"];
  records: RecordView[];
};

export type OnlineGateway = {
  getSession: (signal?: AbortSignal) => Promise<Session>;
  listStores: (signal?: AbortSignal) => Promise<components["schemas"]["StoreContext"][]>;
  loadHistory: (storeId: string, signal?: AbortSignal) => Promise<RecordView[]>;
  loadWorkspace: (signal?: AbortSignal) => Promise<OnlineWorkspace>;
  login: (username: string, password: string, signal?: AbortSignal) => Promise<Session>;
  logout: () => Promise<void>;
  createRecord: (storeId: string, draft: CreatedRecordDraft) => Promise<RecordView>;
  lookupBarcode: (storeId: string, barcode: string, signal?: AbortSignal) => Promise<components["schemas"]["BarcodeLookupResponse"]>;
};

export function onlineModeEnabled() {
  return import.meta.env.VITE_KPH_ONLINE === "true";
}

export function createOnlineGateway(options: { baseUrl?: string; fetch?: typeof globalThis.fetch } = {}): OnlineGateway {
  let csrfToken = "";
  const pendingCreates = new Map<string, string>();
  const keySignatures = new Map<string, string>();
  const client = createKphApiClient({ ...options, getCsrfToken: () => csrfToken });

  async function getSession(signal?: AbortSignal): Promise<Session> {
    const response = await client.GET("/api/v1/auth/session", signal ? { signal } : {});
    if (response.error || !response.data) throw apiError(response, "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.");
    csrfToken = response.data.csrfToken;
    return response.data;
  }

  async function listStores(signal?: AbortSignal) {
    const response = await client.GET("/api/v1/stores", signal ? { signal } : {});
    if (response.error || !response.data) throw apiError(response, "Không thể tải danh sách cửa hàng trong phiên đăng nhập.");
    return response.data;
  }

  async function loadHistory(storeId: string, signal?: AbortSignal) {
    const response = await client.GET("/api/v1/stores/{storeId}/kph", {
      params: { path: { storeId } },
      ...(signal ? { signal } : {}),
    });
    if (response.error || !response.data) throw apiError(response, "Không thể tải lịch sử phiếu KPH.");
    return response.data.map(toRecordView);
  }

  async function loadWorkspace(signal?: AbortSignal): Promise<OnlineWorkspace> {
    const session = await getSession(signal);
    const store = session.user.stores[0];
    if (!store) throw new Error("Tài khoản chưa được gán cửa hàng hoạt động.");
    return { session, store, records: await loadHistory(store.id, signal) };
  }

  async function login(username: string, password: string, signal?: AbortSignal): Promise<Session> {
    csrfToken = "";
    const response = await client.POST("/api/v1/auth/login", {
      body: { username, password },
      ...(signal ? { signal } : {}),
    });
    if (response.error || !response.data) throw apiError(response, "Tên đăng nhập hoặc mật khẩu không đúng.");
    csrfToken = response.data.csrfToken;
    return response.data;
  }

  async function logout() {
    try {
      const response = await client.POST("/api/v1/auth/logout", {
        params: { header: { "X-CSRF-TOKEN": csrfToken } },
      });
      if (response.error) throw apiError(response, "Không thể đăng xuất khỏi phiên hiện tại.");
    } finally {
      csrfToken = "";
      pendingCreates.clear();
      keySignatures.clear();
    }
  }

  async function createRecord(storeId: string, draft: CreatedRecordDraft) {
    const payload: components["schemas"]["KphCreateRequest"] = {
      type: draft.kind,
      detectedDate: displayDateToIso(draft.detectedDate),
      processedDate: draft.treatmentDate.trim() ? displayDateToIso(draft.treatmentDate) : null,
      quantity: draft.quantity,
      unit: draft.unit,
      condition: draft.conditionValue,
      conditionDetail: draft.conditionDetail || null,
      resolution: draft.resolutionValue,
      resolutionDetail: draft.resolutionDetail || null,
      barcode: draft.barcode || null,
      manualProductName: draft.productName || null,
      manualSupplierName: draft.supplier || null,
      note: draft.note || null,
      photoLastModified: draft.photos.map(({ capturedAt }) => capturedAt.toISOString()),
    };
    const form = new FormData();
    form.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    for (const { originalFile } of draft.photos) {
      // Rebuild the multipart part from the exact bytes so cross-realm File objects
      // (for example, an iOS/webview File handed to a fetch implementation) keep
      // their bytes and filename without relying on File prototype identity.
      const originalBytes = await readFileBytes(originalFile);
      form.append("photos", new Blob([originalBytes], { type: originalFile.type }), originalFile.name);
    }
    const signature = await createRequestSignature(storeId, payload, draft.photos.map(({ originalFile }) => originalFile));
    const suppliedKey = draft.idempotencyKey?.trim();
    const pendingKey = pendingCreates.get(signature);
    const suppliedKeySignature = suppliedKey ? keySignatures.get(suppliedKey) : undefined;
    const reusableSuppliedKey = suppliedKey
      && suppliedKey.length >= 16
      && suppliedKey.length <= 128
      && (suppliedKeySignature === undefined || suppliedKeySignature === signature)
      ? suppliedKey
      : undefined;
    const idempotencyKey = pendingKey
      ?? (reusableSuppliedKey ?? newIdempotencyKey());
    pendingCreates.set(signature, idempotencyKey);
    keySignatures.set(idempotencyKey, signature);
    const response = await client.POST("/api/v1/stores/{storeId}/kph", {
      params: {
        path: { storeId },
        header: {
          "X-CSRF-TOKEN": csrfToken,
          "Idempotency-Key": idempotencyKey,
        },
      },
      body: form as never,
    });
    if (response.error || !response.data) throw apiError(response, "Không thể lưu phiếu KPH.");
    pendingCreates.delete(signature);
    if (!reusableSuppliedKey) keySignatures.delete(idempotencyKey);
    return toRecordView(response.data);
  }

  async function lookupBarcode(storeId: string, barcode: string, signal?: AbortSignal) {
    const response = await client.GET("/api/v1/catalog/barcodes/{barcode}", {
      params: { path: { barcode }, query: { storeId } },
      ...(signal ? { signal } : {}),
    });
    if (response.error || !response.data) throw apiError(response, "Không thể tra cứu barcode lúc này.");
    return response.data as components["schemas"]["BarcodeLookupResponse"];
  }

  return { getSession, listStores, loadHistory, loadWorkspace, login, logout, createRecord, lookupBarcode };
}

function apiError(response: { error?: unknown; response?: Response }, fallback: string) {
  const error = response.error as { detail?: unknown; title?: unknown; status?: unknown; code?: unknown } | undefined;
  const status = typeof response.response?.status === "number"
    ? response.response.status
    : typeof error?.status === "number" ? error.status : undefined;
  const detail = status === 401
    ? fallback
    : typeof error?.detail === "string" ? error.detail : typeof error?.title === "string" ? error.title : fallback;
  const code = typeof error?.code === "string" ? error.code : undefined;
  return new OnlineApiError(detail, status, code);
}

export function isOnlineAuthError(error: unknown) {
  return error instanceof OnlineApiError && error.status === 401
    || typeof error === "object" && error !== null && "status" in error && (error as { status?: unknown }).status === 401;
}

function newIdempotencyKey() {
  const candidate = globalThis.crypto?.randomUUID?.();
  return candidate && candidate.length >= 16 ? candidate : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function createRequestSignature(
  storeId: string,
  payload: components["schemas"]["KphCreateRequest"],
  photos: readonly File[],
) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [encoder.encode(storeId), encoder.encode(JSON.stringify(payload))];
  for (const file of photos) {
    const bytes = new Uint8Array(await readFileBytes(file));
    chunks.push(encoder.encode(String(bytes.byteLength)), bytes);
  }
  const totalLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const input = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    input.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", input);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return fallbackHash(input);
}

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  if (typeof FileReader !== "undefined") {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error("Không thể đọc bytes ảnh minh chứng."));
      reader.readAsArrayBuffer(file);
    });
  }
  return new Response(file).arrayBuffer();
}

function fallbackHash(bytes: Uint8Array) {
  let first = 2166136261;
  let second = 2246822519;
  for (const byte of bytes) {
    first = Math.imul(first ^ byte, 16777619);
    second = Math.imul(second ^ byte, 3266489917);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

function toRecordView(record: KphRecord): RecordView {
  const options = KPH_OPTIONS[record.type];
  const photos: EvidencePhotoView[] = record.photos.map((photo) => ({
    id: `${record.id}-${photo.ordinal}`,
    src: photo.stampedContentPath,
    alt: `Ảnh minh chứng ${photo.ordinal} của phiếu ${record.id}`,
    fileName: `kph-${record.id}-${photo.ordinal}.jpg`,
  }));
  const condition = options.conditions.find(({ value }) => value === record.condition);
  const resolution = options.resolutions.find(({ value }) => value === record.resolution);
  return {
    id: record.id,
    kind: record.type,
    detectedDate: isoToDisplayDate(record.detectedDate),
    detectedBy: record.detectedBy.displayName,
    sku: record.catalogSnapshot.skuCode ?? record.barcode ?? "NHẬP TAY",
    productName: record.catalogSnapshot.productName ?? "Sản phẩm nhập tay",
    supplier: record.catalogSnapshot.supplierName ?? "Chưa nhập nhà cung cấp",
    quantity: `${record.quantity} ${record.unit}`,
    quantityValue: record.quantity,
    unit: record.unit,
    condition: condition ? resolveChoiceLabel(condition, record.conditionDetail ?? "") : record.condition,
    resolution: resolution ? resolveChoiceLabel(resolution, record.resolutionDetail ?? "") : record.resolution,
    treatmentDate: record.processedDate ? isoToDisplayDate(record.processedDate) : "",
    approvalStatus: "PENDING",
    photos,
    note: record.note ?? "",
    createdAt: record.createdAt,
    lastExportedAt: null,
  };
}

function displayDateToIso(value: string) {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

function isoToDisplayDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
