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
});
