import { describe, expect, it } from "vitest";

import fieldPolicyCases from "../../../contracts/fixtures/golden/kph/field-policy-cases.json";

import { getApprovalTone, getConditionTone, getResolutionTone, KPH_OPTIONS, resolveChoiceLabel, type KphKind } from "./kph-options";

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

  it("resolves correct tones for condition, resolution, and approval", () => {
    expect(getConditionTone("Cận date")).toBe("orange");
    expect(getConditionTone("Hư hỏng")).toBe("red");
    expect(getConditionTone("Hết HSD")).toBe("gray");

    expect(getResolutionTone("HỦY")).toBe("red");
    expect(getResolutionTone("ĐỔI")).toBe("green");
    expect(getResolutionTone("XUẤT TRẢ")).toBe("blue");
    expect(getResolutionTone("KHÁC")).toBe("gray");

    expect(getApprovalTone("PENDING")).toBe("orange");
    expect(getApprovalTone("APPROVED")).toBe("green");
    expect(getApprovalTone("REJECTED")).toBe("red");
  });
});
