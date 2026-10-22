import { StrictMode, useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";
import { FeatureLoadBoundary, FeatureLoadError, KphLoadingSkeleton } from "./feature-loading";

// Load only the configured entry point; the other app and its dependencies stay off startup.
const entryModule = import.meta.env.VITE_STORE_APP_MOCK === "true"
  ? import("./store-app").then(module => ({ default: module.StoreApp }))
  : import("./app").then(module => ({ default: module.App }));
const frameModule = import.meta.env.VITE_STORE_APP_MOCK === "true"
  ? import("./store-loading-frame") : null;

// A direct KPH link already expresses intent: fetch alongside the shell, avoiding
// an entry → shell → workspace request waterfall on cold startup.
if (import.meta.env.VITE_STORE_APP_MOCK === "true" && window.location.hash === "#kph") {
  void import("./store-kph-workspace").catch(() => {});
}

// Direct report links fetch feature code alongside the entry point, not after it.
if (import.meta.env.VITE_STORE_APP_MOCK === "true" && window.location.hash === "#reports") {
  void import("./store-report-hub").catch(() => {});
}

function AppBootstrap() {
  const [EntryPoint, setEntryPoint] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const [LoadingFrame, setLoadingFrame] = useState<ComponentType | null>(null);
  useEffect(() => {
    let current = true;
    entryModule.then(module => { if (current) setEntryPoint(() => module.default); })
      .catch(() => { if (current) setFailed(true); });
    frameModule?.then(module => { if (current) setLoadingFrame(() => module.StoreLoadingFrame); }).catch(() => {});
    return () => { current = false; };
  }, []);
  if (failed) return <FeatureLoadError />;
  if (EntryPoint) return <EntryPoint />;
  if (LoadingFrame) return <LoadingFrame />;
  return import.meta.env.VITE_STORE_APP_MOCK === "true"
    ? <div className="store-bootstrap-canvas" data-home={window.location.hash === "#home" || !window.location.hash} aria-busy="true"><p className="sr-only" role="status">Đang tải ứng dụng…</p></div>
    : <KphLoadingSkeleton label="Đang tải ứng dụng" />;
}

document.addEventListener("keydown", (event) => {
  if (!event.altKey && !event.ctrlKey && !event.metaKey) {
    document.documentElement.dataset.focusModality = "keyboard";
  }
}, true);
document.addEventListener("pointerdown", () => {
  delete document.documentElement.dataset.focusModality;
}, true);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FeatureLoadBoundary><AppBootstrap /></FeatureLoadBoundary>
  </StrictMode>,
);
