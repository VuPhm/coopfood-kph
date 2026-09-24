import { describe, expect, it } from "vitest";

import { createDemoState, decideSession, inventoryQuantity, lotDate, saveEntry } from "./client-store-demo-data";

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
});
