import { describe, expect, it } from "vitest";

import { EVIDENCE_TARGET_BYTES, evidenceDimensions } from "./image-processing";

describe("evidence image envelope", () => {
  it("targets a compact stamped JPEG for local-only pilot storage", () => {
    expect(EVIDENCE_TARGET_BYTES).toBe(420 * 1024);
  });
  it.each([
    [1600, 900, 1280, 720],
    [900, 1600, 405, 720],
    [800, 800, 720, 720],
    [600, 400, 600, 400],
  ])("fits %sx%s without upscaling", (width, height, expectedWidth, expectedHeight) => {
    expect(evidenceDimensions(width, height)).toEqual({ width: expectedWidth, height: expectedHeight });
  });
});
