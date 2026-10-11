import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { calculateShelfLife, type LocalDate } from "@coopfood-kph/kph-rules";
import { useShelfLookupHistory, type ShelfLookupSnapshot } from "./store-shelf-history";

function snapshot(day: number): ShelfLookupSnapshot {
  const nsx = "2026-10-01" as LocalDate;
  const hsd = `2026-11-${String(day).padStart(2, "0")}` as LocalDate;
  const calculatedOn = "2026-10-10" as LocalDate;
  return { known: true, nsx, hsd, days: String(31 + day), months: "", calculatedOn, value: calculateShelfLife(nsx, hsd, calculatedOn) };
}

describe("Shelf lookup session history", () => {
  it("keeps the newest 20 in lookup order, with unique IDs even in the same millisecond", () => {
    const { result } = renderHook(useShelfLookupHistory);
    act(() => { for (let day = 1; day <= 22; day++) result.current.remember(snapshot(day)); });
    expect(result.current.history).toHaveLength(20);
    expect(result.current.history[0]?.hsd).toBe("2026-11-22");
    expect(result.current.history[19]?.hsd).toBe("2026-11-03");
    expect(new Set(result.current.history.map(item => item.id)).size).toBe(20);
  });

  it("deduplicates consecutive auto/manual lookup but records later repeats and changed modes", () => {
    const { result } = renderHook(useShelfLookupHistory);
    act(() => {
      result.current.remember(snapshot(1)); result.current.remember(snapshot(1));
      result.current.remember(snapshot(2)); result.current.remember(snapshot(1));
      result.current.remember({ ...snapshot(1), known: false });
    });
    expect(result.current.history).toHaveLength(4);
    expect(result.current.history.map(item => item.known)).toEqual([false, true, true, true]);
  });

  it("starts a fresh list when the page session is remounted", () => {
    const first = renderHook(useShelfLookupHistory);
    act(() => first.result.current.remember(snapshot(1)));
    first.unmount();
    expect(renderHook(useShelfLookupHistory).result.current.history).toEqual([]);
  });
});
