import type { KphKind } from "@coopfood-kph/kph-rules";
import type { DemoApprovalStatus, DemoRecord } from "./demo-records";

export const REMEMBERED_SKU_FIELDS = ["productName", "supplier"] as const;
export type RememberedSkuField = typeof REMEMBERED_SKU_FIELDS[number];
export type RememberedSkuInfo = { productName: string; supplier: string };
export type SkuMemory = ReadonlyMap<string, RememberedSkuInfo>;
export const EMPTY_SKU_MEMORY: SkuMemory = new Map();

export function skuMemoryKey(kind: KphKind, barcode: string) {
  if ((kind !== "TPCN" && kind !== "TPTS") || typeof barcode !== "string") return null;
  const code = barcode.trim();
  if (!code || code === "NHẬP TAY" || code.length > 50) return null;
  // Match the complete identifier, including leading zeros and weight digits.
  return `${kind}:${code}`;
}

type MemorySource = Pick<DemoRecord, "id" | "kind" | "sku" | "productName" | "supplier" | "createdAt" | "approvalStatus">;

export function buildSkuMemory(
  records: readonly MemorySource[],
  deletedIds: ReadonlySet<string>,
  approvalByRecord: Readonly<Record<string, DemoApprovalStatus>>,
): SkuMemory {
  const memory = new Map<string, RememberedSkuInfo>();
  const timestamps = new Map<string, number>();
  for (const record of records) {
    if (deletedIds.has(record.id) || (approvalByRecord[record.id] ?? record.approvalStatus) === "REJECTED") continue;
    const key = skuMemoryKey(record.kind, record.sku);
    if (!key) continue;
    const parsed = Date.parse(record.createdAt ?? "");
    const timestamp = Number.isFinite(parsed) ? parsed : 0;
    if (timestamps.has(key) && timestamps.get(key)! >= timestamp) continue;
    const name = typeof record.productName === "string" ? record.productName.trim() : "";
    const supplier = typeof record.supplier === "string" ? record.supplier.trim() : "";
    // Do not learn generated display placeholders or invalid legacy field lengths.
    memory.set(key, {
      productName: name === `Sản phẩm ${record.sku.trim()}` || name.length > 200 ? "" : name,
      supplier: supplier === "Chưa nhập nhà cung cấp" || supplier.length > 150 ? "" : supplier,
    });
    timestamps.set(key, timestamp);
  }
  return memory;
}
