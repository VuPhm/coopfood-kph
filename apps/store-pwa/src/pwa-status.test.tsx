import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PinGate } from "./pin-gate";
import { PwaStatus } from "./pwa-status";

type Listener = () => void;

function eventTarget<T extends object>(target: T) {
  const listeners = new Map<string, Listener[]>();
  return Object.assign(target, {
    addEventListener: vi.fn((name: string, listener: Listener) => {
      listeners.set(name, [...(listeners.get(name) ?? []), listener]);
    }),
    removeEventListener: vi.fn((name: string, listener: Listener) => {
      listeners.set(name, (listeners.get(name) ?? []).filter((registered) => registered !== listener));
    }),
    dispatch(name: string) { for (const listener of listeners.get(name) ?? []) listener(); },
  });
}

describe("PwaStatus", () => {
  const originalServiceWorker = navigator.serviceWorker;
  const originalLocation = window.location;
  let waitingWorker: { postMessage: ReturnType<typeof vi.fn> } | null;
  let installingWorker: ReturnType<typeof eventTarget<{ state: string }>> | null;
  let registration: ReturnType<typeof eventTarget<{ installing: typeof installingWorker; waiting: typeof waitingWorker; update: ReturnType<typeof vi.fn> }>>;
  let serviceWorker: ReturnType<typeof eventTarget<{ controller: object | null; register: ReturnType<typeof vi.fn>; }>>;

  function setNavigationType(type: "navigate" | "reload") {
    vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([{ type } as unknown as PerformanceEntry]);
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    waitingWorker = { postMessage: vi.fn() };
    installingWorker = null;
    registration = eventTarget({
      installing: null as typeof installingWorker,
      update: vi.fn().mockResolvedValue(undefined),
      waiting: waitingWorker,
    });
    serviceWorker = eventTarget({
      controller: {},
      register: vi.fn().mockResolvedValue(registration),
    });
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });
    setNavigationType("navigate");
  });

  afterEach(() => {
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: originalServiceWorker });
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("prompts on normal navigation without activating the waiting worker", async () => {
    render(<PwaStatus serviceWorkerEnabled />);

    expect(await screen.findByText("Có phiên bản mới")).toBeVisible();
    expect(screen.getByText("Cập nhật để sử dụng phiên bản mới nhất.")).toBeVisible();
    expect(waitingWorker?.postMessage).not.toHaveBeenCalled();

    fireEvent(window, new Event("offline"));
    expect(screen.getByText("Có phiên bản mới")).toBeVisible();
    fireEvent(window, new Event("online"));
    expect(screen.getByText("Có phiên bản mới")).toBeVisible();
  });

  it("uses the same idempotent apply path when the user clicks update", async () => {
    render(<PwaStatus serviceWorkerEnabled />);
    fireEvent.click(await screen.findByRole("button", { name: "Cập nhật" }));
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));

    expect(waitingWorker?.postMessage).toHaveBeenCalledTimes(1);
    expect(waitingWorker?.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("automatically applies a waiting worker on explicit browser reload", async () => {
    setNavigationType("reload");
    render(<PwaStatus serviceWorkerEnabled />);

    await waitFor(() => expect(waitingWorker?.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" }));
    expect(registration.update).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Cập nhật" })).not.toBeInTheDocument();
  });

  it("applies an update that reaches installed after reload navigation starts", async () => {
    setNavigationType("reload");
    waitingWorker = null;
    registration.waiting = null;
    installingWorker = eventTarget({ state: "installing" });
    registration.installing = installingWorker;
    render(<PwaStatus serviceWorkerEnabled />);

    await waitFor(() => expect(registration.addEventListener).toHaveBeenCalledWith("updatefound", expect.any(Function)));
    registration.dispatch("updatefound");
    await waitFor(() => expect(installingWorker?.addEventListener).toHaveBeenCalledWith("statechange", expect.any(Function)));
    const installedWaitingWorker = { postMessage: vi.fn() };
    waitingWorker = installedWaitingWorker;
    registration.waiting = installedWaitingWorker;
    installingWorker.state = "installed";
    installingWorker.dispatch("statechange");

    await waitFor(() => expect(installedWaitingWorker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" }));
  });

  it("reloads once after the explicitly applied worker takes control", async () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { reload } });
    render(<PwaStatus serviceWorkerEnabled />);
    fireEvent.click(await screen.findByRole("button", { name: "Cập nhật" }));
    serviceWorker.dispatch("controllerchange");
    serviceWorker.dispatch("controllerchange");

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not apply or reload when there is no waiting update", async () => {
    setNavigationType("reload");
    waitingWorker = null;
    registration.waiting = null;
    const reload = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { reload } });
    render(<PwaStatus serviceWorkerEnabled />);

    await waitFor(() => expect(registration.update).toHaveBeenCalledTimes(1));
    serviceWorker.dispatch("controllerchange");
    expect(reload).not.toHaveBeenCalled();
    expect(waitingWorker).toBeNull();
    expect(screen.queryByText("Có phiên bản mới")).not.toBeInTheDocument();
  });

  it("keeps update notice visible while the PIN gate is locked", async () => {
    render(<><PwaStatus serviceWorkerEnabled /><PinGate><div>Store workspace</div></PinGate></>);

    expect(await screen.findByText("Có phiên bản mới")).toBeVisible();
    expect(screen.getByLabelText("Mã truy cập")).toBeVisible();
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
  });

  it("keeps offline-ready behavior and checks for updates when focus returns", async () => {
    waitingWorker = null;
    registration.waiting = null;
    serviceWorker.controller = null;
    installingWorker = eventTarget({ state: "installing" });
    registration.installing = installingWorker;
    render(<PwaStatus serviceWorkerEnabled />);
    await waitFor(() => expect(registration.addEventListener).toHaveBeenCalledWith("updatefound", expect.any(Function)));
    registration.dispatch("updatefound");
    installingWorker.state = "installed";
    installingWorker.dispatch("statechange");

    expect(await screen.findByText("Đã sẵn sàng ngoại tuyến")).toBeVisible();
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(registration.update).toHaveBeenCalled());
  });

  it("bypasses the HTTP cache for service worker registration", async () => {
    render(<PwaStatus serviceWorkerEnabled />);
    await waitFor(() => expect(serviceWorker.register).toHaveBeenCalledWith("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }));
  });
});
