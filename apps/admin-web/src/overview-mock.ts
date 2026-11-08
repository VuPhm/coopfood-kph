// Synthetic UI data only. Never combine with session scope, live API results or mutations.
export type OverviewRange = 7 | 30;
export const mockSnapshot = "2026-11-09T09:30:00+07:00";
export const mockStores = [
  { code: "DEMO-001", name: "Cửa hàng An Phú", region: "Khu vực mẫu A", submitted: 46, reviewed: 39, attention: 7, status: "Cần xem xét" },
  { code: "DEMO-002", name: "Cửa hàng Bình An", region: "Khu vực mẫu A", submitted: 38, reviewed: 36, attention: 2, status: "Theo dõi" },
  { code: "DEMO-003", name: "Cửa hàng Tân Phong", region: "Khu vực mẫu B", submitted: 52, reviewed: 52, attention: 0, status: "Đã xử lý" },
  { code: "DEMO-004", name: "Cửa hàng Phú Mỹ", region: "Khu vực mẫu B", submitted: 31, reviewed: 28, attention: 3, status: "Theo dõi" },
];
const submitted = [18, 23, 19, 31, 25, 28, 23];
const reviewed = [16, 19, 18, 26, 24, 27, 25];
export function overviewMock(range: OverviewRange) {
  const factor = range === 7 ? 1 : 4;
  const stores = mockStores.map(s => ({ ...s, submitted: s.submitted * factor, reviewed: s.reviewed * factor, attention: s.attention * factor }));
  const points = Array.from({ length: range }, (_, index) => ({
    date: new Date(Date.UTC(2026, 10, 10 - range + index)).toISOString().slice(0, 10),
    submitted: range === 7 ? submitted[index]! : 12 + (index * 13 % 25),
    reviewed: range === 7 ? reviewed[index]! : 10 + (index * 11 % 22),
  }));
  // Normalize each daily series to the same totals shown by KPI and table.
  for (const key of ["submitted", "reviewed"] as const) {
    const target = stores.reduce((n,s) => n + s[key], 0);
    const rawTotal = points.reduce((n,p) => n + p[key], 0);
    let cumulative = 0, assigned = 0;
    for (const point of points) {
      cumulative += point[key];
      const next = Math.round(cumulative / rawTotal * target);
      point[key] = next - assigned;
      assigned = next;
    }
  }
  return { stores, points, submitted: stores.reduce((n,s) => n+s.submitted,0), reviewed: stores.reduce((n,s) => n+s.reviewed,0), pending: stores.reduce((n,s) => n+s.attention,0) };
}
export const mockActivities = [
  { time: "09:28", title: "Phiếu KPH được duyệt", detail: "Cửa hàng Tân Phong · Phiếu DEMO-052", type: "success" },
  { time: "09:24", title: "Ghi nhận phiếu KPH mới", detail: "Cửa hàng An Phú · Phiếu DEMO-046", type: "info" },
  { time: "09:16", title: "Cập nhật xử lý phiếu", detail: "Cửa hàng Bình An · Phiếu DEMO-038", type: "neutral" },
  { time: "09:05", title: "Ghi nhận phiếu KPH mới", detail: "Cửa hàng Phú Mỹ · Phiếu DEMO-031", type: "info" },
];
