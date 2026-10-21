import { Bell } from "lucide-react";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import type { Screen } from "./store-app-routes";

export function StoreNotifications({ navigate }: { navigate: (screen: Screen) => void }) {
  return <StorePageLayout className="store-notifications"><StorePageHero /><StorePageSurface className="store-report-page-cap store-notifications-body" aria-label="Danh sách thông báo">
    <span className="store-notifications-icon"><Bell size={30} strokeWidth={1.7} aria-hidden="true" /></span>
    <h2>Chưa có thông báo</h2><p>Thông báo về hoạt động cửa hàng sẽ xuất hiện tại đây.</p>
    <button type="button" onClick={() => navigate("home")}>Mở trang chủ</button>
  </StorePageSurface></StorePageLayout>;
}
