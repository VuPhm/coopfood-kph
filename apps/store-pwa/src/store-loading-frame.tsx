import { useEffect, useState } from "react";
import { StoreAppFrame, readStoreScreen, type Screen } from "./store-app-frame";
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
    account={<button disabled className="store-account" aria-label="Tài khoản và cửa hàng"><span className="store-profile-avatar">MA</span></button>}>
    {screen === "home" ? <StoreHomeContent navigate={navigate} openDateLots={mockDateLots.filter(lot => lot.status === "open").length} pendingRecords={mockRecords.filter(record => record.approvalStatus === "PENDING").length} />
      : screen === "kph" ? <KphWorkspaceSkeleton records={mockRecords} /> : <KphLoadingSkeleton label="Đang tải giao diện" />}
    <p className="sr-only" role="status">Đang tải ứng dụng…</p>
  </StoreAppFrame>;
}
