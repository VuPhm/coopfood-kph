import { createKphApiClient, type components } from "@coopfood-kph/api";
import { KPH_OPTIONS, resolveChoiceLabel } from "@coopfood-kph/kph-rules";

import type { CreatedRecordDraft } from "./create-record-dialog";
import type { EvidencePhotoView, RecordView } from "./record-view";

type Session = components["schemas"]["SessionResponse"];
type KphRecord = components["schemas"]["KphRecord"];

export type OnlineWorkspace = {
  session: Session;
  store: components["schemas"]["StoreContext"];
  records: RecordView[];
};

export function onlineModeEnabled() {
  return import.meta.env.VITE_KPH_ONLINE === "true";
}

export function createOnlineGateway() {
  let csrfToken = "";
  let pendingCreate: { signature: string; key: string } | null = null;
  const client = createKphApiClient({ getCsrfToken: () => csrfToken });

  async function loadWorkspace(): Promise<OnlineWorkspace> {
    const sessionResponse = await client.GET("/api/v1/auth/session");
    if (sessionResponse.error || !sessionResponse.data) {
      throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.");
    }
    csrfToken = sessionResponse.data.csrfToken;
    const store = sessionResponse.data.user.stores[0];
    if (!store) throw new Error("Tài khoản chưa được gán cửa hàng hoạt động.");
    const recordsResponse = await client.GET("/api/v1/stores/{storeId}/kph", {
      params: { path: { storeId: store.id } },
    });
    if (recordsResponse.error || !recordsResponse.data) throw new Error("Không thể tải lịch sử phiếu KPH.");
    return { session: sessionResponse.data, store, records: recordsResponse.data.map(toRecordView) };
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
    draft.photos.forEach(({ originalFile }) => form.append("photos", originalFile, originalFile.name));
    const signature = JSON.stringify(payload) + draft.photos.map(({ originalFile }) =>
      `${originalFile.name}:${originalFile.size}:${originalFile.lastModified}`).join("|");
    const idempotencyKey = draft.idempotencyKey ?? (pendingCreate?.signature === signature
      ? pendingCreate.key
      : globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    pendingCreate = { signature, key: idempotencyKey };
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
    if (response.error || !response.data) throw new Error(response.error?.detail ?? "Không thể lưu phiếu KPH.");
    pendingCreate = null;
    return toRecordView(response.data);
  }

  async function lookupBarcode(storeId: string, barcode: string) {
    const response = await client.GET("/api/v1/catalog/barcodes/{barcode}", {
      params: { path: { barcode }, query: { storeId } },
    });
    if (response.error || !response.data) throw new Error("Không thể tra cứu barcode lúc này.");
    return response.data as components["schemas"]["BarcodeLookupResponse"];
  }

  return { loadWorkspace, createRecord, lookupBarcode };
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
