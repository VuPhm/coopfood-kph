import { describe, expect, it, vi } from "vitest";

import { createKphApiClient } from "./index";

describe("createKphApiClient", () => {
  it("keeps session credentials and adds CSRF to mutations", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const client = createKphApiClient({
      baseUrl: "http://localhost",
      fetch: fetcher,
      getCsrfToken: () => "token",
    });

    await client.POST("/api/v1/auth/logout", {
      params: { header: { "X-CSRF-TOKEN": "declared-token" } },
    });

    const [request] = fetcher.mock.calls[0] ?? [];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).credentials).toBe("include");
    expect((request as Request).headers.get("X-CSRF-TOKEN")).toBe("token");
  });

  it("returns typed problem responses without throwing away the payload", async () => {
    const client = createKphApiClient({
      baseUrl: "http://localhost",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ title: "Không hợp lệ", status: 401 }), {
          status: 401,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    });

    const result = await client.GET("/api/v1/auth/session", {});

    expect(result.error).toEqual(expect.objectContaining({ title: "Không hợp lệ", status: 401 }));
  });

  it("posts an exact membership username in the body and retains only the typed lookup result", async () => {
    const user = { id: "40000000-0000-4000-8000-000000000001", username: "member.demo", displayName: "Thành viên mẫu" };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    }));
    const client = createKphApiClient({ baseUrl: "http://localhost", fetch: fetcher, getCsrfToken: () => "session-csrf" });
    const storeId = "30000000-0000-4000-8000-000000000001";
    const { data } = await client.POST("/api/v1/admin/stores/{storeId}/membership-user-lookup", {
      params: { path: { storeId }, header: { "X-CSRF-TOKEN": "declared" } },
      body: { username: "member.demo" },
    });
    const request = fetcher.mock.calls[0]![0] as Request;
    expect(request.method).toBe("POST");
    expect(request.url).toBe(`http://localhost/api/v1/admin/stores/${storeId}/membership-user-lookup`);
    expect(request.url).not.toContain("member.demo");
    expect(request.headers.get("X-CSRF-TOKEN")).toBe("session-csrf");
    expect(request.credentials).toBe("include");
    expect(await request.json()).toEqual({ username: "member.demo" });
    expect(data).toEqual(user);
  });

  it("sends membership upsert and revoke with scoped paths, reasons and session CSRF", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({
      title: "Last manager", status: 409, code: "LAST_STORE_MANAGER_REQUIRED",
    }), { status: 409, headers: { "Content-Type": "application/problem+json" } }));
    const client = createKphApiClient({ baseUrl: "http://localhost", fetch: fetcher, getCsrfToken: () => "csrf" });
    const path = { storeId: "30000000-0000-4000-8000-000000000001", userId: "40000000-0000-4000-8000-000000000001" };
    const params = { path, header: { "X-CSRF-TOKEN": "declared" } };
    const upsert = await client.PUT("/api/v1/admin/stores/{storeId}/memberships/{userId}", {
      params, body: { role: "EMPLOYEE", reason: "Điều chỉnh phân công mẫu" },
    });
    const revoke = await client.POST("/api/v1/admin/stores/{storeId}/memberships/{userId}/revoke", {
      params, body: { reason: "Kết thúc phân công mẫu" },
    });
    expect(upsert.error?.code).toBe("LAST_STORE_MANAGER_REQUIRED");
    expect(revoke.error?.status).toBe(409);
    const requests = fetcher.mock.calls.map(([request]) => request as Request);
    expect(requests.map((request) => request.method)).toEqual(["PUT", "POST"]);
    expect(requests.map((request) => request.url)).toEqual([
      `http://localhost/api/v1/admin/stores/${path.storeId}/memberships/${path.userId}`,
      `http://localhost/api/v1/admin/stores/${path.storeId}/memberships/${path.userId}/revoke`,
    ]);
    for (const request of requests) {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("X-CSRF-TOKEN")).toBe("csrf");
    }
    expect(await requests[0]!.json()).toEqual({ role: "EMPLOYEE", reason: "Điều chỉnh phân công mẫu" });
    expect(await requests[1]!.json()).toEqual({ reason: "Kết thúc phân công mẫu" });
  });

});
