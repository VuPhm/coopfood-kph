import { addDays, formatDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import type { CreateRecordSeed } from "./create-record-dialog";
import { assessDateLot } from "./store-date-assessment";
import { mockCatalogProducts, mockProductMetadata, type MockDateLot } from "./store-app-mock";

export function acknowledgeDateLot(lot: MockDateLot, today: LocalDate, days: 1 | 7): MockDateLot {
  if (lot.status === "resolved") return lot;
  return { ...lot, status: "acknowledged", remindOn: addDays(today, days) };
}
export function reactivateDueDateLots(lots: MockDateLot[], today: LocalDate): MockDateLot[] {
  return lots.map(lot => lot.status === "acknowledged" && lot.remindOn && lot.remindOn <= today ? { ...lot, status: "open" } : lot);
}
export function dateLotKphSeed(lot: MockDateLot, today: LocalDate) {
  const matches = mockCatalogProducts.filter(product => product.skuCode === lot.sku);
  const product = matches.length === 1 ? matches[0] : undefined;
  const metadata = product ? mockProductMetadata[product.id] : undefined;
  const phase = assessDateLot(lot, today).phase;
  let expiry: string;
  try { expiry = formatDisplayDate(lot.date); } catch { expiry = lot.date; }
  const seed: CreateRecordSeed = {
    barcode: product?.barcode ?? "", skuCode: lot.sku, productName: product?.name ?? lot.name,
    supplier: product?.primarySupplier.name ?? "", unit: metadata?.unit ?? "EA",
    note: `Lô DATE ${lot.id}; NSX: ${lot.manufactured ?? "Chưa có"}; HSD: ${expiry}`,
    ...(phase === "EXPIRED" ? { condition: "EXPIRED" } : phase === "WARNING" || phase === "DANGER" ? { condition: "NEAR_EXPIRY" } : {}),
  };
  return { kind: metadata?.kphKind ?? null, seed };
}
