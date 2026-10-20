import { describe, expect, it } from "vitest";
import { updateSelection } from "./store-selection";

describe("scoped collection selection", () => {
  const eligible = ["a", "b", "c"];
  it("selects and clears visible items without dropping choices outside the search", () => {
    expect(updateSelection(["a"], eligible, ["b"], "select-visible")).toEqual(["a", "b"]);
    expect(updateSelection(null, eligible, ["b"], "clear-visible")).toEqual(["a", "c"]);
  });
  it("inverts only the visible eligible IDs, ignoring duplicate and unknown IDs", () => {
    expect(updateSelection(["a", "outside"], eligible, ["a", "b", "b", "unknown"], "invert-visible")).toEqual(["outside", "b"]);
  });
  it("distinguishes following the whole collection from an empty explicit selection", () => {
    expect(updateSelection([], eligible, [], "all")).toBeNull();
    expect(updateSelection(null, eligible, [], "none")).toEqual([]);
    expect(updateSelection(["a"], eligible, [], "clear-visible")).toEqual(["a"]);
  });
});
