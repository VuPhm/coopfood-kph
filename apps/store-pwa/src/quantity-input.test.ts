import { describe, expect, it } from "vitest";

import { parsePositiveQuantity } from "./quantity-input";

describe("parsePositiveQuantity", () => {
  it.each([
    ["1", 1], ["0.25", 0.25], ["0,25", 0.25],
    ["1.234", 1.234], ["1,234", 1.234], ["9,999", 9.999],
    [".5", 0.5], [",5", 0.5], [" 00,250 ", 0.25], ["0.001", 0.001],
  ])("parses %j as the numeric quantity %s", (input, expected) => {
    expect(parsePositiveQuantity(input)).toBe(expected);
  });

  it.each([
    "", " ", "0", "0.000", "0,000", "-0.25", "-0,25",
    "1,2.3", "1.2,3", "1,2,3", "1..2", "1 234", "1kg",
    "NaN", "Infinity", "1e3", "0x10", "1,", ",", "9".repeat(400),
  ])("rejects non-positive, malformed, ambiguous or non-finite input %j", (input) => {
    expect(parsePositiveQuantity(input)).toBeNull();
  });
});
