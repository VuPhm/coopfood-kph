import { Button } from "@coopfood-kph/ui";
import { CloudOff, DownloadCloud, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ServiceWorkerNotice = "offline-ready" | "offline" | "update" | null;

export function PwaStatus() {
  const [notice, setNotice] = useState<ServiceWorkerNotice>(() => navigator.onLine ? null : "offline");
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const applyingUpdate = useRef(false);

  useEffect(() => {
    const handleOnline = () => setNotice((current) => current === "offline" ? null : current);
    const handleOffline = () => setNotice("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!("serviceWorker" in navigator) || import.meta.env.MODE === "test") {
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    let cancelled = false;
    const handleControllerChange = () => {
      if (applyingUpdate.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).then((registration) => {
      if (cancelled) return;
      registrationRef.current = registration;
      if (registration.waiting && navigator.serviceWorker.controller) setNotice("update");
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") setNotice(navigator.serviceWorker.controller ? "update" : "offline-ready");
        });
      });
    }).catch(() => {
      // App vẫn chạy online bình thường khi service worker không đăng ký được.
    });

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!notice) return null;

  const copy = notice === "offline"
    ? { icon: <CloudOff aria-hidden="true" />, title: "Đang ngoại tuyến", detail: "Phiếu vẫn được lưu và xuất Excel trên thiết bị này." }
    : notice === "update"
      ? { icon: <RefreshCw aria-hidden="true" />, title: "Có phiên bản mới", detail: "Cập nhật sau khi đã lưu xong phiếu đang nhập." }
      : { icon: <DownloadCloud aria-hidden="true" />, title: "Đã sẵn sàng ngoại tuyến", detail: "Bạn có thể mở lại app khi không có mạng." };

  function applyUpdate() {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) return;
    applyingUpdate.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <aside className="pwa-status-toast" role="status" aria-live="polite">
      <span className="pwa-status-icon">{copy.icon}</span>
      <span className="pwa-status-copy"><strong>{copy.title}</strong><small>{copy.detail}</small></span>
      {notice === "update" ? <Button type="button" onClick={applyUpdate}>Cập nhật</Button> : null}
      <button type="button" className="pwa-status-dismiss" aria-label="Đóng thông báo PWA" onClick={() => setNotice(null)}><X aria-hidden="true" /></button>
    </aside>
  );
}
