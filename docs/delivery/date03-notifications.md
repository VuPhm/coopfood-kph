# DATE03 follow-up / Thông báo DATE — 23/10/2026

User yêu cầu tiếp candidate4281: “bỏ phần đã xử lý, nó là kph”, rồi bắt đầu
Thông báo theo nhóm DATE; nhóm nguồn khác để sau. Tiếp tục cùng nhánh/worktree
và base630ec7b, một writer tại chat này. Không suy acceptance/merge cho DATE03
revision1; chỉnh list của r1 được giữ, phần resolved/notifications của evidence
r1 đã được thay bằng gate lượt này.

- Nhánh: `store-app/date03-compact-list`.
- Worktree: `/Users/vup/.codex/worktrees/date03-compact-list/coopfood-kph`.
- Base: `630ec7b06b369e566b3bd5c9326bebed82b22b72`.
- Thay runtime: `store-date-workspace.tsx`, `store-date-fresh.css`,
  `store-app.tsx`, `store-notifications.tsx`, model/CSS thông báo mới,
  `store-loading-frame.tsx`.
- Tests: DATE workspace/milestones/workflow, StoreApp, notification model/view;
  cập nhật browser DATE actions/navigation, thêm check-store-notifications.
- Docs: DATE model, navigation, contract index, Thông báo design, CURRENT/NEXT.

## Outcome và quyết định

DATE chỉ còn Mở/Đã ghi nhận, bỏ resolved khỏi cả hai list/count/filter. Nguồn
vẫn giữ resolved + kphRecordId cho báo cáo/link, không delete hoặc đổi ngày/
phase/%/KPH record. Gửi KPH lỗi/hủy không làm mất lô. Snapshot/report scope giữ.

Thông báo có module DATE và các nhóm Hết HSD/Đến hạn lùi/Cảnh báo/Cần kiểm tra
ngày/Đến lịch báo lại; chỉ nhóm có item xuất hiện. Native details thu/mở, item
trắng, count thực, click mở đúng lô. Acknowledged chờ ngày, đến lịch không lặp
thông báo phase; resolved rời thông báo. Dữ liệu từ state DATE hiện hành, chưa
event history/unread/push/backend. Nhóm nguồn khác sẽ thêm ở container module
khi có yêu cầu riêng, không thêm abstraction platform.

## Kiểm chứng

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS **333tests** (Store280/Admin16/
  API2/rules19/UI16), docs/contracts/generated API drift/types/default build/PWA.
  Log `.local/date03/r2/verify.log`.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa -- --outDir ../../.local/date03/build --emptyOutDir`:
  PASS production mock/PWA116precache; `.local/date03/r2/mock-build.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4281 STORE_NOTIFICATIONS_OUTPUT=.local/date03/r2/notifications node e2e/scripts/check-store-notifications.cjs`:
  PASS390×844/1440×1024/320×844, warning/withdrawal/expired/missing/reminder,
  thu/mở qua keyboard, đúng lô, hide đến lịch/due/không duplicate, contrast,
  text150/reduced-motion, DATE hai trạng thái và filter không Đã xử lý.
  Screenshot/contrast/results JSON trong output trên.
- `STORE_PREVIEW_URL=http://127.0.0.1:4281 STORE_DATE_OUTPUT=.local/date03/r2/actions node e2e/scripts/check-date-actions.cjs`:
  PASS390/1440/320, nhắc1/7ngày, due thông báo mở đúng detail; TPCN/TPTS
  prefill/hủy/review/gửi1phiếu PENDING; lô rời DATE/Thông báo, phiếu KPH có
  đúng lô; loại chưa biết vẫn cần chọn. Output gồm screenshot/results.
- `STORE_PREVIEW_URL=http://127.0.0.1:4281 STORE_KPH_COLORS_OUTPUT=.local/date03/r2/navigation-colors node e2e/scripts/check-store-navigation.cjs`:
  PASS390×844/1440×1024/320×740/768×1024/844×390: Home/features/navigation,
  recent/reload, nhóm DATE Thông báo, utility/dock/keyboard/overflow. Screenshot
  trong `.local/navigation/`, contrast trong output chỉ định.
- Danh sách DATE r1 giữ hướng %/NSX/HSD/nền trắng-selected; gate
  `check-date-list.cjs` PASS390/1440/320 trên preview4281, output `.local/date03/r2/list`.
- `npm run check:docs`, `git diff --check`: PASS sau cập nhật docs.

Đã xem screenshot mobile/desktop bằng công cụ ảnh. Contrast tại vùng thông báo
và control theo auditor hiện có (text≥4.5:1, focus≥3:1); không suy thành chứng
nhận toàn app. Preview cuối: <http://127.0.0.1:4281/#notifications> và
<http://127.0.0.1:4281/#date>. Technical PASS; **owner acceptance pending**.

Chưa commit/merge/push/deploy. Memory-only/reload reset; chưa backend/push/thiết
bị thật. Main/Pages không đổi. Bước nhỏ tiếp theo: owner xem nhóm Thông báo và
thử mở lô → Ghi nhận hoặc tạo KPH tại preview4281.
