import { describe, expect, it } from "vitest";
import { DEMO_RECORDS, type DemoRecord } from "./demo-records";
import { buildSkuMemory, skuMemoryKey } from "./sku-memory";

function source(overrides: Partial<DemoRecord> = {}): DemoRecord {
  return { ...DEMO_RECORDS[0]!, id: "synthetic-a", sku: "000123", productName: "Hàng tổng hợp A", supplier: "NCC tổng hợp A", createdAt: "2026-10-21T01:00:00Z", ...overrides };
}

describe("local SKU memory", () => {
  it("keeps leading zeros, kind and the full barcode as the key", () => {
    const memory = buildSkuMemory([source()], new Set(), {});
    expect(memory.get(skuMemoryKey("TPCN", " 000123 ")!)).toEqual({ productName: "Hàng tổng hợp A", supplier: "NCC tổng hợp A" });
    expect(memory.has(skuMemoryKey("TPCN", "123")!)).toBe(false);
    expect(memory.has(skuMemoryKey("TPTS", "000123")!)).toBe(false);
  });

  it("selects the latest saved record, independent of history display order", () => {
    const older = source();
    const newer = source({ id: "synthetic-b", createdAt: "2026-10-21T02:00:00Z", productName: "Tên đã sửa", supplier: "NCC đã sửa" });
    for (const records of [[older, newer], [newer, older]]) {
      expect(buildSkuMemory(records, new Set(), {}).get("TPCN:000123")).toEqual({ productName: "Tên đã sửa", supplier: "NCC đã sửa" });
    }
  });

  it("does not merge an older name/NCC back after the latest saved value was cleared", () => {
    const memory = buildSkuMemory([source(), source({ id: "b", createdAt: "2026-10-21T02:00:00Z", productName: "Sản phẩm 000123", supplier: "Chưa nhập nhà cung cấp" })], new Set(), {});
    expect(memory.get("TPCN:000123")).toEqual({ productName: "", supplier: "" });
  });

  it("excludes trash and rejected records, including current approval overrides", () => {
    const records = [source({ id: "trash" }), source({ id: "rejected", approvalStatus: "REJECTED" }), source({ id: "override" })];
    expect(buildSkuMemory(records, new Set(["trash"]), { override: "REJECTED" }).size).toBe(0);
    expect(buildSkuMemory(records, new Set(), { rejected: "APPROVED" }).size).toBe(1);
  });

  it.each(["", "  ", "NHẬP TAY", "1".repeat(51)])("does not remember anonymous or invalid identifier %s", (sku) => {
    expect(buildSkuMemory([source({ sku })], new Set(), {}).size).toBe(0);
  });

  it("does not infer matching products from the prefix of variable weight barcodes", () => {
    const memory = buildSkuMemory([source({ kind: "TPTS", sku: "2912345612345" })], new Set(), {});
    expect(memory.has("TPTS:2912345612345")).toBe(true);
    expect(memory.has("TPTS:2912345602505")).toBe(false);
  });

  it("ignores overlong legacy fields and keeps only the valid field", () => {
    const memory = buildSkuMemory([source({ productName: "x".repeat(201), supplier: " NCC hợp lệ " })], new Set(), {});
    expect(memory.get("TPCN:000123")).toEqual({ productName: "", supplier: "NCC hợp lệ" });
  });

  it("uses the first record for legacy timestamp ties", () => {
    const legacy = source();
    delete legacy.createdAt;
    expect(buildSkuMemory([legacy, source({ createdAt: "invalid", productName: "Tên cũ" })], new Set(), {}).get("TPCN:000123")?.productName).toBe("Hàng tổng hợp A");
  });

  it("does not crash on missing legacy name/NCC metadata", () => {
    const malformed = { ...source(), productName: null, supplier: undefined } as unknown as DemoRecord;
    expect(buildSkuMemory([malformed], new Set(), {}).get("TPCN:000123")).toEqual({ productName: "", supplier: "" });
  });

  it("does not index a missing legacy code", () => {
    const malformed = { ...source(), sku: undefined } as unknown as DemoRecord;
    expect(buildSkuMemory([malformed], new Set(), {}).size).toBe(0);
  });

  it("builds a metadata-only index without reading photos for a large history", () => {
    const records = Array.from({ length: 1000 }, (_, i) => {
      const record = source({ id: `synthetic-${i}`, sku: `code-${i}` });
      Object.defineProperty(record, "photos", { get: () => { throw new Error("Must not read image data for memory"); } });
      return record;
    });
    const memory = buildSkuMemory(records, new Set(), {});
    expect(memory.size).toBe(1000);
    expect(Object.keys(memory.get("TPCN:code-999")!)).toEqual(["productName", "supplier"]);
  });
});

it("lists partial SKU matches with exact/prefix matches first and keeps food kinds separate", async () => {
  const { findSkuSuggestions } = await import("./sku-memory");
  const memory = new Map([
    ["TPCN:00123", { productName: "A", supplier: "NCC A" }],
    ["TPCN:00124", { productName: "B", supplier: "NCC B" }],
    ["TPCN:990012", { productName: "C", supplier: "NCC C" }],
    ["TPTS:00125", { productName: "D", supplier: "NCC D" }],
  ]);
  expect(findSkuSuggestions(memory, "TPCN", "0012").map(item => item.code)).toEqual(["00123", "00124", "990012"]);
  expect(findSkuSuggestions(memory, "TPCN", "00124").map(item => item.code)).toEqual(["00124"]);
  expect(findSkuSuggestions(memory, "TPCN", "")).toEqual([]);
  expect(findSkuSuggestions(memory, "TPCN", "missing")).toEqual([]);
});

it("suggests saved SKU codes even when name and supplier are empty display placeholders", async () => {
  const { findSkuSuggestions } = await import("./sku-memory");
  const memory = buildSkuMemory([source({ sku: "890001", productName: "Sản phẩm 890001", supplier: "Chưa nhập nhà cung cấp" })], new Set(), {});
  expect(findSkuSuggestions(memory, "TPCN", "89")).toEqual([{ code: "890001", productName: "", supplier: "" }]);
});

it("keeps the newest supplier for each distinct name as exact-SKU fallbacks", async () => {
  const { findSkuSuggestions } = await import("./sku-memory");
  const memory = buildSkuMemory([
    source({ productName: "A", supplier: "old", createdAt: "2026-01-01T00:00:00Z" }),
    source({ id: "b", productName: "B", supplier: "B supplier", createdAt: "2026-03-01T00:00:00Z" }),
    source({ id: "a-new", productName: "A", supplier: "latest A", createdAt: "2026-02-01T00:00:00Z" }),
  ], new Set(), {});
  expect(memory.get("TPCN:000123")).toEqual({ productName: "B", supplier: "B supplier" });
  expect(findSkuSuggestions(memory, "TPCN", "000123")).toEqual([
    { code: "000123", productName: "B", supplier: "B supplier" },
    { code: "000123", productName: "A", supplier: "latest A" },
  ]);
  expect(findSkuSuggestions(memory, "TPCN", "000")).toHaveLength(1);
});
