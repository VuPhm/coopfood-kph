import type { KphKind } from "@coopfood-kph/kph-rules";
import type { DemoApprovalStatus, DemoRecord } from "./demo-records";

export const REMEMBERED_SKU_FIELDS = ["productName", "supplier"] as const;
export type RememberedSkuField = typeof REMEMBERED_SKU_FIELDS[number];
export type RememberedSkuInfo = { productName: string; supplier: string };
export type SkuMemory = ReadonlyMap<string, RememberedSkuInfo> & { readonly variants?: ReadonlyMap<string, readonly RememberedSkuInfo[]> };
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
  const variants = new Map<string, Map<string, { timestamp: number; info: RememberedSkuInfo }>>();
  for (const record of records) {
    if (deletedIds.has(record.id) || (approvalByRecord[record.id] ?? record.approvalStatus) === "REJECTED") continue;
    const key = skuMemoryKey(record.kind, record.sku);
    if (!key) continue;
    const parsed = Date.parse(record.createdAt ?? "");
    const timestamp = Number.isFinite(parsed) ? parsed : 0;
    const name = typeof record.productName === "string" ? record.productName.trim() : "";
    const supplier = typeof record.supplier === "string" ? record.supplier.trim() : "";
    // Do not learn generated display placeholders or invalid legacy field lengths.
    const info = {
      productName: name === `Sản phẩm ${record.sku.trim()}` || name.length > 200 ? "" : name,
      supplier: supplier === "Chưa nhập nhà cung cấp" || supplier.length > 150 ? "" : supplier,
    };
    let names = variants.get(key);
    if (!names) { names = new Map(); variants.set(key, names); }
    const previous = names.get(info.productName);
    if (!previous || timestamp > previous.timestamp) names.set(info.productName, { timestamp, info });
    if (!timestamps.has(key) || timestamps.get(key)! < timestamp) {
      memory.set(key, info);
      timestamps.set(key, timestamp);
    }
  }
  return Object.assign(memory, { variants: new Map([...variants].map(([key, names]) => [key,
    [...names.values()].sort((a, b) => b.timestamp - a.timestamp).map(({ info }) => info),
  ])) });
}

export function findSkuSuggestions(memory: SkuMemory, kind: KphKind, input: string) {
  const normalize = (value: string) => value.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const query = normalize(input);
  if (!query || query.length > 50) return [];
  const exactKey = skuMemoryKey(kind, input);
  const exact = exactKey ? memory.variants?.get(exactKey) : undefined;
  if (exact?.length) return exact.slice(0, 8).map((info) => ({ code: input.trim(), ...info }));
  const prefix = `${kind}:`;
  return [...memory.entries()]
    .filter(([key, info]) => key.startsWith(prefix) && (normalize(key.slice(prefix.length)).includes(query) || normalize(info.productName).includes(query)))
    .map(([key, info]) => ({ code: key.slice(prefix.length), ...info }))
    .sort((a, b) => {
      const rank = (code: string) => code.toLocaleLowerCase("vi") === query ? 0 : code.toLocaleLowerCase("vi").startsWith(query) ? 1 : 2;
      return rank(a.code) - rank(b.code) || a.code.localeCompare(b.code, "vi");
    }).slice(0, 8);
}
