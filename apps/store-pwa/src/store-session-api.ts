import { createKphApiClient, type components } from "@coopfood-kph/api";
import { createOnlineGateway, OnlineApiError } from "./online-kph";

import { createDateApi } from "./date-api";

export type StoreAccess = components["schemas"]["KphStoreAccess"];
export function createStoreSessionGateway(options: { baseUrl?: string; fetch?: typeof globalThis.fetch } = {}) {
  const identity = createOnlineGateway(options);
  const client = createKphApiClient(options);
  return {
    date: createDateApi(options),
    getSession: identity.getSession,
    lookupBarcode: identity.lookupBarcode,
    loadHistory: identity.loadHistory,
    createRecord: identity.createRecord,
    reviewRecord: identity.reviewRecord,
    prepareExport: identity.prepareExport,
    login: identity.login,
    logout: identity.logout,
    changePassword: identity.changePassword,
    async listStoreAccess(signal?: AbortSignal): Promise<StoreAccess[]> {
      const result = await client.GET("/api/v1/kph/stores", { ...(signal ? { signal } : {}), cache: "no-store" });
      if (!result.data || result.error) throw new OnlineApiError("Không thể tải quyền cửa hàng.", result.response.status);
      return result.data;
    },
  };
}
export type StoreSessionGateway = ReturnType<typeof createStoreSessionGateway>;
