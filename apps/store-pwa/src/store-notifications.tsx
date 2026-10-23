import { Bell } from "lucide-react";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { formatDisplayDate } from "@coopfood-kph/kph-rules";
import type { MockDateLot } from "./store-app-mock";
import type { Screen } from "./store-app-routes";

export function StoreNotifications({ navigate, reminders = [] }: { navigate: (screen: Screen) => void; reminders?: MockDateLot[] }) {
  return <StorePageLayout className="store-notifications"><StorePageHero /><StorePageSurface className="store-report-page-cap store-notifications-body" aria-label="Danh sách thông báo">
    <span className="store-notifications-icon"><Bell size={30} strokeWidth={1.7} aria-hidden="true" /></span>
    {reminders.length ? <><h2>DATE cần xem lại</h2><div className="store-date-reminder-list">{reminders.map(lot => <button key={lot.id} onClick={() => navigate("date")}><strong>{lot.name}</strong><span>SKU {lot.sku} · Lô {lot.id}</span><span>Đến lịch báo lại {formatDisplayDate(lot.remindOn!)}</span></button>)}</div></> : <><h2>Chưa có thông báo</h2><p>Thông báo về hoạt động cửa hàng sẽ xuất hiện tại đây.</p>
    <button type="button" onClick={() => navigate("home")}>Mở trang chủ</button></>}
  </StorePageSurface></StorePageLayout>;
}
