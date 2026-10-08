import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
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

  function setNavigationType(type: "navigate" | "reload" | "back_forward") {
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

  async function renderAfterInteraction() {
    render(<PwaStatus serviceWorkerEnabled />);
    fireEvent.keyDown(document, { key: "1" });
    await screen.findByText("Có phiên bản mới");
  }

  it("prompts if input begins before the startup registration completes", async () => {
    await renderAfterInteraction();

    expect(await screen.findByText("Có phiên bản mới")).toBeVisible();
    expect(screen.getByText("Cập nhật để sử dụng phiên bản mới nhất.")).toBeVisible();
    expect(waitingWorker?.postMessage).not.toHaveBeenCalled();

    fireEvent(window, new Event("offline"));
    expect(screen.getByText("Có phiên bản mới")).toBeVisible();
    fireEvent(window, new Event("online"));
    expect(screen.getByText("Có phiên bản mới")).toBeVisible();
  });

  it("uses the same idempotent apply path when the user clicks update", async () => {
    await renderAfterInteraction();
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));

    expect(waitingWorker?.postMessage).toHaveBeenCalledTimes(1);
    expect(waitingWorker?.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it.each(["reload", "navigate", "back_forward"] as const)("silently applies a waiting worker on %s (reload/reopen)", async (navigationType) => {
    setNavigationType(navigationType);
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
    await renderAfterInteraction();
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));
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
    fireEvent.input(screen.getByLabelText("Mã truy cập"), { target: { value: "1" } });

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

  it("reloads once without showing an update prompt during silent activation", async () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { reload } });
    render(<StrictMode><PwaStatus serviceWorkerEnabled /></StrictMode>);
    await waitFor(() => expect(waitingWorker?.postMessage).toHaveBeenCalledTimes(1));
    act(() => {
      serviceWorker.dispatch("controllerchange");
      serviceWorker.dispatch("controllerchange");
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(registration.update).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Có phiên bản mới")).not.toBeInTheDocument();
  });

  it.each(["pointerdown", "keydown", "input"])("defers an in-flight silent reload after %s until explicit update, preserving input", async (eventName) => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { reload } });
    render(<><PwaStatus serviceWorkerEnabled /><input aria-label="Draft" defaultValue="0,25" /></>);
    await waitFor(() => expect(waitingWorker?.postMessage).toHaveBeenCalledTimes(1));
    fireEvent(document, new Event(eventName, { bubbles: true }));
    registration.waiting = null;
    act(() => serviceWorker.dispatch("controllerchange"));

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Draft")).toHaveValue("0,25");
    fireEvent.click(await screen.findByRole("button", { name: "Cập nhật" }));
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật" }));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(waitingWorker?.postMessage).toHaveBeenCalledTimes(1);
  });

  it("prompts for a later update even in a session that started with reload", async () => {
    setNavigationType("reload");
    registration.waiting = null;
    render(<PwaStatus serviceWorkerEnabled />);
    await act(async () => { await Promise.resolve(); });
    fireEvent(window, new Event("focus"));
    installingWorker = eventTarget({ state: "installing" });
    registration.installing = installingWorker;
    act(() => registration.dispatch("updatefound"));
    registration.waiting = waitingWorker;
    installingWorker.state = "installed";
    act(() => installingWorker?.dispatch("statechange"));

    expect(await screen.findByRole("button", { name: "Cập nhật" })).toBeVisible();
    expect(waitingWorker?.postMessage).not.toHaveBeenCalled();
  });

  it("does not silently apply a startup install after typing begins", async () => {
    registration.waiting = null;
    installingWorker = eventTarget({ state: "installing" });
    registration.installing = installingWorker;
    render(<PwaStatus serviceWorkerEnabled />);
    await waitFor(() => expect(installingWorker?.addEventListener).toHaveBeenCalled());
    fireEvent.keyDown(document, { key: "2" });
    registration.waiting = waitingWorker;
    installingWorker.state = "installed";
    act(() => installingWorker?.dispatch("statechange"));

    expect(await screen.findByRole("button", { name: "Cập nhật" })).toBeVisible();
    expect(waitingWorker?.postMessage).not.toHaveBeenCalled();
  });

  it("keeps the app usable if the startup update check fails", async () => {
    registration.waiting = null;
    registration.update.mockRejectedValue(new Error("Offline"));
    render(<PwaStatus serviceWorkerEnabled />);
    await act(async () => { await Promise.resolve(); });

    expect(registration.update).toHaveBeenCalledTimes(1);
    expect(waitingWorker?.postMessage).not.toHaveBeenCalled();
    expect(screen.queryByText("Có phiên bản mới")).not.toBeInTheDocument();
  });

  it("silently applies startup discovery even when update() resolves before updatefound", async () => {
    registration.waiting = null;
    render(<PwaStatus serviceWorkerEnabled />);
    await act(async () => { await Promise.resolve(); });
    installingWorker = eventTarget({ state: "installing" });
    registration.installing = installingWorker;
    act(() => registration.dispatch("updatefound"));
    registration.waiting = waitingWorker;
    installingWorker.state = "installed";
    act(() => installingWorker?.dispatch("statechange"));

    expect(waitingWorker?.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(screen.queryByText("Có phiên bản mới")).not.toBeInTheDocument();
  });

  it("ends silent startup eligibility after 30 seconds even without input", async () => {
    vi.useFakeTimers();
    try {
      registration.waiting = null;
      render(<PwaStatus serviceWorkerEnabled />);
      await act(async () => { await Promise.resolve(); });
      act(() => { vi.advanceTimersByTime(30_000); });
      installingWorker = eventTarget({ state: "installing" });
      registration.installing = installingWorker;
      act(() => registration.dispatch("updatefound"));
      registration.waiting = waitingWorker;
      installingWorker.state = "installed";
      act(() => installingWorker?.dispatch("statechange"));

      expect(screen.getByRole("button", { name: "Cập nhật" })).toBeVisible();
      expect(waitingWorker?.postMessage).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
