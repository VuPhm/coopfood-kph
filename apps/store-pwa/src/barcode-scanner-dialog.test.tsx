import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("returns a trimmed barcode from the native detector and closes after success", async () => {
    const handleOpenChange = vi.fn();
    const handleScan = vi.fn();
    class TestBarcodeDetector {
      static getSupportedFormats = vi.fn().mockResolvedValue(["ean_13"]);
      detect = vi.fn().mockResolvedValue([{ rawValue: "  8938500000123  " }]);
    }
    vi.stubGlobal("BarcodeDetector", TestBarcodeDetector);
    vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(HTMLMediaElement.HAVE_CURRENT_DATA);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => window.setTimeout(() => callback(100), 0)));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((identifier: number) => window.clearTimeout(identifier)));

    render(<BarcodeScannerDialog open onOpenChange={handleOpenChange} onScan={handleScan} />);

    await waitFor(() => expect(screen.getByText("Đã nhận diện mã")).toBeVisible());
    await waitFor(() => expect(handleScan).toHaveBeenCalledWith("8938500000123"), { timeout: 1_500 });
    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(mockTrack.stop).toHaveBeenCalled();
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
