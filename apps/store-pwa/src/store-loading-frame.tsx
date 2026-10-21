import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { useEffect, useState } from "react";
import { StoreAppFrame } from "./store-app-frame";
import { readStoreScreen, type Screen } from "./store-app-routes";
import { StoreAccountTrigger } from "./store-account-trigger";
import { StoreNotifications } from "./store-notifications";
import { StoreHomeContent } from "./store-home";
import { mockDateLots, mockProfile, mockRecords } from "./store-app-mock";
import { KphWorkspaceSkeleton } from "./store-kph-loading";
import { KphLoadingSkeleton } from "./feature-loading";

// Lightweight chrome loads in parallel with feature code. It uses the same
// frame/Home markup and synthetic context as this preview's eventual entry.
export function StoreLoadingFrame() {
  const [screen, setScreen] = useState(readStoreScreen);
  useEffect(() => {
    const sync = () => setScreen(readStoreScreen());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const navigate = (next: Screen) => { window.location.hash = next; };
  if (screen === "login") return <KphLoadingSkeleton label="Đang tải đăng nhập" />;
  return <StoreAppFrame screen={screen} profile={mockProfile} navigate={navigate}
    account={<StoreAccountTrigger disabled profile={mockProfile} />}>
    {screen === "home" ? <StoreHomeContent profile={mockProfile} navigate={navigate} openDateLots={mockDateLots.filter(lot => lot.status === "open").length} pendingRecords={mockRecords.filter(record => record.approvalStatus === "PENDING").length} />
      : screen === "notifications" ? <StoreNotifications navigate={navigate} /> : screen === "kph" ? <KphWorkspaceSkeleton records={mockRecords} /> : <StorePageLayout><StorePageHero /><StorePageSurface><KphLoadingSkeleton label="Đang tải giao diện" /></StorePageSurface></StorePageLayout>}
    <p className="sr-only" role="status">Đang tải ứng dụng…</p>
  </StoreAppFrame>;
}
