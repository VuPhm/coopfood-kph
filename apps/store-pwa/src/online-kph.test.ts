// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import sessionFixture from "../../../contracts/fixtures/api/session.json";
import recordFixture from "../../../contracts/fixtures/api/kph-record.json";

import { createOnlineGateway, onlineExportSelectionError, OnlineApiError } from "./online-kph";

function draft(file: File, idempotencyKey = "client-key-00000001") {
  return {
    kind: "TPCN" as const,
    detectedDate: "09/09/2026",
    barcode: "0890123456789",
    supplier: "NCC Demo",
    productName: "Sản phẩm thử nghiệm 01",
    quantity: 1,
    unit: "EA" as const,
    condition: "Cận date",
    conditionValue: "NEAR_EXPIRY" as const,
    conditionDetail: "",
    resolution: "HỦY",
    resolutionValue: "CANCEL" as const,
    resolutionDetail: "",
    treatmentDate: "",
    detectedBy: "Nguyễn Văn Demo",
    note: "",
    idempotencyKey,
    photos: [{
      id: "photo-1",
      fileName: file.name,
      blob: file,
      originalFile: file,
      capturedAt: new Date("2026-09-09T03:00:00.000Z"),
    }],
  };
}

function createdResponse() {
  return new Response(JSON.stringify(recordFixture), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

describe("online KPH gateway", () => {
  it("accepts 500 export rows and reports a clear limit at 501", () => {
    expect(onlineExportSelectionError(500)).toBeNull();
    expect(onlineExportSelectionError(501)).toBe("Chỉ có thể xuất tối đa 500 phiếu mỗi lần. Hãy giảm số phiếu đã chọn rồi thử lại.");
  });

  it("sends all 500 selected record IDs to the export endpoint", async () => {
    const recordIds = Array.from({ length: 500 }, (_, index) => `50000000-0000-4000-8000-${String(index).padStart(12, "0")}`);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      exportId: "50000000-0000-4000-8000-000000000999",
      exportedAt: "2026-09-16T08:00:00Z",
      store: recordFixture.store,
      records: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const gateway = createOnlineGateway({ baseUrl: "http://localhost", fetch: fetcher });

    await gateway.prepareExport(recordFixture.store.id, "TPCN", recordIds);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(await (fetcher.mock.calls[0]![0] as Request).json()).toEqual({ type: "TPCN", recordIds });
  });

  it("logs in, stores CSRF, and logs out with the authenticated session", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(sessionFixture), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const gateway = createOnlineGateway({ baseUrl: "http://localhost", fetch: fetcher });

    await gateway.login("demo", "password");
    await gateway.logout();

    const requests = fetcher.mock.calls.map(([request]) => request as Request);
    expect(requests).toHaveLength(2);
    const loginRequest = requests[0]!;
    const logoutRequest = requests[1]!;
    expect(loginRequest.method).toBe("POST");
    expect(await loginRequest.json()).toEqual({ username: "demo", password: "password" });
    expect(logoutRequest.method).toBe("POST");
    expect(logoutRequest.headers.get("X-CSRF-TOKEN")).toBe(sessionFixture.csrfToken);
  });

  it("retains CSRF for logout retry after a network failure", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(sessionFixture), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const gateway = createOnlineGateway({ baseUrl: "http://localhost", fetch: fetcher });
    await gateway.login("demo", "password");
    await expect(gateway.logout()).rejects.toThrow("network error");
    await gateway.logout();
    for (const [request] of fetcher.mock.calls.slice(1)) {
      expect((request as Request).headers.get("X-CSRF-TOKEN")).toBe(sessionFixture.csrfToken);
    }
  });

  it("keeps one idempotency key through a network failure and preserves original bytes", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("request timed out after commit"))
      .mockResolvedValueOnce(createdResponse());
    const gateway = createOnlineGateway({ baseUrl: "http://localhost", fetch: fetcher });
    const file = new File(["original bytes"], "evidence.jpg", { type: "image/jpeg" });
    const payload = draft(file);

    await expect(gateway.createRecord(sessionFixture.user.stores[0]!.id, payload)).rejects.toThrow("request timed out");
    await gateway.createRecord(sessionFixture.user.stores[0]!.id, payload);

    const firstRequest = fetcher.mock.calls[0]![0] as Request;
    const secondRequest = fetcher.mock.calls[1]![0] as Request;
    expect(firstRequest.headers.get("Idempotency-Key")).toBe(payload.idempotencyKey);
    expect(secondRequest.headers.get("Idempotency-Key")).toBe(firstRequest.headers.get("Idempotency-Key"));
    const form = await secondRequest.formData();
    const uploaded = form.get("photos");
    expect(uploaded).toBeInstanceOf(File);
    expect(await (uploaded as File).text()).toBe("original bytes");
  });

  it("allocates a new key when photo bytes or store scope changes", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("request timed out after commit"))
      .mockImplementation(() => Promise.resolve(createdResponse()));
    const gateway = createOnlineGateway({ baseUrl: "http://localhost", fetch: fetcher });
    const first = draft(new File(["first bytes"], "evidence.jpg", { type: "image/jpeg" }));
    const changedBytes = draft(new File(["second bytes"], "evidence.jpg", { type: "image/jpeg" }));

    await expect(gateway.createRecord("store-a", first)).rejects.toThrow("request timed out");
    await gateway.createRecord("store-a", changedBytes);
    await gateway.createRecord("store-b", changedBytes);

    const keys = fetcher.mock.calls.map(([request]) => (request as Request).headers.get("Idempotency-Key"));
    expect(new Set(keys).size).toBe(3);
    expect(keys[0]).toBe(first.idempotencyKey);
    expect(keys[1]).not.toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[1]);
  });

  it("exposes a typed authentication error for an expired session", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ status: 401, detail: "expired" }), {
      status: 401,
      headers: { "Content-Type": "application/problem+json" },
    }));
    const gateway = createOnlineGateway({ baseUrl: "http://localhost", fetch: fetcher });

    const error = await gateway.getSession().catch((value: unknown) => value);
    expect(error).toBeInstanceOf(OnlineApiError);
    expect((error as OnlineApiError).status).toBe(401);
    expect((error as Error).message).toContain("Phiên đăng nhập");
  });

  it("sends date bounds and manager review/export mutations with CSRF", async () => {
    const approvedRecord = {
      ...recordFixture,
      approvalStatus: "APPROVED" as const,
      reviewedBy: { id: sessionFixture.user.id, displayName: sessionFixture.user.displayName },
      reviewedAt: "2026-09-15T08:00:00Z",
    };
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(sessionFixture), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([recordFixture]), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(approvedRecord), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        exportId: "50000000-0000-4000-8000-000000000001",
        exportedAt: "2026-09-15T08:01:00Z",
        store: recordFixture.store,
        records: [approvedRecord],
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const gateway = createOnlineGateway({ baseUrl: "http://localhost", fetch: fetcher });

    await gateway.login("demo", "password");
    await gateway.loadHistory(recordFixture.store.id, { detectedFrom: "2026-09-01", detectedTo: "2026-09-15" });
    const reviewed = await gateway.reviewRecord(recordFixture.store.id, recordFixture.id, "APPROVED");
    const exported = await gateway.prepareExport(recordFixture.store.id, "TPCN", [recordFixture.id]);

    const requests = fetcher.mock.calls.map(([request]) => request as Request);
    expect(requests[1]!.url).toContain("detectedFrom=2026-09-01");
    expect(requests[1]!.url).toContain("detectedTo=2026-09-15");
    expect(requests[2]!.method).toBe("PUT");
    expect(requests[2]!.headers.get("X-CSRF-TOKEN")).toBe(sessionFixture.csrfToken);
    expect(await requests[2]!.json()).toEqual({ status: "APPROVED" });
    expect(requests[3]!.method).toBe("POST");
    expect(requests[3]!.headers.get("X-CSRF-TOKEN")).toBe(sessionFixture.csrfToken);
    expect(await requests[3]!.json()).toEqual({ type: "TPCN", recordIds: [recordFixture.id] });
    expect(reviewed.approvalStatus).toBe("APPROVED");
    expect(exported.store).toEqual(recordFixture.store);
    expect(exported.records[0]?.reviewedBy).toBe(sessionFixture.user.displayName);
  });
});
