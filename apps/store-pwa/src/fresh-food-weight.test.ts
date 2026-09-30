import { describe, expect, it } from "vitest";

import { parseFreshFoodWeightKg } from "./fresh-food-weight";

describe("parseFreshFoodWeightKg", () => {
  it.each([
    ["2912345612345", 1.234],
    ["2912345602505", 0.25],
    ["2912345699995", 9.999],
    ["2912345600005", 0],
    ["2902505", 0.25],
  ])("reads only the four weight digits in %s", (barcode, expected) => {
    expect(parseFreshFoodWeightKg(barcode)).toBe(expected);
  });

  it.each(["", "29", "291234", "2812345612345", "29ABCDEF12345", "29123456123A5", "291234561234X", " 2912345612345", "2912345612345\n"])("returns null for invalid barcode %j", (barcode) => {
    expect(parseFreshFoodWeightKg(barcode)).toBeNull();
  });
});
