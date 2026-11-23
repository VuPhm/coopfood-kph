import { createKphApiClient, type components, type KphApiClientOptions } from "@coopfood-kph/api";
import { OnlineApiError } from "./online-kph";

export type ReportSummary = components["schemas"]["DateReportSummary"];
export type ReportCreate = components["schemas"]["DateReportCreate"];
export type ReportPreset = "all" | "attention" | "resolved";
export type ReportGateway = ReturnType<typeof createReportGateway>;

function read<T>(result: { data?: T; response: Response; error?: {code?:string} }): T {
  if (result.response.ok && result.data !== undefined) return result.data;
  const code = result.error?.code;
  const message = code === "DATE_REPORT_SOURCE_CHANGED" ? "Lô đã thay đổi. Vui lòng chọn lại lô để chốt báo cáo."
    : code === "DATE_REPORT_PERIOD_CLOSED" ? "Kỳ đã kết thúc. Hãy chọn kỳ hiện tại."
    : "Chưa hoàn tất yêu cầu báo cáo. Vui lòng thử lại.";
  throw new OnlineApiError(message, result.response.status, code);
}

export function createReportGateway(options: KphApiClientOptions = {}) {
  const client = createKphApiClient(options);
  return {
    async source(storeId: string, preset: ReportPreset, q: string, page: number, signal: AbortSignal) {
      return read(await client.GET("/api/v1/stores/{storeId}/date-reports/source", { signal, cache: "no-store",
        params: { path: { storeId }, query: { page, q, collection: preset === "resolved" ? "RESOLVED" : "ALL", attentionOnly: preset === "attention" } } }));
    },
    async create(storeId: string, body: ReportCreate, key: string, csrf: string) {
      return read(await client.POST("/api/v1/stores/{storeId}/date-reports", {
        params: { path: { storeId }, header: { "Idempotency-Key": key, "X-CSRF-TOKEN": csrf } }, body }));
    },
    async history(storeId: string, q: string, page: number, signal: AbortSignal) {
      return read(await client.GET("/api/v1/stores/{storeId}/date-reports", {
        params: { path: { storeId }, query: { q, page } }, signal, cache: "no-store" }));
    },
    async rows(storeId: string, reportId: string, page: number, signal: AbortSignal) {
      return read(await client.GET("/api/v1/stores/{storeId}/date-reports/{reportId}/rows", {
        params: { path: { storeId, reportId }, query: { page } }, signal, cache: "no-store" }));
    }
  };
}
