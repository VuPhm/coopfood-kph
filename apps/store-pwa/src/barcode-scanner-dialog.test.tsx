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
