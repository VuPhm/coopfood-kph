# PR #11 — review và tích hợp

Ngày 11/10/2026. PR: https://github.com/VuPhm/coopfood-kph/pull/11.
Owner yêu cầu trong chat: **“xem xét PR, draft, merge”**. Đây là quyền review,
tạo draft và merge khi verification đạt; không suy ra quyền deploy/cutover Pages
hoặc nghiệm thu trên thiết bị/cửa hàng thật.

## Phạm vi và quyết định

- Base `main`: `4fab6889f6cc6a7b66d25806262329cbf88ea024`, đã fetch origin.
- Checkpoint nhận review: `91f0c70c58d982842736c62f9cd2a22fe9e9d219`.
- Candidate code: `a0301b5` trên `store-app/figma-mobile-implementation`.
- Tích hợp UI DNA/Home/account/login, scrolling, navbar mobile, tiện ích DATE,
  KPH progressive loading, dialog chung và offline static PWA.
- Backend, OpenAPI, authorization, business rules, root lockfile và CI workflow
  không có thay đổi so với base. CI real API kiểm regression online.
- Tài liệu Co.op Fresh/KPH r11 phát sinh từ chat khác được giữ nguyên trong
  workspace; không đưa vào PR này. Canonical `plan.json` của follow-up đó vẫn
  giữ ownership và gate riêng. Báo cáo này tiếp tục phần integration của cycle.

## Finding và bản sửa

**P2 — backdrop bỏ qua chặn đóng form.** Shared Overlay được bọc bằng
`DialogPrimitive.Close`, nên click đóng trực tiếp dù `onInteractOutside` đã
preventDefault. Form KPH presentation screen có thể mất dữ liệu đang nhập.
Đã trả Overlay về primitive bình thường để Radix điều phối outside dismissal;
X/Escape và các modal cho phép bấm nền vẫn hoạt động.

Regression unit test fail trước fix, pass sau fix. Browser regression desktop
điền tên hàng, bấm nền và xác nhận form cùng giá trị còn nguyên. Các test cũ
được sửa để phát pointerdown rồi click như thao tác thực. Login gate production
được scope vào form để không nhầm status toast PWA. Không còn blocker được
xác nhận trong vòng review có mục tiêu này.

## Verification local

Runtime: Node 26.0.0, npm 11.12.1, Playwright 1.62.0, headless Chromium.
`npm run verify` exit 0: docs/contracts/generated API, TypeScript, **228 tests**
(Store 180, Admin 14, API 2, rules 19, UI 13), build. Bản sửa test backdrop
đã nằm trong SHA `9b323cd6afd21b485211927acd068cee32040f74` của lần chạy này.
`a0301b5` chỉ sửa selector trong browser script login; runtime/test unit không
đổi. Evidence này được tái sử dụng theo phạm vi đó.

Hai production build độc lập đã đạt:

```sh
VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir /Users/vup/Documents/coopfood-kph/.local/pr-integration/mock-dist
VITE_KPH_ONLINE=true VITE_STORE_APP_MOCK=false npm --workspace @coopfood-kph/store-pwa run build -- --outDir /Users/vup/Documents/coopfood-kph/.local/pr-integration/online-dist
```

Preview mock `4207`, online `4208`. Các script sau exit 0:

| Script trong `e2e/scripts/` | Phạm vi đã đạt |
| --- | --- |
| `check-modal-ui.cjs` | 5 viewport; focus, scroll lock, calendar/Escape, backdrop/X, bảo toàn form |
| `check-mobile-toolbar.cjs` | 5 viewport; active route, hit area, clearance, quick state/focus, login exclusion |
| `check-store-identity.cjs` | 5 viewport; tài khoản/login, password reveal/autocomplete, preview semantics |
| `check-home-scroll-layer.cjs` | 5 viewport; header đứng yên, mặt trắng cuộn phía trên, route reset |
| `check-login-scroll-layer.cjs` | 5 viewport; layering, focus/form, viewport thấp |
| `check-progressive-layout.cjs` | 390×844 và 1440×1024; skeleton/nội dung ổn định, ảnh responsive |
| `check-kph-loading.cjs` | 390×844 và 1440×1024, 1 sample; form/ảnh/review/duyệt/export, 25 rows/cards |
| `check-kph-online-loading.cjs` | 390×844 và 1440×1024; scoped request/prefetch dedupe, selection busy, lazy Excel |
| `check-kph-offline.cjs` | 390×844 và 1440×1024; SW thật, reload offline, lần đầu mở form/xuất Excel, không cache API |

5 viewport: 390×844, 1440×1024, 320×740, 768×1024, 844×390.
ENV mock: `STORE_PREVIEW_URL=http://127.0.0.1:4207`; modal dùng
`STORE_APP_URL=http://127.0.0.1:4207 PWA_FIRST_INSTALL=true`. Offline thêm
`STORE_BUILD_DIR=.local/pr-integration/mock-dist`. Online dùng port `4208`.
KPH loading thêm `KPH_LABEL=pr-integration KPH_SAMPLES=1`.
Logs ở `.local/pr-integration/`; screenshots do script tạo trong `.local/`,
chỉ fixture tổng hợp, không commit ảnh/dữ liệu vận hành.

## CI và bàn giao

CI frontend/backend của code `9b323cd` đã đạt ở run
https://github.com/VuPhm/coopfood-kph/actions/runs/38117138427.
CI cho HEAD cuối cùng được kiểm lại trước khi ready/merge; kết quả và merge SHA
được ghi trên PR. Draft không được merge khi CI fail/pending.

Giới hạn: lab browser, không nghiệm thu camera/keyboard/thiết bị/cửa hàng thật;
mock vẫn memory-only và reload mất thay đổi. Build còn cảnh báo chunk ExcelJS
trên 500 KB, đã lazy load nhưng phải precache để export lần đầu khi offline.
Bước tiếp theo: owner kiểm trực quan trên điện thoại; rollout KPH Co.op Fresh
tiếp tục theo kế hoạch riêng khi được yêu cầu.
