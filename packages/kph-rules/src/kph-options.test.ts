import { describe, expect, it } from "vitest";

import fieldPolicyCases from "../../../contracts/fixtures/golden/kph/field-policy-cases.json";

import { KPH_OPTIONS, resolveChoiceLabel, type KphKind } from "./kph-options";

describe("KPH option matrix", () => {
  it.each(fieldPolicyCases)("keeps shared option fixture $id", (fixture) => {
    const options = KPH_OPTIONS[fixture.type as KphKind];
    expect(options.conditions.map(({ value }) => value)).toEqual(fixture.conditions);
    expect(options.resolutions.map(({ value }) => value)).toEqual(fixture.resolutions);
    expect(options.defaultCondition).toBe(fixture.defaultCondition);
    expect(options.defaultResolution).toBe(fixture.defaultResolution);
  });

  it("allows optional detail for Other without losing the legacy label", () => {
    const other = KPH_OPTIONS.TPCN.conditions[2];
    expect(other).toBeDefined();
    if (!other) return;
    expect(resolveChoiceLabel(other, "  ")).toBe("Khác");
    expect(resolveChoiceLabel(other, "Bao bì sai nhãn")).toBe("Bao bì sai nhãn");
  });
});
