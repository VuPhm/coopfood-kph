import { describe, expect, it } from "vitest";
import { appendTrackedDateLot, dateIntakeSchema, makeTrackedDateLot, DateLotDuplicateError } from "./store-date-intake-model";
import { dateLotBatchLabel } from "./store-date-lot";
import { dateLotKind, dateLotKphSeed } from "./store-date-actions";
import { assessDateLot } from "./store-date-assessment";
import { groupDateNotifications } from "./store-notifications-model";
import { createDateReport, selectDateReport } from "./store-date-report-model";
import { readReportLibrary, writeReportLibrary } from "./store-report-library";
import { createDateReportWorkbook } from "./store-date-report-export";
const input = { sku: "0000042", name: "Sản phẩm nhập tay", kind: "TPTS" as const, batchCode: "LO-001", manufactured: "01/10/2026", expiry: "10/10/2026" };
const snapshot = { lookupStatus: "NOT_FOUND" as const, barcode: "00000042", kind: null };
describe("DATE intake", () => {
  it("preserves string identity, explicit manual kind and KPH source; separates batch from ID", () => {
    const lot = makeTrackedDateLot(input, snapshot, "internal-uuid");
    expect(lot).toMatchObject({ id: "internal-uuid", batchCode: "LO-001", sku: "0000042", date: "2026-10-10", status: "open", productSnapshot: { lookupStatus: "NOT_FOUND", barcode: "00000042", kind: "TPTS" } });
    expect(dateLotBatchLabel(lot)).toBe("LO-001"); expect(dateLotKind(lot)).toBe("TPTS");
    expect(dateLotKphSeed(lot, "2026-10-28").seed).toMatchObject({ skuCode: "0000042", productName: input.name, barcode: "00000042", condition: "EXPIRED" });
    expect(dateLotKphSeed(lot, "2026-10-28").seed.note).not.toContain("internal-uuid");
    expect(dateLotKind(makeTrackedDateLot({ ...input, kind: "unclassified" }, snapshot, "x"))).toBeNull();
  });
  it("validates real dates and the inclusive10-day boundary with the existing calculator", () => {
    for (const expiry of ["31/02/2026", "01/10/2026", "30/09/2026", ""]) expect(dateIntakeSchema.safeParse({ ...input, expiry }).success).toBe(false);
    expect(dateIntakeSchema.safeParse({ ...input, manufactured: "" }).success).toBe(false);
    const short = assessDateLot(makeTrackedDateLot({ ...input, expiry: "09/10/2026" }, snapshot, "9"), "2026-10-01");
    expect(short.result).toMatchObject({ shelfLifeDays: 9, warningDate: null, withdrawalDate: "2026-10-09" });
    expect(assessDateLot(makeTrackedDateLot(input, snapshot, "10"), "2026-10-01").result).toMatchObject({ shelfLifeDays: 10, warningDate: "2026-10-06", withdrawalDate: "2026-10-08" });
  });
  it("retries a request once, blocks duplicates including resolved, and permits distinct printed batches", () => {
    const a = makeTrackedDateLot(input, snapshot, "a"), b = makeTrackedDateLot(input, snapshot, "b");
    const lots = appendTrackedDateLot([], a); expect(appendTrackedDateLot(lots, a)).toBe(lots);
    expect(() => appendTrackedDateLot(lots, b)).toThrow(DateLotDuplicateError);
    expect(() => appendTrackedDateLot([{ ...a, status: "resolved" }], b)).toThrow(DateLotDuplicateError);
    expect(appendTrackedDateLot(lots, { ...b, batchCode: "LO-002" })).toHaveLength(2);
    expect(() => appendTrackedDateLot(lots, { ...b, batchCode: null })).toThrow(DateLotDuplicateError);
    expect(dateLotBatchLabel({ id: "opaque", batchCode: null })).toBe("Chưa có mã lô");
    expect(dateLotBatchLabel({ id: "legacy" })).toBe("legacy");
  });
  it("feeds alerts/report snapshots and preserves printed batch after history reload and workbook export", async () => {
    const lot = makeTrackedDateLot(input, snapshot, "opaque"); expect(groupDateNotifications([lot], "2026-10-28")[0]?.items[0]?.lot.id).toBe("opaque");
    expect(selectDateReport([lot], "2026-10-28", { start: "2026-10-01", end: "2026-10-31" }, { phase: "all", processing: "all", search: "LO-001" })).toHaveLength(1);
    const report = createDateReport([lot], "2026-10-28", { start: "2026-10-01", end: "2026-10-31" }, { phase: "all", processing: "all", search: "" }, "Store mock", "28/10/2026");
    expect(report.rows).toHaveLength(1); let raw = "";
    writeReportLibrary({ setItem: (_key, value) => { raw = value; } }, "0001", { templates: [], history: [{ ...report, id: "r", title: "Báo cáo thử" }] });
    const loaded = readReportLibrary({ getItem: () => raw }, "0001"); expect(loaded.history[0]?.rows[0]?.batchCode).toBe("LO-001");
    const book = await createDateReportWorkbook(loaded.history[0]!); expect(book.getWorksheet("DATE")!.getCell("C10").value).toBe("LO-001");
    lot.productSnapshot!.kind = "TPCN"; expect(report.rows[0]?.productSnapshot?.kind).toBe("TPTS");
    const changed = { ...lot, name: "Tên khác" }; expect(report.rows[0]?.name).toBe(input.name); expect(changed.name).not.toBe(report.rows[0]?.name);
  });
});
