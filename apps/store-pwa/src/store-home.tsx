import { StorePageLayout, StorePageHero, StorePageSurface } from "./store-page-hero";
import type { StoreProfile } from "./store-profile";
import { Bell, ChevronRight } from "lucide-react";
import type { Screen } from "./store-app-routes";
import { storeFeatures } from "./store-app-routes";
import "./store-home.css";

export function StoreHomeContent({ profile, navigate, onKphIntent, openDateLots, pendingRecords }: {
  profile: StoreProfile; navigate: (screen: Screen) => void; onKphIntent?: () => void; openDateLots: number; pendingRecords: number;
}) {
  return <StorePageLayout className="store-home-page"><StorePageHero><div className="store-home-welcome"><span>Xin chào,</span><h2>{profile.fullName}</h2><p>Cửa hàng: {profile.storeCode} · {profile.storeName}</p></div></StorePageHero><StorePageSurface className="store-home-surface"><section id="store-home-features" className="store-home-features" aria-labelledby="store-home-features-title">
    <div className="store-home-section-heading"><div><h2 id="store-home-features-title">Công việc cửa hàng</h2><p>Chọn tính năng để bắt đầu</p></div><button type="button" aria-label="Thông báo" onClick={() => navigate("notifications")}><Bell size={21} aria-hidden="true" /></button></div>
    <div className="store-launcher store-launcher-grid" aria-label="Công việc cửa hàng">
      {storeFeatures.map(({ screen, title, description, homeLabel, icon: Icon }) => <button key={screen} className={`store-module module-${screen}`} aria-label={homeLabel}
        onPointerEnter={screen === "kph" ? onKphIntent : undefined} onFocus={screen === "kph" ? onKphIntent : undefined} onClick={() => navigate(screen)}>
        <span className="store-module-icon"><Icon size={28} strokeWidth={1.8} aria-hidden="true" /></span><span className="store-module-copy"><strong>{title}</strong><small>{description}</small></span>
      </button>)}
    </div>
  </section><section className="store-home-attention" aria-labelledby="store-home-attention-title"><h2 id="store-home-attention-title">Cần chú ý hôm nay</h2>
    <button type="button" onClick={() => navigate("date")}><span className="store-home-attention-kind">DATE</span><strong>{openDateLots} cảnh báo đang mở</strong><ChevronRight size={18} aria-hidden="true" /></button>
    <button type="button" onClick={() => navigate("kph")}><span className="store-home-attention-kind">KPH</span><strong>{pendingRecords} phiếu chờ duyệt</strong><ChevronRight size={18} aria-hidden="true" /></button>
  </section></StorePageSurface></StorePageLayout>;
}
