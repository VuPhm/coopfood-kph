import { Button } from "@coopfood-kph/ui";
import { CloudOff, DownloadCloud, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ServiceWorkerNotice = "offline-ready" | "offline" | "update" | null;

type PwaStatusProps = {
  serviceWorkerEnabled?: boolean;
};

export function PwaStatus({ serviceWorkerEnabled = import.meta.env.MODE !== "test" }: PwaStatusProps = {}) {
  const [notice, setNotice] = useState<ServiceWorkerNotice>(() => navigator.onLine ? null : "offline");
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const applyingUpdate = useRef(false);
  const reloadedForUpdate = useRef(false);
  const hasInteracted = useRef(false);
  const applyingSilently = useRef(false);
  const pendingReload = useRef(false);
  const applyWaitingUpdateRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const serviceWorker = "serviceWorker" in navigator ? navigator.serviceWorker : null;
    let startupCheckInProgress = true;
    const hasWaitingUpdate = () => Boolean(serviceWorker?.controller && registrationRef.current?.waiting);
    const hasUpdateNotice = () => hasWaitingUpdate() && !applyingUpdate.current;
    const reloadOnce = () => {
      if (reloadedForUpdate.current) return;
      reloadedForUpdate.current = true;
      window.location.reload();
    };
    const applyWaitingUpdate = (silently = false) => {
      if (pendingReload.current) {
        reloadOnce();
        return;
      }
      if (applyingUpdate.current) return;
      const waiting = registrationRef.current?.waiting;
      if (!waiting || !serviceWorker?.controller) return;
      applyingUpdate.current = true;
      applyingSilently.current = silently;
      waiting.postMessage({ type: "SKIP_WAITING" });
    };
    applyWaitingUpdateRef.current = () => applyWaitingUpdate();
    const checkForUpdate = () => {
      if (registrationRef.current) startupCheckInProgress = false;
      if (hasUpdateNotice()) setNotice("update");
      if (!navigator.onLine) return;
      void registrationRef.current?.update().catch(() => {
        // A failed background check must not interrupt the local-only app.
      });
    };
    const handleOnline = () => {
      setNotice((current) => current === "update" || hasUpdateNotice() ? "update" : current === "offline" ? null : current);
      checkForUpdate();
    };
    const handleOffline = () => setNotice((current) => current === "update" || hasUpdateNotice() ? "update" : "offline");
    const handleFocus = () => checkForUpdate();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);

    if (!serviceWorker || !serviceWorkerEnabled) {
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("focus", handleFocus);
      };
    }

    let cancelled = false;
    // Only the startup check may activate silently. Once input begins, preserve
    // the current screen/draft, including if activation is already in flight.
    const handleInteraction = () => { hasInteracted.current = true; };
    // update() can resolve before updatefound. Allow discovery to finish, but
    // never treat an update arriving long after startup as a silent update.
    const startupTimeout = window.setTimeout(() => { startupCheckInProgress = false; }, 30_000);
    document.addEventListener("pointerdown", handleInteraction, true);
    document.addEventListener("keydown", handleInteraction, true);
    document.addEventListener("input", handleInteraction, true);
    const handleControllerChange = () => {
      if (applyingUpdate.current && !reloadedForUpdate.current) {
        if (applyingSilently.current && hasInteracted.current) {
          pendingReload.current = true;
          setNotice("update");
        } else reloadOnce();
      }
    };
    serviceWorker.addEventListener("controllerchange", handleControllerChange);

    void serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: "none",
    }).then((registration) => {
      if (cancelled) return;
      registrationRef.current = registration;
      const showOrApplyWaitingUpdate = (silently = false) => {
        if (cancelled || applyingUpdate.current) return;
        if (!registration.waiting || !serviceWorker.controller) return;
        if (silently && startupCheckInProgress && !hasInteracted.current) applyWaitingUpdate(true);
        else setNotice("update");
      };
      showOrApplyWaitingUpdate(true);
      const watchInstallingWorker = () => {
        const worker = registration.installing;
        const startupUpdate = startupCheckInProgress;
        worker?.addEventListener("statechange", () => {
          if (cancelled || worker.state !== "installed") return;
          if (serviceWorker.controller) {
            showOrApplyWaitingUpdate(startupUpdate);
          } else {
            setNotice("offline-ready");
          }
          startupCheckInProgress = false;
        });
      };
      registration.addEventListener("updatefound", watchInstallingWorker);
      watchInstallingWorker();
      if (navigator.onLine) {
        void registration.update().then(() => showOrApplyWaitingUpdate(true)).catch(() => {
          // A failed startup check must not interrupt reopening the local app.
        });
      } else startupCheckInProgress = false;
    }).catch(() => {
      // App vẫn chạy online bình thường khi service worker không đăng ký được.
    });

    return () => {
      cancelled = true;
      window.clearTimeout(startupTimeout);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("pointerdown", handleInteraction, true);
      document.removeEventListener("keydown", handleInteraction, true);
      document.removeEventListener("input", handleInteraction, true);
      serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [serviceWorkerEnabled]);

  if (!notice) return null;

  const copy = notice === "offline"
    ? { icon: <CloudOff aria-hidden="true" />, title: "Đang ngoại tuyến", detail: "Phiếu vẫn được lưu và xuất Excel trên thiết bị này." }
    : notice === "update"
      ? { icon: <RefreshCw aria-hidden="true" />, title: "Có phiên bản mới", detail: "Cập nhật để sử dụng phiên bản mới nhất." }
      : { icon: <DownloadCloud aria-hidden="true" />, title: "Đã sẵn sàng ngoại tuyến", detail: "Bạn có thể mở lại app khi không có mạng." };

  return (
    <aside className="pwa-status-toast" role={notice === "update" ? "alert" : "status"} aria-live={notice === "update" ? "assertive" : "polite"}>
      <span className="pwa-status-icon">{copy.icon}</span>
      <span className="pwa-status-copy"><strong>{copy.title}</strong><small>{copy.detail}</small></span>
      {notice === "update" ? <Button type="button" onClick={() => applyWaitingUpdateRef.current()}>Cập nhật</Button> : null}
      {notice === "update" ? null : <button type="button" className="pwa-status-dismiss" aria-label="Đóng thông báo PWA" onClick={() => setNotice(null)}><X aria-hidden="true" /></button>}
    </aside>
  );
}
