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

  useEffect(() => {
    const checkForUpdate = () => {
      if (!navigator.onLine) return;
      void registrationRef.current?.update().catch(() => {
        // A failed background check must not interrupt the local-only app.
      });
    };
    const handleOnline = () => {
      setNotice((current) => current === "offline" ? null : current);
      checkForUpdate();
    };
    const handleOffline = () => setNotice("offline");
    const handleFocus = () => checkForUpdate();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);

    if (!("serviceWorker" in navigator) || !serviceWorkerEnabled) {
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("focus", handleFocus);
      };
    }

    const serviceWorker = navigator.serviceWorker;
    let cancelled = false;
    const handleControllerChange = () => {
      if (applyingUpdate.current) window.location.reload();
    };
    serviceWorker.addEventListener("controllerchange", handleControllerChange);

    void serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: "none",
    }).then((registration) => {
      if (cancelled) return;
      registrationRef.current = registration;
      if (registration.waiting && serviceWorker.controller) setNotice("update");
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") setNotice(serviceWorker.controller ? "update" : "offline-ready");
        });
      });
    }).catch(() => {
      // App vẫn chạy online bình thường khi service worker không đăng ký được.
    });

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [serviceWorkerEnabled]);

  if (!notice) return null;

  const copy = notice === "offline"
    ? { icon: <CloudOff aria-hidden="true" />, title: "Đang ngoại tuyến", detail: "Phiếu vẫn được lưu và xuất Excel trên thiết bị này." }
    : notice === "update"
      ? { icon: <RefreshCw aria-hidden="true" />, title: "Có phiên bản mới", detail: "Bản hiện tại đã cũ. Lưu phiếu đang nhập rồi cập nhật để dùng máy quét mã vạch." }
      : { icon: <DownloadCloud aria-hidden="true" />, title: "Đã sẵn sàng ngoại tuyến", detail: "Bạn có thể mở lại app khi không có mạng." };

  function applyUpdate() {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) return;
    applyingUpdate.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <aside className="pwa-status-toast" role={notice === "update" ? "alert" : "status"} aria-live={notice === "update" ? "assertive" : "polite"}>
      <span className="pwa-status-icon">{copy.icon}</span>
      <span className="pwa-status-copy"><strong>{copy.title}</strong><small>{copy.detail}</small></span>
      {notice === "update" ? <Button type="button" onClick={applyUpdate}>Cập nhật</Button> : null}
      {notice === "update" ? null : <button type="button" className="pwa-status-dismiss" aria-label="Đóng thông báo PWA" onClick={() => setNotice(null)}><X aria-hidden="true" /></button>}
    </aside>
  );
}
