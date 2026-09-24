// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createOnlineGateway, OnlineApiError } from "./online-kph";

describe("online barcode lookup gateway", () => {
  it("keeps a catalog outage separate from a lookup miss and permits recovery", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "CATALOG_UNAVAILABLE", detail: "Catalog offline" }), {
        status: 503,
        headers: { "Content-Type": "application/problem+json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "NOT_FOUND", barcode: "000123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: "FOUND",
        barcode: "000123",
        product: {
          id: "product-1",
          barcode: "000123",
          skuCode: "SKU-001",
          name: "Sản phẩm kiểm thử",
          primarySupplier: { code: "NCC-001", name: "NCC kiểm thử" },
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const gateway = createOnlineGateway({ baseUrl: "http://localhost", fetch: fetcher });

    const outage = await gateway.lookupBarcode("store-1", "000123").catch((error: unknown) => error);
    expect(outage).toBeInstanceOf(OnlineApiError);
    expect(outage).toMatchObject({ status: 503, code: "CATALOG_UNAVAILABLE" });
    expect(await gateway.lookupBarcode("store-1", "000123")).toEqual({ status: "NOT_FOUND", barcode: "000123" });
    expect(await gateway.lookupBarcode("store-1", "000123")).toMatchObject({
      status: "FOUND", barcode: "000123", product: { name: "Sản phẩm kiểm thử" },
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    for (const [request] of fetcher.mock.calls) {
      const url = new URL((request as Request).url);
      expect(url.pathname).toBe("/api/v1/catalog/barcodes/000123");
      expect(url.searchParams.get("storeId")).toBe("store-1");
    }
  });
});
