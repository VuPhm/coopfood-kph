import { describe, expect, it } from "vitest";

import { createDemoState, decideSession, inventoryQuantity, lotDate, receiveLot, saveEntry } from "./client-store-demo-data";

describe("DEMO-01 stocktake boundary", () => {
  it("keeps approved stock unchanged until manager approval, then updates lots and reports source", () => {
    const initial = createDemoState("2026-09-25");
    const id = "KK-TEST";
    const working = {
      ...initial,
      sessions: [...initial.sessions, { id, date: "2026-09-25" as const, employee: "Demo",
        status: "IN_PROGRESS" as const, entries: [] }],
    };
    const counted = saveEntry(working, id, {
      productId: "milk", systemQuantity: 24, actualQuantity: 18, reason: "Hao hụt", note: "",
    });
    expect(inventoryQuantity(counted, "milk")).toBe(24);
    const submitted = { ...counted, sessions: counted.sessions.map((session) => session.id === id
      ? { ...session, status: "SUBMITTED" as const } : session) };
    expect(inventoryQuantity(submitted, "milk")).toBe(24);
    const approved = decideSession(submitted, id, "APPROVED");
    expect(inventoryQuantity(approved, "milk")).toBe(18);
    expect(approved.adjustments).toEqual([expect.objectContaining({ productId: "milk", delta: -6, source: "STOCKTAKE" })]);
    expect(decideSession(approved, id, "APPROVED")).toBe(approved);
  });

  it("requests recount without changing stock or recording an adjustment", () => {
    const initial = createDemoState("2026-09-25");
    const id = initial.sessions[0]!.id;
    const recount = decideSession(initial, id, "RECOUNT_REQUIRED");
    expect(recount.sessions[0]!.status).toBe("RECOUNT_REQUIRED");
    expect(recount.sessions[0]!.entries).toHaveLength(0);
    expect(inventoryQuantity(recount, "bread")).toBe(18);
    expect(recount.adjustments).toHaveLength(0);
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
