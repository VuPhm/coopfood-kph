import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserMultiFormatReader, type Result } from "@zxing/library";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { BarcodeScannerDialog } from "./barcode-scanner-dialog";

describe("BarcodeScannerDialog", () => {
  const originalMediaDevices = navigator.mediaDevices;
  let mockTrack: { stop: ReturnType<typeof vi.fn>; getCapabilities: ReturnType<typeof vi.fn>; applyConstraints: ReturnType<typeof vi.fn> };
  let mockStream: { getTracks: () => unknown[]; getVideoTracks: () => unknown[] };

  beforeEach(() => {
    mockTrack = {
      stop: vi.fn(),
      getCapabilities: vi.fn(() => ({ torch: true })),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
    };
    mockStream = {
      getTracks: () => [mockTrack],
      getVideoTracks: () => [mockTrack],
    };

    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { deviceId: "cam-1", kind: "videoinput", label: "Back Camera" },
          { deviceId: "cam-2", kind: "videoinput", label: "Front Camera" },
        ]),
      },
    });

    // Mock HTMLMediaElement.prototype.play
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(BrowserMultiFormatReader.prototype, "decodeContinuously")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: originalMediaDevices,
    });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders scanner modal with camera viewport and controls when open", async () => {
    const handleOpenChange = vi.fn();
    const handleScan = vi.fn();

    render(
      <BarcodeScannerDialog
        open={true}
        onOpenChange={handleOpenChange}
        onScan={handleScan}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Quét mã SKU / UPC")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nhập mã thủ công" })).toBeVisible();

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });
  });

  it("handles camera permission rejection gracefully without locking user", async () => {
    const permissionError = new Error("Permission denied");
    permissionError.name = "NotAllowedError";

    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(permissionError);

    const handleOpenChange = vi.fn();
    const handleScan = vi.fn();

    render(
      <BarcodeScannerDialog
        open={true}
        onOpenChange={handleOpenChange}
        onScan={handleScan}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Không thể dùng máy ảnh")).toBeInTheDocument();
      expect(screen.getByText(/Quyền truy cập máy ảnh bị từ chối/i)).toBeInTheDocument();
    });

    const manualBtn = screen.getByRole("button", { name: "Nhập mã thủ công" });
    expect(manualBtn).toBeVisible();
    fireEvent.click(manualBtn);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it.each([
    ["NotFoundError", /Không tìm thấy máy ảnh/i],
    ["NotReadableError", /đang được ứng dụng khác sử dụng/i],
    ["UnexpectedError", /Không thể khởi động máy ảnh/i],
  ])("maps %s startup failures to an actionable fallback", async (name, expectedCopy) => {
    const startupError = new Error(name);
    startupError.name = name;
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(startupError);

    render(<BarcodeScannerDialog open onOpenChange={vi.fn()} onScan={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(expectedCopy)).toBeVisible());
    expect(screen.getByRole("button", { name: "Nhập mã thủ công" })).toBeVisible();
  });

  it("stops every acquired camera track when the dialog unmounts", async () => {
    const { unmount } = render(<BarcodeScannerDialog open onOpenChange={vi.fn()} onScan={vi.fn()} />);
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled());

    unmount();

    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it("discards a camera stream that resolves after the dialog has closed", async () => {
    let resolveStream!: (stream: typeof mockStream) => void;
    navigator.mediaDevices.getUserMedia = vi.fn(() => new Promise<typeof mockStream>((resolve) => {
      resolveStream = resolve;
    })) as unknown as typeof navigator.mediaDevices.getUserMedia;
    const { rerender } = render(<BarcodeScannerDialog open onOpenChange={vi.fn()} onScan={vi.fn()} />);
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled());

    rerender(<BarcodeScannerDialog open={false} onOpenChange={vi.fn()} onScan={vi.fn()} />);
    resolveStream(mockStream);

    await waitFor(() => expect(mockTrack.stop).toHaveBeenCalled());
  });

  it("uses the accepted formats and preserves a trimmed identifier with leading zeroes", async () => {
    const handleOpenChange = vi.fn();
    const handleScan = vi.fn();
    const configuredFormats: string[][] = [];
    class TestBarcodeDetector {
      static getSupportedFormats = vi.fn().mockResolvedValue(["qr_code", "code_39", "upc_a", "ean_13", "ean_8", "code_128"]);
      detect = vi.fn().mockResolvedValue([{ rawValue: "  00012345  " }]);

      constructor(options?: { formats?: string[] }) {
        configuredFormats.push(options?.formats ?? []);
      }
    }
    vi.stubGlobal("BarcodeDetector", TestBarcodeDetector);
    vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(HTMLMediaElement.HAVE_CURRENT_DATA);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => window.setTimeout(() => callback(100), 0)));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((identifier: number) => window.clearTimeout(identifier)));

    render(<BarcodeScannerDialog open onOpenChange={handleOpenChange} onScan={handleScan} />);

    await waitFor(() => expect(screen.getByText("Đã nhận diện mã")).toBeVisible());
    await waitFor(() => expect(handleScan).toHaveBeenCalledWith("00012345"), { timeout: 1_500 });
    expect(configuredFormats).toEqual([["ean_8", "ean_13", "upc_a", "code_128", "code_39"]]);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it("decodes with the ZXing fallback when native BarcodeDetector is unavailable", async () => {
    const handleOpenChange = vi.fn();
    const handleScan = vi.fn();
    const decodeContinuously = vi.mocked(BrowserMultiFormatReader.prototype.decodeContinuously);
    decodeContinuously.mockImplementation((_source, callback) => {
      callback({ getText: () => "0009876543210" } as Result, undefined);
    });

    render(<BarcodeScannerDialog open onOpenChange={handleOpenChange} onScan={handleScan} />);

    await waitFor(() => expect(decodeContinuously).toHaveBeenCalled());
    await waitFor(() => expect(handleScan).toHaveBeenCalledWith("0009876543210"), { timeout: 1_500 });
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("starts the Safari fallback on the existing inline video without reinitializing playback", async () => {
    const decodeContinuously = vi.mocked(BrowserMultiFormatReader.prototype.decodeContinuously);
    const reinitializeVideo = vi.spyOn(BrowserMultiFormatReader.prototype, "decodeFromVideoElementContinuously");

    render(<BarcodeScannerDialog open onOpenChange={vi.fn()} onScan={vi.fn()} />);

    await waitFor(() => expect(decodeContinuously).toHaveBeenCalled());
    const video = screen.getByLabelText("Camera preview") as HTMLVideoElement;
    expect(decodeContinuously).toHaveBeenCalledWith(video, expect.any(Function));
    expect(reinitializeVideo).not.toHaveBeenCalled();
    expect(video.srcObject).toBe(mockStream);
    expect(video.playsInline).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.getAttribute("webkit-playsinline")).toBe("true");
  });

  it("does not publish a queued result after the scan dialog has closed", async () => {
    const handleScan = vi.fn();
    const frameCallbacks: FrameRequestCallback[] = [];
    let queuedResult: (() => void) | undefined;
    const originalSetTimeout = window.setTimeout.bind(window);
    vi.spyOn(window, "setTimeout").mockImplementation(((handler: TimerHandler, timeout?: number) => {
      if (timeout === 450 && typeof handler === "function") {
        queuedResult = () => handler();
        return 999;
      }
      return originalSetTimeout(handler, timeout);
    }) as typeof window.setTimeout);
    class TestBarcodeDetector {
      static getSupportedFormats = vi.fn().mockResolvedValue(["ean_13"]);
      detect = vi.fn().mockResolvedValue([{ rawValue: "OLD-0001" }]);
    }
    vi.stubGlobal("BarcodeDetector", TestBarcodeDetector);
    vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(HTMLMediaElement.HAVE_CURRENT_DATA);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const handleOpenChange = vi.fn();
    const { rerender } = render(<BarcodeScannerDialog open onOpenChange={handleOpenChange} onScan={handleScan} />);
    await waitFor(() => expect(frameCallbacks).toHaveLength(1));
    await act(async () => {
      await frameCallbacks.shift()?.(100);
    });
    expect(screen.getByText("OLD-0001")).toBeVisible();
    expect(queuedResult).toBeTypeOf("function");

    rerender(<BarcodeScannerDialog open={false} onOpenChange={handleOpenChange} onScan={handleScan} />);
    act(() => queuedResult?.());

    expect(handleScan).not.toHaveBeenCalled();
  });

  it("ignores a decoded value from an older scan session after reopening", async () => {
    const handleOpenChange = vi.fn();
    const handleScan = vi.fn();
    const frameCallbacks: FrameRequestCallback[] = [];
    let resolveOldDetection!: (value: Array<{ rawValue: string }>) => void;
    const oldDetection = new Promise<Array<{ rawValue: string }>>((resolve) => {
      resolveOldDetection = resolve;
    });
    let detectorIndex = 0;
    class TestBarcodeDetector {
      static getSupportedFormats = vi.fn().mockResolvedValue(["ean_13"]);
      private readonly index = detectorIndex++;
      detect = vi.fn(() => this.index === 0
        ? oldDetection
        : Promise.resolve([{ rawValue: "NEW-0002" }]));
    }
    vi.stubGlobal("BarcodeDetector", TestBarcodeDetector);
    vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(HTMLMediaElement.HAVE_CURRENT_DATA);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const scanner = <BarcodeScannerDialog open onOpenChange={handleOpenChange} onScan={handleScan} />;
    const { rerender } = render(scanner);
    await waitFor(() => expect(frameCallbacks).toHaveLength(1));
    act(() => {
      void frameCallbacks.shift()?.(100);
    });

    rerender(<BarcodeScannerDialog open={false} onOpenChange={handleOpenChange} onScan={handleScan} />);
    rerender(scanner);
    await waitFor(() => expect(frameCallbacks).toHaveLength(1));

    await act(async () => {
      resolveOldDetection([{ rawValue: "OLD-0001" }]);
      await oldDetection;
    });
    expect(screen.queryByText("OLD-0001")).not.toBeInTheDocument();

    await act(async () => {
      await frameCallbacks.shift()?.(100);
    });
    expect(await screen.findByText("NEW-0002")).toBeVisible();
    await waitFor(() => expect(handleScan).toHaveBeenCalledWith("NEW-0002"), { timeout: 1_500 });
    expect(handleScan).toHaveBeenCalledTimes(1);
  });

  it("supports switching cameras and torch toggle when available", async () => {
    const handleOpenChange = vi.fn();
    const handleScan = vi.fn();

    render(
      <BarcodeScannerDialog
        open={true}
        onOpenChange={handleOpenChange}
        onScan={handleScan}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bật đèn" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Đổi camera" })).toBeInTheDocument();
    });

    // Toggle torch
    fireEvent.click(screen.getByRole("button", { name: "Bật đèn" }));
    await waitFor(() => {
      expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
        advanced: [{ torch: true }],
      });
    });

    // Switch camera
    fireEvent.click(screen.getByRole("button", { name: "Đổi camera" }));
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    });
  });
});
