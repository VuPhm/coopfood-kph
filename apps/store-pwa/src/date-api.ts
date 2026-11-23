import { createKphApiClient, type components, type KphApiClientOptions, type operations } from "@coopfood-kph/api";
import { OnlineApiError } from "./online-kph";

export type DateLot = components["schemas"]["DateLot"];
export type DateLotInput = components["schemas"]["DateLotCreateRequest"];
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
  return {
    async listStores(signal: AbortSignal) {
      return read(await client.GET("/api/v1/date/stores", { signal, cache: "no-store" }), "Chưa tải được quyền DATE.");
    },
    async list(storeId: string, query: DateFilters, signal: AbortSignal) {
      const wireQuery = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)) as NonNullable<operations["listDateLots"]["parameters"]["query"]>;
      return read(await client.GET("/api/v1/stores/{storeId}/date-lots", { params: { path: { storeId }, query: wireQuery }, signal, cache: "no-store" }), "Chưa tải được danh sách lô DATE.");
    },
    async detail(storeId: string, lotId: string, signal: AbortSignal) {
      return read(await client.GET("/api/v1/stores/{storeId}/date-lots/{lotId}", { params: { path: { storeId, lotId } }, signal, cache: "no-store" }), "Chưa tải được chi tiết lô DATE.");
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
    async suggest(storeId: string, q: string, signal: AbortSignal) {
      return read(await client.GET("/api/v1/stores/{storeId}/date-sku-suggestions", {
        params: { path: { storeId }, query: { q } }, signal, cache: "no-store",
      }), "Chưa tải được gợi ý mã hàng.");
    },
  };
}

export type DateApi = ReturnType<typeof createDateApi>;
