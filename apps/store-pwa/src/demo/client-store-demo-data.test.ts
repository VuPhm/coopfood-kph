import { describe, expect, it } from "vitest";

import {
  createDemoState, importDemoInventoryReference, inventoryQuantity, latestCheckedQuantity,
  lotDate, parseDemoInventoryReferenceCsv, receiveLot, recordInventoryCheck,
} from "./client-store-demo-data";

describe("DEMO-01 Kiểm khớp records", () => {
  it("appends independent checks and keeps the imported source snapshot unchanged", () => {
    const initial = createDemoState("2026-09-25");
    const sourceSnapshot = initial.inventoryReferenceSnapshots[0]!;
    const originalRows = structuredClone(sourceSnapshot.rows);
    expect(latestCheckedQuantity(initial, "bread")).toBe(17);
    expect(inventoryQuantity(initial, "bread")).toBe(18);

    const first = recordInventoryCheck(initial, { productId: "milk", actualQuantity: 18,
      checkerName: "Trần Minh Anh", checkedAt: "2026-09-25T08:12:00+07:00" });
    const second = recordInventoryCheck(first, { productId: "milk", actualQuantity: 20,
      checkerName: "Nguyễn Văn B", checkedAt: "2026-09-25T10:47:00+07:00" });

    expect(second.inventoryCheckLogs.slice(-2)).toEqual([
      expect.objectContaining({ referenceQuantity: 24, externalReferenceQuantity: 24, referenceBasis: "INVENTORY_SNAPSHOT", actualQuantity: 18, difference: -6 }),
      expect.objectContaining({ referenceQuantity: 18, externalReferenceQuantity: 24, referenceBasis: "LATEST_CHECK", actualQuantity: 20, difference: 2 }),
    ]);
    expect(latestCheckedQuantity(second, "milk")).toBe(20);
    expect(second.inventoryCheckLogs.filter((entry) => entry.productId === "milk")).toHaveLength(2);
    expect(second.inventoryReferenceSnapshots[0]?.rows).toEqual(originalRows);
    expect(inventoryQuantity(second, "milk")).toBe(24);
  });

  it("loads only the isolated demo CSV mapping and preserves prior snapshots", () => {
    const initial = createDemoState("2026-09-25");
    const csv = "SKU,Reference quantity\r\nSP000123,26\r\nSP000124,18\r\n";
    const parsed = parseDemoInventoryReferenceCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual([
      { productId: "milk", sku: "SP000123", quantity: 26 },
      { productId: "bread", sku: "SP000124", quantity: 18 },
    ]);
    const imported = importDemoInventoryReference(initial, "export-demo.csv", csv, "2026-09-25T11:00:00+07:00");
    expect(imported.errors).toEqual([]);
    expect(imported.state.inventoryReferenceSnapshots).toHaveLength(2);
    expect(imported.state.inventoryReferenceSnapshots[0]?.rows[0]?.quantity).toBe(24);
    expect(imported.state.activeInventoryReferenceSnapshotId).toBe(imported.state.inventoryReferenceSnapshots[1]?.id);
    const logged = recordInventoryCheck(imported.state, { productId: "bread", actualQuantity: 25,
      checkerName: "Nguyễn Văn B", checkedAt: "2026-09-25T11:05:00+07:00" });
    expect(logged.inventoryCheckLogs.at(-1)).toEqual(expect.objectContaining({
      externalReferenceQuantity: 18, referenceSnapshotId: imported.state.activeInventoryReferenceSnapshotId,
      referenceSourceFile: "export-demo.csv", referenceQuantity: 17, difference: 8,
    }));
    expect(parseDemoInventoryReferenceCsv("SKU,Quantity\nSP000123,8").errors[0]?.message).toContain("demo yêu cầu");
    expect(parseDemoInventoryReferenceCsv("SKU,Reference quantity\nSP000123,-1").errors).toHaveLength(1);
  });

  it("uses the accepted DATE rule for each demo lot", () => {
    const state = createDemoState("2026-09-25");
    const bread = lotDate(state.lots.find((lot) => lot.productId === "bread")!, "2026-09-25");
    expect(bread.status).toBe("DANGER");
    expect(bread.withdrawalDate).toBe("2026-09-25");
  });

  it("receives a new lot into the shared inventory state with accepted DATE calculations", () => {
    const initial = createDemoState("2026-09-25");
    const received = receiveLot(initial, {
      productId: "milk", nsx: "2026-09-01", hsd: "2026-09-30", receivedOn: "2026-09-25",
      quantity: 7, lotCode: "LOT123",
    }, "2026-09-25");

    expect(inventoryQuantity(initial, "milk")).toBe(24);
    expect(inventoryQuantity(received.state, "milk")).toBe(31);
    expect(received.lot).toEqual(expect.objectContaining({ productId: "milk", quantity: 7, lotCode: "LOT123", receivedOn: "2026-09-25" }));
    expect(lotDate(received.lot, "2026-09-25")).toEqual(expect.objectContaining({ shelfLifeDays: 30, withdrawalDate: "2026-09-24", status: "DANGER" }));
    expect(received.state.lots).toHaveLength(initial.lots.length + 1);
    const next = receiveLot(received.state, { productId: "milk", nsx: "2026-09-01", hsd: "2026-09-30",
      receivedOn: "2026-09-25", quantity: 3 }, "2026-09-25");
    expect(next.lot.id).not.toBe(received.lot.id);
    expect(inventoryQuantity(next.state, "milk")).toBe(34);
  });

  it("rejects an impossible receiving date or quantity without changing stock", () => {
    const initial = createDemoState("2026-09-25");
    const input = { productId: "milk", nsx: "2026-09-01" as const, hsd: "2026-09-30" as const,
      receivedOn: "2026-09-25" as const, quantity: 7 };
    expect(() => receiveLot(initial, { ...input, receivedOn: "2026-08-31" }, "2026-09-25")).toThrow("Ngày nhập phải từ ngày sản xuất");
    expect(() => receiveLot(initial, { ...input, quantity: 0 }, "2026-09-25")).toThrow("Số lượng phải là số nguyên");
    expect(inventoryQuantity(initial, "milk")).toBe(24);
  });
});
