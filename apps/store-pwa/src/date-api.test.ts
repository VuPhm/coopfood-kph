// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import type { components } from "@coopfood-kph/api";
import type { CreatedRecordDraft } from "./create-record-dialog";
import { createDateApi } from "./date-api";

describe("DATE partial processing API", () => {
  it("schedules a shared reminder with the current version and CSRF token", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id: "lot-1" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const api = createDateApi({ baseUrl: "http://localhost", fetch: fetcher });
    await api.scheduleReminder("store-1", "lot-1", { expectedVersion: 4, afterDays: 7 }, "csrf-token");
    const request = fetcher.mock.calls[0]![0] as Request;
    expect(request.method).toBe("PUT");
    expect(request.url).toBe("http://localhost/api/v1/stores/store-1/date-lots/lot-1/reminder");
    expect(request.headers.get("X-CSRF-TOKEN")).toBe("csrf-token");
    expect(await request.json()).toEqual({ expectedVersion: 4, afterDays: 7 });
  });

  it("keeps decimal text exact and sends only KPH fields with a source version", async () => {
    const receipt = { recordId: "record-1", quantity: "0.37525", unit: "kg", sourceVersion: 4,
      resultingVersion: 5, remainingAfter: "0.875", processedAt: "2026-11-23T04:00:00Z", actor: { id: "user-1", displayName: "Nhân viên" } };
    const committed = () => new Response(JSON.stringify(receipt), { status: 201, headers: { "Content-Type": "application/json" } });
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError("connection reset"))
      .mockResolvedValueOnce(committed()).mockResolvedValueOnce(committed());
    const api = createDateApi({ baseUrl: "http://localhost", fetch: fetcher });
    const lot = {
      id: "lot-1", storeId: "store-1", lookupStatus: "FOUND", barcode: "0000123", skuCode: "000045",
      productName: "Hàng thử", supplierCode: null, supplierName: null, lotCode: null,
      manufacturedOn: null, expiresOn: "2026-11-30", trackedQuantity: "1.25025", processedQuantity: "0",
      remainingQuantity: "1.25025", unit: "kg", processingStatus: "OPEN", version: 4,
      remindOn: null, reminderState: "NONE",
      createdBy: { id: "user-1", displayName: "Nhân viên" }, updatedBy: { id: "user-1", displayName: "Nhân viên" },
      createdAt: "2026-11-23T04:00:00Z", updatedAt: "2026-11-23T04:00:00Z", kphType: null, processingHistory: [],
    } satisfies components["schemas"]["DateLotDetail"];
    const draft: CreatedRecordDraft = {
      kind: "TPCN", detectedDate: "23/11/2026", barcode: "0000123", supplier: "", productName: "Hàng thử",
      quantity: 0.37525, quantityText: "0.37525", unit: "kg", condition: "Cận date", conditionValue: "NEAR_EXPIRY",
      conditionDetail: "", resolution: "HỦY", resolutionValue: "CANCEL", resolutionDetail: "", treatmentDate: "",
      detectedBy: "Nhân viên", note: "", idempotencyKey: "date-key-00000001", photos: [],
    };

    await expect(api.process("store-1", lot, draft, "csrf")).rejects.toThrow("connection reset");
    await api.process("store-1", lot, draft, "csrf");
    await api.process("store-1", lot, { ...draft, quantity: 0.5, quantityText: "0.5" }, "csrf");

    const request = fetcher.mock.calls[1]![0] as Request;
    const changedRequest = fetcher.mock.calls[2]![0] as Request;
    expect((fetcher.mock.calls[0]![0] as Request).headers.get("Idempotency-Key")).toBe(request.headers.get("Idempotency-Key"));
    expect(changedRequest.headers.get("Idempotency-Key")).not.toBe(request.headers.get("Idempotency-Key"));
    const form = await request.formData();
    const payload = JSON.parse(await (form.get("payload") as Blob).text());
    expect(request.url).toBe("http://localhost/api/v1/stores/store-1/date-lots/lot-1/kph");
    expect(request.headers.get("Idempotency-Key")).toBe("date-key-00000001");
    expect(payload).toEqual({ expectedVersion: 4, kph: {
      type: "TPCN", detectedDate: "2026-11-23", processedDate: null, quantity: "0.37525", unit: "kg",
      condition: "NEAR_EXPIRY", conditionDetail: null, resolution: "CANCEL", resolutionDetail: null,
      note: null, photoLastModified: [],
    } });
    expect(JSON.stringify(payload)).not.toContain("skuCode");
    expect(JSON.stringify(payload)).not.toContain("barcode");
  });
});
