import { z } from "zod";
import { calculateShelfLife, parseDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import type { MockDateLot } from "./store-app-mock";

export const dateIntakeSchema = z.object({
  sku: z.string().trim().min(1, "Nhập SKU của sản phẩm."),
  name: z.string().trim().min(1, "Nhập tên sản phẩm."),
  kind: z.enum(["TPCN", "TPTS", "unclassified"]),
  batchCode: z.string().trim(),
  manufactured: z.string().min(1, "Nhập ngày sản xuất."),
  expiry: z.string().min(1, "Nhập hạn sử dụng."),
}).superRefine((value, context) => {
  let nsx: LocalDate | undefined, hsd: LocalDate | undefined;
  for (const field of ["manufactured", "expiry"] as const) {
    if (!value[field]) continue;
    try { const day = parseDisplayDate(value[field]); if (field === "manufactured") nsx = day; else hsd = day; }
    catch { context.addIssue({ code: "custom", path: [field], message: "Nhập ngày có thật theo dd/mm/yyyy." }); }
  }
  if (nsx && hsd && hsd <= nsx) context.addIssue({ code: "custom", path: ["expiry"], message: "HSD phải sau NSX." });
});
export type DateIntakeValues = z.infer<typeof dateIntakeSchema>;
export type DateProductSnapshot = NonNullable<MockDateLot["productSnapshot"]>;
export function makeTrackedDateLot(input: DateIntakeValues, snapshot: DateProductSnapshot, id: string): MockDateLot {
  const value = dateIntakeSchema.parse(input);
  // Reuse the authority for validation; never infer the dates from a percentage.
  const nsx = parseDisplayDate(value.manufactured), hsd = parseDisplayDate(value.expiry);
  calculateShelfLife(nsx, hsd, nsx);
  return { id, name: value.name, sku: value.sku, manufactured: value.manufactured.trim(), date: hsd,
    batchCode: value.batchCode || null, status: "open", productSnapshot: { ...snapshot, barcode: snapshot.barcode.trim(), kind: value.kind === "unclassified" ? null : value.kind } };
}
export { findDuplicateDateLot, DateLotDuplicateError, appendTrackedDateLot } from "./store-date-lot";
