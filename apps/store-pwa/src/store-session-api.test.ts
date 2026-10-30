import { describe, expect, it, vi } from "vitest";
import { createStoreSessionGateway } from "./store-session-api";
import { OnlineApiError } from "./online-kph";

describe("effective store discovery client", () => {
  it("uses the authenticated no-store endpoint and preserves string identifiers", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: "a", code: "0001", name: "A", kph: { view: true, create: true, review: false, export: false } }]), { headers: { "Content-Type": "application/json" } }));
    const api = createStoreSessionGateway({ baseUrl: "https://synthetic.test", fetch });
    expect((await api.listStoreAccess())[0]?.code).toBe("0001");
    const request = fetch.mock.calls[0]?.[0] as Request;
    expect(request.url).toBe("https://synthetic.test/api/v1/me/store-access");
    expect(request.credentials).toBe("include"); expect(request.cache).toBe("no-store");
  });
  it("propagates 401 to the login boundary and aborts with the caller", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 401, headers: { "Content-Type": "application/json" } }));
    const api = createStoreSessionGateway({ baseUrl: "https://synthetic.test", fetch });
    const controller = new AbortController();
    await expect(api.listStoreAccess(controller.signal)).rejects.toEqual(expect.objectContaining({ status: 401, name: "OnlineApiError" } as Partial<OnlineApiError>));
    controller.abort(); expect((fetch.mock.calls[0]?.[0] as Request).signal.aborted).toBe(true);
  });
});
