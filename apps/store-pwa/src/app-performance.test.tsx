import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import * as rules from "@coopfood-kph/kph-rules";

import { App } from "./app";

vi.mock("./demo-records", async (importOriginal) => {
  const original = await importOriginal<typeof import("./demo-records")>();
  return { ...original, DEMO_RECORDS: Array.from({ length: 200 }, (_, index) => ({
    ...original.DEMO_RECORDS[0]!, id: `KPH-SYNTHETIC-${index}`, productName: `Sản phẩm thử ${index}`, photos: [],
  })) };
});

it("renders only the changed record's row and card when selecting in a large history", () => {
  const tone = vi.spyOn(rules, "getConditionTone");
  try {
    render(<App />);
    const initialCalls = tone.mock.calls.length;
    tone.mockClear();
    fireEvent.click(within(screen.getByRole("table")).getByRole("checkbox", { name: "Chọn phiếu KPH-SYNTHETIC-0" }));
    const updateCalls = tone.mock.calls.length;
    expect(initialCalls).toBeGreaterThan(2);
    expect(updateCalls).toBe(2);
  } finally { tone.mockRestore(); }
}, 30_000);
