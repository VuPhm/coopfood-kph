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

  it.each([
    ["session", "Bạn vẫn có thể tra hạn lùi. Phiếu dùng thử chỉ giữ trong phiên, tải lại sẽ mất thay đổi."],
    ["online", "Cần kết nối mạng để tải và gửi phiếu lên máy chủ."],
  ] as const)("describes %s offline capabilities without claiming durable local records", (offlineMode, detail) => {
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
    render(<PwaStatus enableServiceWorker={false} offlineMode={offlineMode} />);
    expect(screen.getByText(detail)).toBeVisible();
    expect(screen.queryByText("Phiếu vẫn được lưu và xuất Excel trên thiết bị này.")).not.toBeInTheDocument();
    fireEvent(window, new Event("online"));
    expect(screen.queryByText("Đang ngoại tuyến")).not.toBeInTheDocument();
    fireEvent(window, new Event("offline"));
    expect(screen.getByText("Đang ngoại tuyến")).toBeVisible();
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
    // Discovering an update must leave the active version and unfinished form alone.
    expect(postMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
});
