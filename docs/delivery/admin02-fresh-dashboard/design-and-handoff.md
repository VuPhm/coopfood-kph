# ADMIN02 — Admin Fresh Shell & Tổng quan

Ngày: 09/11/2026. Source tham chiếu: ADMIN01 `029b0e72132bc105648a999089a8fd38f1632b92`.
Nhánh UI độc lập: `store-app/admin02-fresh-dashboard`.
Worktree: `/private/tmp/coopfood-kph-admin02`. Writer duy nhất: Codex /root. Không dispatch agent.
Remote ADMIN01 đã đối chiếu bằng `git ls-remote` trong phiên, HEAD khớp base. Main local ahead origin/main 3 commit như inventory; không lấy nhánh BE/visual cũ làm baseline. ADMIN01 worktree sạch lúc kiểm.

## Quyền thực hiện và phạm vi

User yêu cầu tự triển khai shell, overview, build/test/preview và tiếp tục cải thiện trong phạm vi UI; không cần prompt mới mỗi bước. Không tự push, merge, deploy hay nghiệm thu. Không can thiệp membership, backend/OpenAPI/database/deployment/Pages.
Đây là cycle UI song song với ADMIN01. Không sửa kế hoạch/trạng thái membership hoặc CURRENT_STATE/NEXT dùng chung trong lần UI này. Không chốt contract analytics hay quyền mới.

## Hướng hình ảnh

- Sidebar 232px (rail 76px), topbar 72px, gutter 30px, panel radius 12px; desktop-first với breakpoint 1280/1024/768.
- Fresh: xanh nhận diện `#087b55`, canvas trắng gần trắng, surface đặc, mép nhẹ, màu hổ phách cho attention, lam cho series đã duyệt. Typography system hiện có, số tabular.
- Glass chỉ ở sidebar/topbar, opacity cao + fallback đặc khi reduced transparency; không blur dữ liệu. Không nền gradient; gradient nhẹ chỉ dưới series biểu đồ.
- Reuse `packages/ui`: Dialog, DropdownMenu, Button, Field, Input, semantic labels. Không dependency mới, không sửa shared package/token Store.
- Sidebar chỉ có destination đã triển khai. Tổng quan mặc định; hash routes cho overview/identity/catalog/lifecycle, reload/back được giữ. Account menu dùng Radix, mobile nav dùng Dialog, icon rail giữ accessible name.
- Session chưa mô tả region assignment: probe GET lifecycle/targets để khám phá navigation scope; 403 ẩn Lifecycle, lỗi khác có retry. CHAIN_ADMIN không tự có Catalog. Backend tiếp tục quyết định mọi request.
- Identity đổi card lớn sang hàng compact; giữ self-deactivation guard, reason dialog, backend errors, session effect. Catalog/Lifecycle bỏ header riêng và dùng shell chung, giữ query/mutation/validation.

## Dữ liệu và tương tác

Overview mock ở `apps/admin-web/src/overview-mock.ts`, tách khỏi gateway/API, không merge cache thực. Tất cả dữ liệu cửa hàng/KPI/activity là synthetic. Snapshot mẫu cố định 09/11/2026 09:30 Asia/Ho_Chi_Minh; không dùng Date.now để giả freshness. “Chưa kết nối realtime” hiển thị rõ. Các workspace nghiệp vụ tiếp tục tải API theo yêu cầu, không gọi là realtime.

Kỳ 7/30 ngày đổi KPI/chart/table; tổng series ngày khớp table/KPI. Tìm cửa hàng/lọc chờ duyệt, empty state và chi tiết mẫu read-only. Biểu đồ có hai kiểu đường/legend, nút ngày có nhãn số liệu cho bàn phím và live readout. Không có nút refresh/xuất/duyệt giả.

## Tham chiếu đã đọc

Repository: CURRENT_STATE, NEXT, ENGINEERING_PRINCIPLES, baseline, contracts index, UI DNA/Visual DNA/Surface Style/component catalog, P01/P05/C01 và accepted ADR. Business/API/security giữ authority trên hình ảnh.

Nguồn bên ngoài đọc trong phiên:
- [shadcn Dashboard 01](https://ui.shadcn.com/blocks/dashboard): shell/sidebar, section cards, chart và data table.
- [Linear](https://linear.app/features): tham chiếu navigation/mật độ theo brief.
- [Vercel Analytics](https://vercel.com/docs/analytics): tham chiếu cách trình bày thống kê theo brief.
- [PostHog analytics](https://posthog.com/docs/web-analytics): tham chiếu activity/monitoring theo brief.
Đây là cảm hứng cấu trúc, không copy hệ thống hoặc thêm SDK tracking.

Skill ui-ux-pro-max: query design-system “enterprise operations dashboard compact” trả landing pattern off-topic; đã loại bỏ pattern đó, retry explicit product “analytics dashboard” có match Analytics Dashboard/Data-Dense Dashboard. Dùng tính rõ ràng/mật độ của match; palette và quyết định cuối theo Fresh/brief. Không persist output chưa xác minh.

## Preview và tiếp quản

URL: http://127.0.0.1:4175/#overview — Admin Fresh UI, backend tổng hợp P03 ở 8081.
- `chain.p03` / `admin-e2e-password`: Tổng quan + Tài khoản + Lifecycle. Không tự có Catalog.
- `region.p03` / `admin-e2e-password`: Tổng quan + Lifecycle đúng store B.
- Catalog đã kiểm bằng fixture riêng trong Playwright; seed P03 hiện không có CATALOG_ADMIN. Không tạo/cấp role để làm preview trông đủ menu.

Thử: đổi 7/30 ngày, tìm/lọc bảng, mở chi tiết mẫu, thu gọn sidebar; điều hướng Tài khoản/Lifecycle; account menu đổi mật khẩu/đăng xuất; mở menu mobile. Các hành động nghiệp vụ thật trong workspace tác động DB tổng hợp, vẫn có confirm/guard hiện có.

Runtime preview riêng qua launchctl `vn.coopfood.kph.admin02.app`, log `/tmp/coopfood-kph-admin02-preview/app.log`. Dừng riêng UI bằng `launchctl remove vn.coopfood.kph.admin02.app`. Backend P03 dùng lại từ bước trước, không dừng/seed lại runtime membership. Node deps symlink từ workspace gốc và nested workspaces, không sửa lockfile. Dist build trong worktree.

## Các bước nhỏ đã thực hiện

1. Assess + tạo worktree riêng từ ADMIN01 đã push.
2. Shell + overview mock, embed workspaces; thêm regression tests.
3. Browser/visual pass: tăng chữ phụ, compact Identity, fix mobile overflow từ sr-only table header bằng containing block, thêm hint cuộn bảng và responsive SVG.
4. Rebuild/retest, lưu technical evidence và checkpoint; owner acceptance chưa có.

Tiếp theo trong hướng UI đã giao: nhận phản hồi trực tiếp trên candidate để tinh chỉnh shell/composition. Analytics thật/capability discovery mới cần outcome/contract riêng, không suy từ mock. Không cần user viết lại brief cho các refinement UI trong phạm vi này.

## Ranh giới tích hợp về sau

HEAD ADMIN01 tham chiếu chưa có code membership. ADMIN02 không thêm/gỡ membership APIs hoặc làm thay tính năng đang được phát triển ở worktree khác. Vì shell thay composition của `apps/admin-web/src/app.tsx`, lần tích hợp về sau cần đưa destination membership vào seam AdminShell và giữ workflow/guards của nhánh membership; không cherry-pick đè cả app.tsx. Không tự làm bước tích hợp đó trong cycle UI này.
