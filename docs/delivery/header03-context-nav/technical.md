# HEADER03 — AppHeader và điều hướng ngữ cảnh, 24/10/2026

Candidate chờ owner review; preview <http://127.0.0.1:4331/#home>.
Không merge/push/deploy. Technical gate: PASS334 tests (Admin16/Store281/API2/rules19/UI16), docs/contracts/API/types/build/PWA

## Base và scope

- Main `f77034d`, cây sạch lúc bắt đầu; giữ bản RPT02/UI02 đã duyệt.
- Nhánh `store-app/header03-context-nav`, worktree
  `/Users/vup/.codex/worktrees/header03-context-nav/coopfood-kph`, một writer.
- Yêu cầu owner24/10: bỏ “Trang chủ / Cửa hàng hiện tại”; Back không đường
  bao; desktop dùng kiểu điều hướng khác, không dùng nút quay lại. Owner nhắc
  lại bỏ hai dòng khi tab vẫn ở4278; đã gửi/mở preview mới4331 đúng worktree.
- Chỉ AppHeader + cấp parent của header mẫu báo cáo. Không redesign sidebar/
  mobile tabs, modal navigation, workflow/API/domain/auth/data/chart/Pages.

## Triển khai và quyết định

- `store-app-header.tsx`: Home không render subtitle, heading Trang chủ sr-only
  để giữ nhận biết trang bằng screen reader; logo/tài khoản/lời chào giữ.
  Desktop có nav/ol/current li và các ancestor; không dùng history.back.
- `store-app-frame.tsx`: Home ẩn copy; header feature có callback onBack thì
  chuyển cùng callback sang ancestor module. Không suy hierarchy từ tên mẫu,
  nên mẫu mang tên Báo cáo vẫn về đúng menu. Prop optional được omit khi vắng,
  hợp exactOptionalPropertyTypes; không đổi API component feature.
- `store-header.css`: mobile Back border0/background transparent kể cả hover,
  vẫn44px và outline focus. Từ900px ẩn Back, hai cột copy/account, dùng
  `Trang chủ › màn hiện tại`; mẫu có thêm Báo cáo. Ancestor44px, h1 current20/26,
  giữ72px/spacing/green/white cover; chữ lớn có thể tăng bar, tên dài ellipsis.
- Frame tests giữ identity/sidebar/account và callback; thêm case mẫu có tên
  trùng module. Page-kit/chrome assertions cập nhật đúng geometry responsive,
  giữ các check palette/contrast/overlap/focus/chart. Gate context mới kiểm
  DOMẩn copy, ancestor pointer/keyboard và kích thước44px, không chỉ screenshot.
- Docs FRAME/NAVIGATION/CURRENT/NEXT ghi candidate, chưa suy owner acceptance.

## Lệnh kiểm và evidence

Local macOS/Node, Playwright Chromium headless; mock/fixture tổng hợp, không
động dữ liệu vận hành. `.local/header03/` chứa logs/screenshots ignored.

```sh
VITEST_MAX_WORKERS=2 npm run verify
# PASS334 tests (Admin16/Store281/API2/rules19/UI16), docs/contracts/API/types/build/PWA

# Trong apps/store-pwa:
VITE_STORE_APP_MOCK=true npm exec vite -- build --outDir ../../.local/header03/build --emptyOutDir
npm exec vite -- preview --host 127.0.0.1 --port 4331 --strictPort --outDir ../../.local/header03/build
# PASS mock build/PWA,116 precache entries. EmptyOutDir loại asset build cũ.

# Từ root: STORE_PREVIEW_URL=http://127.0.0.1:4331 cho các gate production.
node e2e/scripts/check-store-page-kit.cjs
# PASS7màn×7viewport390/1440/1920/2560/320/768/844landscape:
# header72/grid44, anchors responsive, green/white/overlap, focus/scroll/
# skip-link/account/login và150% chữ; report custom-title/ancestor action
STORE_HEADER_OUTPUT=.local/header03/production-context node e2e/scripts/check-header-context.cjs
# PASS390/1440/320/900, native scrollbars: Home hidden copy/subtitle absent;
# plain mobile Back; desktop no Back, ancestor hit-test44px/keyboard/action;
# report parent callback, aria-current,150% reflow/contrast/no JS errors
STORE_BASELINE_URL=http://127.0.0.1:4332 STORE_CHROME_OUTPUT=.local/header03/production-chrome node e2e/scripts/check-store-chrome.cjs
# PASS7màn ở390/1440/320, contrast/modal headers/no hero blur/print white;
# exact timeline node+pseudo color/bg/border parity vs main build e5628ab

# Dev4330 trước sửa kiểu optional-prop (runtime callback không đổi):
STORE_PREVIEW_URL=http://127.0.0.1:4330 node e2e/scripts/check-store-navigation.cjs
# PASS390/1440/320/768/844: sidebar/tabs/recent/reload/notifications/utility/dock
STORE_PREVIEW_URL=http://127.0.0.1:4330 STORE_REPORT_OUTPUT=.local/header03/report-header node e2e/scripts/check-report-header.cjs
# PASS390/1440/320: đổi mẫu/cancel/kỳ giữ nguyên,60mẫu/pinned footer,
# calendar/focus/Escape,150% chữ/màn thấp620px.
# Coverage tái dùng: chỉ omit prop parent vắng thay vì truyền undefined;
# final production context/page-kit và frame unit kiểm lại parent action.

git diff --check
npm run check:docs
# PASS; contracts/packages/backend/report/domain/chart source unchanged.
```

Baseline4332 phục vụ `.local/ui02-rpt02-merge/build` main đã duyệt e5628ab;
các commit sau chỉ closure docs. Không test bằng preview4278 cũ. Đã xem ảnh
Home390, DATE1920, composer1440 và context có native scrollbar; không pixel
snapshot rộng. Nhánh giữ đúng nhiệm vụ, không chạm root config/lock/packages/ui.

## Nghiệm thu và giới hạn

Owner thử Home (không còn hai dòng copy), DATE mobile (mũi tên không khung),
DATE desktop (sidebar + đường dẫn Trang chủ), mẫu Báo cáo desktop (click cấp
Báo cáo về menu). Tài khoản/skip link/đổi mẫu và subtitle feature vẫn hoạt động.
Các arrow trong modal hoặc report content không thuộc AppHeader lần này.

Chưa kiểm iOS/keyboard OS thật; giữ giới hạn mock/memory-only/browser-local
của baseline. Không thêm blur/listener/dependency; không tuyên bố benchmark.
Bước nhỏ tiếp theo là owner review đúng preview4331, chờ quyết định trước merge.
