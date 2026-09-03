import { parse as parseExif } from "exifr/dist/lite.esm.mjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("exifr/dist/lite.esm.mjs", () => ({ parse: vi.fn() }));

import imageFixture from "../../../contracts/fixtures/golden/images/expected-manifest.json";

import { EVIDENCE_QUALITY_FLOOR, EVIDENCE_TARGET_BYTES, evidenceDimensions, processEvidencePhoto, resolveEvidenceCaptureDate } from "./image-processing";

describe("evidence image envelope", () => {
  beforeEach(() => vi.mocked(parseExif).mockReset());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("targets a compact stamped JPEG for local-only pilot storage", () => {
    expect(EVIDENCE_TARGET_BYTES).toBe(550 * 1024);
    expect(EVIDENCE_QUALITY_FLOOR).toBeGreaterThanOrEqual(0.5);
  });

  it.each(imageFixture)("consumes $id and fits $width×$height without upscaling", ({ width, height, expectedWidth, expectedHeight, outputMime, upscaled }) => {
    expect(evidenceDimensions(width, height)).toEqual({ width: expectedWidth, height: expectedHeight });
    expect(outputMime).toBe("image/jpeg");
    expect(upscaled).toBe(false);
  });

  it.each(imageFixture)("resolves the accepted timestamp precedence for $id", async ({ exif, lastModified, controlledNow, expectedTimestamp }) => {
    vi.mocked(parseExif).mockResolvedValue(exif ? { DateTimeOriginal: new Date(exif) } : undefined);
    const file = new File(["synthetic"], "evidence.jpg", {
      type: "image/jpeg",
      lastModified: lastModified ? Date.parse(lastModified) : 0,
    });

    await expect(resolveEvidenceCaptureDate(file, new Date(controlledNow))).resolves.toEqual(new Date(expectedTimestamp));
  });

  it("creates a stamped JPEG and disposes the decoded original", async () => {
    vi.mocked(parseExif).mockResolvedValue(undefined);
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 600, height: 400, close }));
    const fillText = vi.fn();
    const context = {
      arcTo: vi.fn(),
      beginPath: vi.fn(),
      clip: vi.fn(),
      closePath: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText,
      measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
      moveTo: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback: BlobCallback, type?: string) => callback(new Blob(["synthetic-jpeg"], { type: type ?? "image/jpeg" }))),
    } as unknown as HTMLCanvasElement;
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => (
      tagName === "canvas" ? canvas : createElement(tagName, options)
    )) as typeof document.createElement);
    const controlledNow = new Date("2026-01-04T03:04:05Z");
    const file = new File(["synthetic-original"], "evidence.png", { type: "image/png", lastModified: 0 });

    const result = await processEvidencePhoto(file, { storeCode: "0123", storeName: "Cống Quỳnh" }, controlledNow);

    expect(result).toMatchObject({ width: 600, height: 400, capturedAt: controlledNow });
    expect(result.blob.type).toBe("image/jpeg");
    expect(fillText.mock.calls.some(([text]) => String(text).includes("0123 - Cống Quỳnh"))).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });
});
