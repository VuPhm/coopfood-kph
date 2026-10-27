import type { MockDateLot } from "./store-app-mock";

/** Legacy fixtures use id as their printed batch code; new entries keep it separate. */
export function dateLotBatchLabel(lot: Pick<MockDateLot, "id" | "batchCode">) {
  return lot.batchCode === undefined ? lot.id : lot.batchCode || "Chưa có mã lô";
}

export function findDuplicateDateLot(lots: readonly MockDateLot[], draft: MockDateLot) {
  return lots.find(lot => {
    if (lot.id === draft.id || lot.sku !== draft.sku) return false;
    const existingCode = lot.batchCode === undefined ? lot.id : lot.batchCode;
    if (existingCode && draft.batchCode) return existingCode === draft.batchCode;
    return lot.date === draft.date && lot.manufactured === draft.manufactured;
  });
}
export class DateLotDuplicateError extends Error {
  constructor(public readonly lot: MockDateLot) { super(`Lô ${dateLotBatchLabel(lot)} của SKU ${lot.sku} đã có trong theo dõi.`); }
}
export function appendTrackedDateLot(lots: MockDateLot[], draft: MockDateLot): MockDateLot[] {
  if (lots.some(lot => lot.id === draft.id)) return lots;
  const duplicate = findDuplicateDateLot(lots, draft);
  if (duplicate) throw new DateLotDuplicateError(duplicate);
  return [draft, ...lots];
}
