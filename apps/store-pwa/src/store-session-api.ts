import { createKphApiClient, type components } from "@coopfood-kph/api";
import { createOnlineGateway, OnlineApiError } from "./online-kph";

export type StoreAccess = components["schemas"]["EffectiveStoreAccess"];
export function createStoreSessionGateway(options: { baseUrl?: string; fetch?: typeof globalThis.fetch } = {}) {
  const identity = createOnlineGateway(options);
  const client = createKphApiClient(options);
  return {
    getSession: identity.getSession,
    login: identity.login,
    logout: identity.logout,
    changePassword: identity.changePassword,
    lookupBarcode: identity.lookupBarcode,
    async listStoreAccess(signal?: AbortSignal): Promise<StoreAccess[]> {
      const result = await client.GET("/api/v1/me/store-access", { ...(signal ? { signal } : {}), cache: "no-store" });
      if (!result.data || result.error) throw new OnlineApiError("Không thể tải quyền cửa hàng.", result.response.status);
      return result.data;
    },
  };
}
export type StoreSessionGateway = ReturnType<typeof createStoreSessionGateway>;
