import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EVIDENCE_TARGET_BYTES, evidenceDimensions, processEvidencePhoto } from "./image-processing";

vi.mock("exifr/dist/lite.esm.mjs", () => ({ parse: vi.fn().mockResolvedValue(undefined) }));

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

describe("evidence image resource lifecycle", () => {
  const canvases: HTMLCanvasElement[] = [];
  const closeBitmap = vi.fn();
  const context = {
    beginPath: vi.fn(), moveTo: vi.fn(), arcTo: vi.fn(), closePath: vi.fn(),
    save: vi.fn(), clip: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(),
    restore: vi.fn(), stroke: vi.fn(), fillText: vi.fn(),
    measureText: vi.fn((value: string) => ({ width: value.length * 8 })),
  };
  let outputBlob: Blob | null;
  let verifyEncode: (canvas: HTMLCanvasElement) => void;
  let failContextAt: number;

  beforeEach(() => {
    vi.clearAllMocks();
    canvases.length = 0;
    outputBlob = new Blob([new Uint8Array(400 * 1024)], { type: "image/jpeg" });
    verifyEncode = () => {};
    failContextAt = 0;
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 4032, height: 2268, close: closeBitmap }));
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tag: string, options?: ElementCreationOptions) => {
      const element = createElement(tag, options);
      if (tag === "canvas") {
        const canvas = element as HTMLCanvasElement;
        canvases.push(canvas);
        canvas.getContext = vi.fn().mockReturnValue(canvases.length === failContextAt ? null : context);
        canvas.toBlob = vi.fn((callback: BlobCallback, type?: string) => {
          expect(type).toBe("image/jpeg");
          verifyEncode(canvas);
          callback(outputBlob);
        });
      }
      return element;
    }) as typeof document.createElement);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("releases the full camera bitmap before JPEG compression and frees the final canvas", async () => {
    verifyEncode = () => expect(closeBitmap).toHaveBeenCalledTimes(1);
    const file = new File(["synthetic camera image"], "camera.jpg", { type: "image/jpeg", lastModified: 1_776_220_280_000 });
    const result = await processEvidencePhoto(file, { storeCode: "0123", storeName: "Cửa hàng thử" });
    expect(result).toEqual({ blob: outputBlob, width: 1280, height: 720, capturedAt: new Date(file.lastModified) });
    expect(context.fillText).toHaveBeenCalledWith("0123 - Cửa hàng thử", expect.any(Number), expect.any(Number));
    expect(closeBitmap).toHaveBeenCalledTimes(1);
    expect(canvases.every((canvas) => canvas.width === 0 && canvas.height === 0)).toBe(true);
  });

  it("discards each intermediate canvas without changing the compression envelope", async () => {
    outputBlob = new Blob([new Uint8Array(500 * 1024)], { type: "image/jpeg" });
    verifyEncode = (canvas) => {
      expect(closeBitmap).toHaveBeenCalledTimes(1);
      expect(canvases.filter((item) => item !== canvas).every((item) => item.width === 0 && item.height === 0)).toBe(true);
    };
    const result = await processEvidencePhoto(new File(["test"], "camera.jpg"), { storeCode: "", storeName: "" });
    expect(result.width).toBe(655);
    expect(result.height).toBe(369);
    expect(result.blob).toBe(outputBlob);
    expect(canvases).toHaveLength(4);
    expect(canvases.every((canvas) => canvas.width === 0 && canvas.height === 0)).toBe(true);
  });

  it("cleans up resources when JPEG encoding fails", async () => {
    outputBlob = null;
    await expect(processEvidencePhoto(new File(["test"], "camera.jpg"), { storeCode: "", storeName: "" })).rejects.toThrow("Không thể tạo bản ảnh đã đóng tem");
    expect(closeBitmap).toHaveBeenCalledTimes(1);
    expect(canvases.every((canvas) => canvas.width === 0 && canvas.height === 0)).toBe(true);
  });

  it.each([1, 2])("rejects a missing canvas context at pass %s without saving a blank image", async (pass) => {
    failContextAt = pass;
    outputBlob = new Blob([new Uint8Array(500 * 1024)], { type: "image/jpeg" });
    await expect(processEvidencePhoto(new File(["test"], "camera.jpg"), { storeCode: "", storeName: "" })).rejects.toThrow("Thiết bị không hỗ trợ xử lý ảnh");
    expect(closeBitmap).toHaveBeenCalledTimes(1);
    expect(canvases.every((canvas) => canvas.width === 0 && canvas.height === 0)).toBe(true);
  });

  it("releases the Safari image element and URL before encoding through the img fallback", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    class UrlShim extends URL {
      static createObjectURL = vi.fn(() => "blob:camera-source");
      static revokeObjectURL = vi.fn();
    }
    const removeSource = vi.fn();
    class ImageShim {
      naturalWidth = 4032;
      naturalHeight = 2268;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { queueMicrotask(() => this.onload?.()); }
      removeAttribute = removeSource;
    }
    vi.stubGlobal("URL", UrlShim);
    vi.stubGlobal("Image", ImageShim);
    verifyEncode = () => {
      expect(removeSource).toHaveBeenCalledWith("src");
      expect(UrlShim.revokeObjectURL).toHaveBeenCalledWith("blob:camera-source");
    };
    const result = await processEvidencePhoto(new File(["test"], "camera.jpg", { lastModified: 0 }), { storeCode: "", storeName: "" }, new Date("2026-10-13T10:00:00Z"));
    expect(result.capturedAt.toISOString()).toBe("2026-10-13T10:00:00.000Z");
    expect(result.blob).toBe(outputBlob);
    expect(closeBitmap).not.toHaveBeenCalled();
    expect(removeSource).toHaveBeenCalledTimes(1);
  });
});
