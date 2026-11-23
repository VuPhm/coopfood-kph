import { createKphApiClient, type components, type KphApiClientOptions, type operations } from "@coopfood-kph/api";
import { OnlineApiError } from "./online-kph";
import { readFileBytes } from "./online-kph";
import type { CreatedRecordDraft } from "./create-record-dialog";

export type DateLot = components["schemas"]["DateLot"];
export type DateLotInput = components["schemas"]["DateLotCreateRequest"];
export type DateLotDetail = components["schemas"]["DateLotDetail"];
export type DateFilters = Omit<NonNullable<operations["listDateLots"]["parameters"]["query"]>, "phase"> & {
  phase?: NonNullable<operations["listDateLots"]["parameters"]["query"]>["phase"] | undefined;
};

function read<T>(result: { data?: T; response: Response; error?: { code?: string } }, message: string): T {
  if (!result.response.ok || result.data === undefined) {
    throw new OnlineApiError(message, result.response.status, result.error?.code);
  }
  return result.data;
}

export function createDateApi(options: KphApiClientOptions = {}) {
  const client = createKphApiClient(options);
  const signatureToKey = new Map<string, string>();
  const keyToSignature = new Map<string, string>();
  return {
    async listStores(signal: AbortSignal) {
      return read(await client.GET("/api/v1/date/stores", { signal, cache: "no-store" }), "Chưa tải được quyền DATE.");
    },
    async list(storeId: string, query: DateFilters, signal: AbortSignal) {
      const wireQuery = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) as NonNullable<operations["listDateLots"]["parameters"]["query"]>;
      return read(await client.GET("/api/v1/stores/{storeId}/date-lots", { params: { path: { storeId }, query: wireQuery }, signal, cache: "no-store" }), "Chưa tải được danh sách lô DATE.");
    },
    async detail(storeId: string, lotId: string, signal: AbortSignal) {
      return read(await client.GET("/api/v1/stores/{storeId}/date-lots/{lotId}", { params: { path: { storeId, lotId } }, signal, cache: "no-store" }), "Chưa tải được chi tiết lô DATE.") as DateLotDetail;
    },
    async create(storeId: string, body: DateLotInput, key: string, csrf: string) {
      return read(await client.POST("/api/v1/stores/{storeId}/date-lots", {
        params: { path: { storeId }, header: { "X-CSRF-TOKEN": csrf, "Idempotency-Key": key } }, body,
      }), "Chưa thể lưu lô DATE. Kiểm tra thông tin rồi thử lại.");
    },
    async update(storeId: string, lotId: string, body: components["schemas"]["DateLotUpdateRequest"], csrf: string) {
      return read(await client.PATCH("/api/v1/stores/{storeId}/date-lots/{lotId}", {
        params: { path: { storeId, lotId }, header: { "X-CSRF-TOKEN": csrf } }, body,
      }), "Chưa thể sửa lô DATE. Kiểm tra thông tin rồi thử lại.");
    },
    async scheduleReminder(storeId: string, lotId: string, body: components["schemas"]["DateLotReminderRequest"], csrf: string) {
      return read(await client.PUT("/api/v1/stores/{storeId}/date-lots/{lotId}/reminder", {
        params: { path: { storeId, lotId }, header: { "X-CSRF-TOKEN": csrf } }, body,
      }), "Chưa thể hẹn lịch nhắc. Thử tải lại chi tiết lô.") as DateLotDetail;
    },
    async process(storeId: string, lot: DateLotDetail, draft: CreatedRecordDraft, csrf: string) {
      const payload: components["schemas"]["DateLotProcessingRequest"] = {
        expectedVersion: lot.version,
        kph: {
          type: draft.kind,
          detectedDate: draft.detectedDate.split("/").reverse().join("-"),
          processedDate: draft.treatmentDate.trim() ? draft.treatmentDate.split("/").reverse().join("-") : null,
          quantity: draft.quantityText ?? String(draft.quantity),
          unit: lot.unit,
          condition: draft.conditionValue,
          conditionDetail: draft.conditionDetail || null,
          resolution: draft.resolutionValue,
          resolutionDetail: draft.resolutionDetail || null,
          note: draft.note || null,
          photoLastModified: draft.photos.map(({ capturedAt }) => capturedAt.toISOString()),
        },
      };
      const form = new FormData();
      form.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      const encoder = new TextEncoder();
      const photoBytes: Uint8Array[] = [];
      const fileMetadata: Uint8Array[] = [];
      for (const { originalFile } of draft.photos) {
        const bytes = await readFileBytes(originalFile);
        photoBytes.push(new Uint8Array(bytes));
        fileMetadata.push(encoder.encode(`${originalFile.name}\0${originalFile.type}\0${originalFile.lastModified}\0${bytes.byteLength}`));
        form.append("photos", new Blob([bytes], { type: originalFile.type }), originalFile.name);
      }
      const chunks = [encoder.encode(`${storeId}\0${lot.id}\0`), encoder.encode(JSON.stringify(payload)), ...fileMetadata.flatMap((metadata, index) => [metadata, photoBytes[index]!])];
      const input = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.byteLength, 0));
      let offset = 0;
      for (const chunk of chunks) { input.set(chunk, offset); offset += chunk.byteLength; }
      const digest = globalThis.crypto?.subtle ? new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", input)) : null;
      const signature = digest ? Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("")
        : Array.from(input).reduce((hash, byte) => Math.imul(hash ^ byte, 16777619) >>> 0, 2166136261).toString(16);
      let idempotencyKey = signatureToKey.get(signature);
      if (!idempotencyKey) {
        const supplied = draft.idempotencyKey?.trim();
        idempotencyKey = supplied && (!keyToSignature.has(supplied) || keyToSignature.get(supplied) === signature)
          ? supplied : globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}-${Math.random()}`;
        signatureToKey.set(signature, idempotencyKey);
        keyToSignature.set(idempotencyKey, signature);
      }
      const result = await client.POST("/api/v1/stores/{storeId}/date-lots/{lotId}/kph", {
        params: { path: { storeId, lotId: lot.id }, header: { "X-CSRF-TOKEN": csrf, "Idempotency-Key": idempotencyKey } },
        body: form as never,
      });
      if (result.error || !result.data) {
        if (result.response.status === 409) throw new OnlineApiError("Lô DATE vừa được cập nhật. Phiếu chưa gửi; hãy đóng biểu mẫu, tải lại chi tiết rồi xử lý lại với lượng còn lại mới.", 409, result.error?.code);
        throw new OnlineApiError("Chưa xác nhận được lần xử lý DATE. Nội dung và ảnh vẫn được giữ.", result.response.status, result.error?.code);
      }
      return result.data;
    },
    async suggest(storeId: string, q: string, signal: AbortSignal) {
      return read(await client.GET("/api/v1/stores/{storeId}/date-sku-suggestions", {
        params: { path: { storeId }, query: { q } }, signal, cache: "no-store",
      }), "Chưa tải được gợi ý mã hàng.");
    },
  };
}

export type DateApi = ReturnType<typeof createDateApi>;
