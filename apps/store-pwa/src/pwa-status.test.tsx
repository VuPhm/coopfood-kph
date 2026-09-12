import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PwaStatus } from "./pwa-status";

const onlineDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, "onLine");
const serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, "serviceWorker");

afterEach(() => {
  if (onlineDescriptor) Object.defineProperty(Navigator.prototype, "onLine", onlineDescriptor);
  else Reflect.deleteProperty(Navigator.prototype, "onLine");
  if (serviceWorkerDescriptor) Object.defineProperty(Navigator.prototype, "serviceWorker", serviceWorkerDescriptor);
  else Reflect.deleteProperty(Navigator.prototype, "serviceWorker");
  vi.restoreAllMocks();
});

describe("PWA status", () => {
  it("explains that offline records remain on the current device", () => {
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });

    render(<PwaStatus enableServiceWorker={false} />);

    expect(screen.getByText("Đang ngoại tuyến")).toBeVisible();
    expect(screen.getByText("Phiếu vẫn được lưu và xuất Excel trên thiết bị này.")).toBeVisible();
  });

  it("registers the production worker and applies an already waiting update", async () => {
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => true });
    const postMessage = vi.fn();
    const registration = {
      waiting: { postMessage },
      installing: null,
      addEventListener: vi.fn(),
    };
    const serviceWorker = {
      controller: {},
      register: vi.fn().mockResolvedValue(registration),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(Navigator.prototype, "serviceWorker", { configurable: true, get: () => serviceWorker });

    render(<PwaStatus enableServiceWorker />);

    await waitFor(() => expect(screen.getByText("Có phiên bản mới")).toBeVisible());
    expect(serviceWorker.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
});
