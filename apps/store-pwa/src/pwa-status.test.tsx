import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PwaStatus } from "./pwa-status";

describe("PwaStatus", () => {
  const originalServiceWorker = navigator.serviceWorker;
  const waitingWorker = { postMessage: vi.fn() };
  const registration = {
    addEventListener: vi.fn(),
    installing: null,
    update: vi.fn().mockResolvedValue(undefined),
    waiting: waitingWorker,
  };
  const serviceWorker = {
    addEventListener: vi.fn(),
    controller: {},
    register: vi.fn().mockResolvedValue(registration),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: serviceWorker,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: originalServiceWorker,
    });
  });

  it("keeps a waiting update visible and explains that the scanner needs it", async () => {
    render(<PwaStatus serviceWorkerEnabled />);

    expect(await screen.findByText("Có phiên bản mới")).toBeVisible();
    expect(screen.getByText(/cập nhật để dùng máy quét mã vạch/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Đóng thông báo PWA" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));
    expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("bypasses the HTTP cache and checks again when the app regains focus", async () => {
    render(<PwaStatus serviceWorkerEnabled />);

    await waitFor(() => expect(serviceWorker.register).toHaveBeenCalledWith("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }));

    window.dispatchEvent(new Event("focus"));
    await waitFor(() => expect(registration.update).toHaveBeenCalled());
  });
});
