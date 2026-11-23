import { describe, expect, it } from "vitest";
import { groupDateNotifications, groupOnlineDateNotifications } from "./store-notifications-model";
import type { DateLot } from "./date-api";
import type { MockDateLot } from "./store-app-mock";
const base: MockDateLot = { id: "lot", sku: "00001", name: "Lô thử", manufactured: "01/10/2026", date: "2026-10-10", status: "open" };
const { manufactured: _nsx, ...withoutNsx } = base;
describe("DATE notification groups", () => {
  it("uses server reminder state and the page business date for online notices", () => {
    const item = (id: string, reminderState: DateLot["reminderState"], remindOn: string | null): DateLot => ({
      id, storeId: "store", lookupStatus: "MANUAL", barcode: null, skuCode: "00001", productName: "Hàng thử",
      supplierCode: null, supplierName: null, lotCode: "LOT-CODE", manufacturedOn: "2026-10-01", expiresOn: "2026-10-20",
      trackedQuantity: "1", processedQuantity: "0", remainingQuantity: "1", unit: "EA", processingStatus: "OPEN",
      version: 1, remindOn, reminderState,
    } as DateLot);
    expect(groupOnlineDateNotifications([item("scheduled", "SCHEDULED", "2026-10-10")], "2026-10-11")).toEqual([]);
    const groups = groupOnlineDateNotifications([{ ...item("due", "DUE", "2026-10-12"), expiresOn: "2026-10-18" }], "2026-10-11");
    expect(groups.map(group => group.id)).toEqual(["reminder"]);
    expect(groups[0]?.items[0]?.assessment.phase).toBe("WARNING");
  });
  it("groups actual milestones and due reminders once per lot", () => {
    const groups = groupDateNotifications([
      { ...base, id: "expired", date: "2026-10-08" },
      { ...base, id: "withdrawal" },
      { ...base, id: "warning", date: "2026-10-15" },
      { ...withoutNsx, id: "missing", date: "2026-10-20" },
      { ...base, id: "invalid", manufactured: "31/02/2026" },
      { ...base, id: "due", status: "acknowledged", remindOn: "2026-10-09", date: "2026-10-08" },
    ], "2026-10-09");
    expect(groups.map(g => [g.id, g.items.map(i => i.lot.id)])).toEqual([
      ["expired", ["expired"]], ["withdrawal", ["withdrawal"]], ["warning", ["warning"]],
      ["dates", ["invalid", "missing"]], ["reminder", ["due"]],
    ]);
    expect(groups.at(-1)?.items[0]?.assessment.phase).toBe("EXPIRED");
  });
  it("omits resolved, acknowledged, future reminders, safe and before-NSX lots", () => {
    const lots: MockDateLot[] = [
      { ...base, status: "resolved", remindOn: "2026-10-01", kphRecordId: "kph-1" },
      { ...base, id: "ack", status: "acknowledged" },
      { ...base, id: "future", status: "acknowledged", remindOn: "2026-10-10" },
      { ...base, id: "safe", date: "2026-12-31" },
      { ...base, id: "before", manufactured: "10/10/2026", date: "2026-10-20" },
    ];
    expect(groupDateNotifications(lots, "2026-10-09")).toEqual([]);
    expect(lots[0]?.status).toBe("resolved");
  });
  it("uses the calendar due boundary and never duplicates a due expired lot", () => {
    const lot = { ...base, status: "acknowledged" as const, remindOn: "2026-10-11" as const };
    expect(groupDateNotifications([lot], "2026-10-10")).toEqual([]);
    expect(groupDateNotifications([lot], "2026-10-11").map(g => [g.id, g.items.length])).toEqual([["reminder", 1]]);
  });
  it("sorts by known expiry or reminder date with stable lot IDs", () => {
    const groups = groupDateNotifications([{ ...base, id: "b", date: "2026-10-08" }, { ...base, id: "a", date: "2026-10-07" }], "2026-10-09");
    expect(groups[0]?.items.map(i => i.lot.id)).toEqual(["a", "b"]);
  });
});
