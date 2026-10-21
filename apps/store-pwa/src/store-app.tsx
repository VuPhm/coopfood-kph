import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@coopfood-kph/ui";
import { History } from "lucide-react";
import { FeatureLoadBoundary, FeatureLoadError } from "./feature-loading";
import { PwaStatus } from "./pwa-status";

import { ShelfLifeScreen, useShelfLifeLookup } from "./store-shelf-life";
import { useShelfLookupHistory } from "./store-shelf-history";
import { DateWorkspace } from "./store-date-workspace";
import { StoreNotifications } from "./store-notifications";
import { ReportHub } from "./store-report-hub";
import { StoreLogin } from "./store-login";
import { StoreAccountControl } from "./store-account-sheet";
import { mockDateLots, mockProfile, mockRecords } from "./store-app-mock";
import { StoreAppFrame } from "./store-app-frame";
import { readStoreScreen as readScreen, type Screen } from "./store-app-routes";
import { StoreHomeContent } from "./store-home";
import { KphWorkspaceSkeleton } from "./store-kph-loading";

type KphWorkspaceComponent = typeof import("./store-kph-workspace").KphWorkspace;
let loadedKphWorkspace: KphWorkspaceComponent | null = null;
const loadKphWorkspace = () => import("./store-kph-workspace").then(module => {
  loadedKphWorkspace = module.KphWorkspace;
  return module;
});
function preloadKph() { void loadKphWorkspace().catch(() => {}); }

function LazyKphWorkspace(props: ComponentProps<KphWorkspaceComponent>) {
  const [Workspace, setWorkspace] = useState(() => loadedKphWorkspace);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (Workspace) return;
    let current = true;
    loadKphWorkspace().then(module => { if (current) setWorkspace(() => module.KphWorkspace); })
      .catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [Workspace]);
  if (failed) return <StorePageLayout><StorePageHero /><StorePageSurface><FeatureLoadError /></StorePageSurface></StorePageLayout>;
  return Workspace ? <Workspace {...props} /> : <KphWorkspaceSkeleton records={props.records} />;
}

export function StoreApp() {
  return <StoreAppContent />;
}

function StoreAppContent() {
  const [screen, setScreen] = useState<Screen>(readScreen);
  const [loginPreviewError, setLoginPreviewError] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const quickLookup = useShelfLifeLookup();
  const shelfHistory = useShelfLookupHistory();
  const quickFabRef = useRef<HTMLButtonElement>(null);
  const quickPanelRef = useRef<HTMLDivElement>(null);
  const [records, setRecords] = useState(mockRecords);
  const [dateLots, setDateLots] = useState(mockDateLots);
  const recordRef = useRef(records); recordRef.current = records;
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => () => {
    for (const record of recordRef.current) for (const photo of record.photos) {
      if (photo.src.startsWith("blob:")) URL.revokeObjectURL(photo.src);
    }
  }, []);
  useEffect(() => {
    const sync = () => { const next = readScreen(); if (window.location.hash === "#lookup") window.history.replaceState(null, "", "#date"); setScreen(next); setLoginPreviewError(""); setNotice(""); setQuickOpen(false); window.scrollTo(0, 0); };
    if (window.location.hash === "#lookup") window.history.replaceState(null, "", "#date");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const navigate = (next: Screen) => { window.location.hash = next; };

  if (screen === "login") return <><StoreLogin busy={false} error={loginPreviewError}
    onSubmit={() => setLoginPreviewError("Đăng nhập tài khoản chưa khả dụng trong bản dùng thử. Chọn Vào bản dùng thử để khám phá ứng dụng.")}
    onPreview={() => navigate("home")} /><div className="store-pwa-status"><PwaStatus offlineMode="session" /></div></>;

  const showQuickLookup = screen !== "shelf";
  return <StoreAppFrame screen={screen} profile={mockProfile} navigate={navigate} onKphIntent={preloadKph} quickOpen={quickOpen}
    account={<StoreAccountControl profile={mockProfile} onHome={() => navigate("home")} onLoginPreview={() => navigate("login")} />}
    footer={<>{notice ? <div className="store-toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Đóng thông báo">Đóng</button></div> : null}<div className="store-pwa-status"><PwaStatus offlineMode="session" /></div></>}>
      {screen === "home" ? <StoreHomeContent profile={mockProfile} navigate={navigate} onKphIntent={preloadKph} openDateLots={dateLots.filter(lot => lot.status === "open").length} pendingRecords={records.filter(r => r.approvalStatus === "PENDING").length} /> : null}
      {screen === "shelf" ? <StorePageLayout><StorePageHero /><StorePageSurface className="store-shelf-surface"><div className="store-shelf-page"><ShelfLifeScreen history={shelfHistory.history} onCalculated={shelfHistory.remember} /></div></StorePageSurface></StorePageLayout> : null}
      {screen === "kph" ? <FeatureLoadBoundary><LazyKphWorkspace records={records} onRecordsChange={setRecords} onNotice={setNotice} /></FeatureLoadBoundary> : null}
      {screen === "date" ? <DateWorkspace lots={dateLots} onLotsChange={setDateLots} /> : null}
      {screen === "reports" ? <ReportHub lots={dateLots} /> : null}
      {screen === "notifications" ? <StoreNotifications navigate={navigate} /> : null}
      {showQuickLookup ? <button ref={quickFabRef} hidden={quickOpen} className="store-quick-fab" aria-label="Mở tiện ích tra cứu lùi hàng" aria-expanded={quickOpen} aria-controls={quickOpen ? "store-quick-panel" : undefined} onClick={() => setQuickOpen(open => !open)}><History size={22} strokeWidth={1.8} aria-hidden="true" /><span>Tra hạn lùi</span></button> : null}
      {showQuickLookup ? <Dialog open={quickOpen} onOpenChange={setQuickOpen}><DialogContent id="store-quick-panel" ref={quickPanelRef} className="store-quick-panel" aria-label="Tra cứu lùi hàng nhanh" aria-labelledby={undefined} closeLabel="Đóng tiện ích" onOpenAutoFocus={event => { event.preventDefault(); quickPanelRef.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); window.requestAnimationFrame(() => quickFabRef.current?.focus()); }}><DialogHeader><DialogTitle>Tra cứu lùi hàng</DialogTitle></DialogHeader><DialogDescription className="sr-only">Tra hạn lùi tự động theo thông tin ngày đã nhập</DialogDescription><div className="store-modal-body"><ShelfLifeScreen idPrefix="quick-shelf" lookup={quickLookup} /></div></DialogContent></Dialog> : null}
  </StoreAppFrame>;
}
