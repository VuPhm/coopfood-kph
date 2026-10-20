import { describe, expect, it } from "vitest";
import { shouldDismissReportPull } from "./store-report-surface";
describe("report pull dismissal", () => {
  it("requires a deliberate distance or a sufficiently long downward flick", () => {
    expect(shouldDismissReportPull(119, 0)).toBe(false);
    expect(shouldDismissReportPull(120, 0)).toBe(true);
    expect(shouldDismissReportPull(47, 2)).toBe(false);
    expect(shouldDismissReportPull(48, .7)).toBe(true);
    expect(shouldDismissReportPull(70, -.8)).toBe(false);
  });
});
