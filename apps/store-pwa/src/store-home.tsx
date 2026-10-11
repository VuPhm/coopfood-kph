import { HomeModuleIcon, type Screen } from "./store-app-frame";
import { figmaAsset } from "./figma-assets";
import { assetUrl } from "./asset-url";

export function StoreHomeContent({ navigate, onKphIntent, openDateLots, pendingRecords }: {
  navigate: (screen: Screen) => void; onKphIntent?: () => void; openDateLots: number; pendingRecords: number;
}) {
  return <><div className="store-launcher store-launcher-mobile" aria-label="Công việc cửa hàng">
        {([
          ["date", "Quản lý DATE", "Quản lý DATE", "Theo dõi lô hàng cần xử lý"],
          ["kph", "KPH", "Hàng không phù hợp", "Ghi nhận và quản lý phiếu"],
          ["shelf", "Tra cứu lùi hàng", "Tra hạn lùi hàng", "Kiểm tra NSX, HSD và hạn lùi"],
        ] as const).map(([key, label, title, description]) => <button key={key} className={`store-module module-${key}`} aria-label={label} onPointerEnter={key === "kph" ? onKphIntent : undefined} onFocus={key === "kph" ? onKphIntent : undefined} onClick={() => navigate(key)}>
          <HomeModuleIcon screen={key} /><span className="store-module-copy"><strong>{title}</strong><small>{description}</small></span>
        </button>)}
      </div><div className="store-launcher store-launcher-desktop" aria-label="Công việc cửa hàng">{([
        ["lookup", "Tra cứu", "Tra cứu hàng hóa", "Sản phẩm và thông tin lô hàng"], ["kph", "KPH", "Hàng không phù hợp", "Ghi nhận và quản lý phiếu"], ["date", "DATE", "Quản lý DATE", "Theo dõi lô hàng cần xử lý"],
        ] as const).map(([key, label, title, description]) => <button key={key} className={`store-module module-${key}`} aria-label={label} onPointerEnter={key === "kph" ? onKphIntent : undefined} onFocus={key === "kph" ? onKphIntent : undefined} onClick={() => navigate(key)}><HomeModuleIcon screen={key} /><span className="store-module-copy"><strong>{title}</strong><small>{description}</small></span></button>)}</div><div className="store-home-panels"><section><h3>Cần chú ý hôm nay</h3><button onClick={() => navigate("date")}><span>DATE</span><strong>{openDateLots} cảnh báo đang mở</strong><b>Mở</b></button><button onClick={() => navigate("kph")}><span>KPH</span><strong>{pendingRecords} phiếu chờ duyệt</strong><b>Mở</b></button></section><section><span className="store-home-utility-icon"><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherCalendar")} alt="" /></span><div><strong>Tra hạn lùi hàng</strong><small>Tiện ích dùng chung</small></div><button onClick={() => navigate("shelf")}>Mở</button></section></div><div className="store-home-decoration" aria-hidden="true"><span className="store-home-leaf leaf-one" /><span className="store-home-leaf leaf-two" /><img className="store-home-art" src={assetUrl("brand/coopfood-home-basket-620.webp")} srcSet={`${assetUrl("brand/coopfood-home-basket-620.webp")} 620w, ${assetUrl("brand/coopfood-home-basket-920.webp")} 920w`} sizes="(min-width: 900px) 460px, (min-width: 500px) 360px, 310px" alt="" width={1536} height={1024} loading="lazy" fetchPriority="low" decoding="async" /><p className="store-home-motto"><span>An toàn</span><span>Tiện lợi</span><span>Tươi ngon</span><span>Mỗi ngày</span></p></div></>;
}
