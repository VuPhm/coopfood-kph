import { Bell, CalendarDays, FileText, FileWarning, History, House, type LucideIcon } from "lucide-react";

export type Screen = "home" | "kph" | "shelf" | "date" | "reports" | "notifications" | "login";
export type StoreAppScreen = Exclude<Screen, "login">;
type NavigationItem = { label: string; icon: LucideIcon };
type Feature = NavigationItem & { title: string; description: string; sidebarLabel: string; homeLabel: string };
type ScreenDefinition = {
  title: string;
  subtitle: string;
  leading: "brand" | "back";
  navigation?: NavigationItem;
  feature?: Feature;
};

/** One source for global chrome and destinations. Features still own their workflows. */
export const storeScreens = {
  home: { title: "Trang chủ", subtitle: "Cửa hàng hiện tại", leading: "brand", navigation: { label: "Trang chủ", icon: House } },
  notifications: { title: "Thông báo", subtitle: "Hoạt động cửa hàng", leading: "back", navigation: { label: "Thông báo", icon: Bell } },
  date: { title: "DATE", subtitle: "Tra mã hàng · Theo dõi lô", leading: "back",
    feature: { label: "DATE", title: "Quản lý DATE", sidebarLabel: "Quản lý DATE", homeLabel: "Quản lý DATE", description: "Tra mã hàng và theo dõi lô", icon: CalendarDays } },
  kph: { title: "KPH", subtitle: "Hàng không phù hợp", leading: "back",
    feature: { label: "KPH", title: "Hàng không phù hợp", sidebarLabel: "KPH", homeLabel: "KPH", description: "Ghi nhận và quản lý phiếu", icon: FileWarning } },
  reports: { title: "Báo cáo", subtitle: "Tồn kho theo DATE", leading: "back",
    feature: { label: "Báo cáo", title: "Báo cáo DATE", sidebarLabel: "Báo cáo", homeLabel: "Báo cáo", description: "Tạo báo cáo, quản lý mẫu và lịch sử", icon: FileText } },
  shelf: { title: "Tra cứu lùi hàng", subtitle: "NSX · HSD · hạn lùi", leading: "back",
    feature: { label: "Tra hạn", title: "Tra hạn lùi hàng", sidebarLabel: "Tra hạn lùi", homeLabel: "Tra cứu lùi hàng", description: "Kiểm tra NSX, HSD và hạn lùi", icon: History } },
  login: { title: "Đăng nhập", subtitle: "Tài khoản cửa hàng", leading: "brand" },
} as const satisfies Record<Screen, ScreenDefinition>;

const featureScreens = ["date", "kph", "reports", "shelf"] as const;
export type StoreFeatureScreen = typeof featureScreens[number];
export const storeFeatures = featureScreens.map(screen => ({ screen, ...storeScreens[screen].feature }));
export const storePrimaryNavigation = (["home", "notifications"] as const).map(screen => ({ screen, ...storeScreens[screen].navigation }));

export function isStoreFeature(value: string | null): value is StoreFeatureScreen {
  return storeFeatures.some(feature => feature.screen === value);
}
export function readStoreScreen(): Screen {
  const key = window.location.hash.slice(1);
  if (key === "lookup") return "date";
  return Object.hasOwn(storeScreens, key) ? key as Screen : "home";
}
