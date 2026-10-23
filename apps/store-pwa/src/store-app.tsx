import { StorePageHero, StorePageLayout, StorePageSurface, StoreReportPage } from "./store-page-hero";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@coopfood-kph/ui";
import { History } from "lucide-react";
import { FeatureLoadBoundary, FeatureLoadError, KphLoadingSkeleton } from "./feature-loading";
import { PwaStatus } from "./pwa-status";

import { ShelfLifeScreen, useShelfLifeLookup } from "./store-shelf-life";
import { useShelfLookupHistory } from "./store-shelf-history";
import { useBusinessDate } from "./use-business-date";
import { reactivateDueDateLots } from "./store-date-actions";
import { kphRecordFromDraft } from "./store-kph-draft-record";
import type { CreatedRecordDraft } from "./create-record-dialog";
import { DateWorkspace } from "./store-date-workspace";
import { StoreNotifications } from "./store-notifications";
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

// Report composition/history is not startup work for Home or other features.
// Keep the frame visible and a local recovery action when a feature chunk fails.
type ReportHubComponent = typeof import("./store-report-hub").ReportHub;
let loadedReportHub: ReportHubComponent | null = null;
function DeferredReportHub(props: ComponentProps<ReportHubComponent>) {
  const [Hub, setHub] = useState(() => loadedReportHub);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (Hub) return;
    let current = true;
    import("./store-report-hub").then(module => {
      loadedReportHub = module.ReportHub;
      if (current) setHub(() => module.ReportHub);
    }).catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [Hub]);
  if (Hub) return <Hub {...props} />;
  return <StoreReportPage>{failed ? <FeatureLoadError /> : <KphLoadingSkeleton compact label="Đang tải báo cáo" />}</StoreReportPage>;
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
  const [storedDateLots, setDateLots] = useState(mockDateLots);
  const today = useBusinessDate();
  const dateLots = useMemo(() => reactivateDueDateLots(storedDateLots, today), [storedDateLots, today]);
  const dueReminders = useMemo(() => dateLots.filter(lot => lot.status === "open" && !!lot.remindOn && lot.remindOn <= today), [dateLots, today]);
  const announcedReminders = useRef(new Set<string>());
  const recordRef = useRef(records); recordRef.current = records;
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const announce = () => {
      if (document.visibilityState === "hidden") return;
      const fresh = dueReminders.filter(lot => !announcedReminders.current.has(`${lot.id}:${lot.remindOn}`));
      if (!fresh.length) return;
      fresh.forEach(lot => announcedReminders.current.add(`${lot.id}:${lot.remindOn}`));
      setNotice(`Đến lịch báo lại: ${fresh.length} lô DATE cần xem lại.`);
    };
    announce();
    document.addEventListener("visibilitychange", announce);
    window.addEventListener("focus", announce);
    return () => { document.removeEventListener("visibilitychange", announce); window.removeEventListener("focus", announce); };
  }, [dueReminders]);
  const createDateKph = useCallback(async (draft: CreatedRecordDraft) => {
    const existing = draft.idempotencyKey ? recordRef.current.find(record => record.id === draft.idempotencyKey) : undefined;
    if (existing) return existing.id;
    const record = kphRecordFromDraft(draft);
    recordRef.current = [record, ...recordRef.current];
    setRecords(recordRef.current);
    setNotice("Đã tạo phiếu KPH và cập nhật lô DATE trong phiên dữ liệu mẫu.");
    return record.id;
  }, []);
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
      {screen === "date" ? <DateWorkspace lots={dateLots} onLotsChange={setDateLots} today={today} onCreateKph={createDateKph} /> : null}
      {screen === "reports" ? <FeatureLoadBoundary><DeferredReportHub lots={dateLots} /></FeatureLoadBoundary> : null}
      {screen === "notifications" ? <StoreNotifications navigate={navigate} reminders={dueReminders} /> : null}
      {showQuickLookup ? <button ref={quickFabRef} hidden={quickOpen} className="store-quick-fab" aria-label="Mở tiện ích tra cứu lùi hàng" aria-expanded={quickOpen} aria-controls={quickOpen ? "store-quick-panel" : undefined} onClick={() => setQuickOpen(open => !open)}><History size={22} strokeWidth={1.8} aria-hidden="true" /><span>Tra hạn lùi</span></button> : null}
      {showQuickLookup ? <Dialog open={quickOpen} onOpenChange={setQuickOpen}><DialogContent id="store-quick-panel" ref={quickPanelRef} className="store-quick-panel" aria-label="Tra cứu lùi hàng nhanh" aria-labelledby={undefined} closeLabel="Đóng tiện ích" onOpenAutoFocus={event => { event.preventDefault(); quickPanelRef.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); window.requestAnimationFrame(() => quickFabRef.current?.focus()); }}><DialogHeader><DialogTitle>Tra cứu lùi hàng</DialogTitle></DialogHeader><DialogDescription className="sr-only">Tra hạn lùi tự động theo thông tin ngày đã nhập</DialogDescription><div className="store-modal-body"><ShelfLifeScreen idPrefix="quick-shelf" lookup={quickLookup} /></div></DialogContent></Dialog> : null}
  </StoreAppFrame>;
}
