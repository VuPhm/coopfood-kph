# FORM01 revision 3 — mở rộng Co.op Fresh Soft, 24/10/2026

Owner chấp nhận form revision 2 và yêu cầu: “ổn, làm tiếp, áp dụng cho các thành
phần khác triết lý này, ghi lại triết lý này; pull `816b4e3` rồi làm tiếp”.
[Quyết định/acceptance revision 2](acceptance-revision2.md),
[evidence revision 2](revision2.md). Rollout mới còn chờ owner xem.

## Tích hợp và phạm vi

- Giữ cùng nhánh `store-app/form01-fresh-soft`, một writer tại
  `/Users/vup/.codex/worktrees/form01-fresh-soft/coopfood-kph`.
- Commit yêu cầu đã có local; merge đúng
  `816b4e33d27ef9512af05e5968511e6a29690536`, không lấy tip mới hơn của nhánh
  header. Source tự ghép; CURRENT_STATE/NEXT conflict ở đầu được giữ cả hai.
  Base hợp nhất `568c8cd2b320f0d1d33abb875cc8df15979e5516`.
- Main vẫn `f77034d`; không merge main/push/deploy, không đổi Pages/Admin/Pilot/
  online, backend/API/authorization/storage, packages/ui hoặc dependency.
- Baseline production mock từ base hợp nhất chạy 4303. Candidate build chạy
  <http://127.0.0.1:4304/#home>; khác port để owner thấy đúng artifact mới.

## Triết lý và implementation

**Nền và khoảng cách tạo khối; viền nghỉ lùi xuống; trạng thái giữ rõ.**
Tên **Co.op Fresh Soft**, mã `coop-fresh-soft-v1` giữ nguyên. Quy chuẩn bền vững,
role/state matrix và giới hạn được ghi tại
[Surface Style](../../product/STORE_APP_SURFACE_STYLE.md), liên kết từ UI DNA,
Visual DNA, Form Controls, Component Catalog và CURRENT_STATE/NEXT.

- `store-component-soft.css`: resting secondary actions/toolbar/filter chips có
  fill `#f0f7f3`, mép 6%, mép sáng/bóng thấp; hover chỉ fill `#e6f2eb`. Giữ box,
  font, height, padding và touch target hiện có.
- Nhóm filter/settings/reminder/Thông báo có mép nghỉ nhẹ/bóng thấp. Picker và
  divider lồng nhau giảm nét; popup sort/dropdown/calendar dùng mép nhẹ/bóng nổi.
- Selected/focus/error/native check, aria-state và semantic palette giữ riêng;
  bỏ nét kép ở selected nhưng vẫn giữ một edge/check rõ. Select đang mở có edge
  xanh riêng. Các holder trắng chính/Home/primary/header đã đúng vai trò được
  giữ; không áp cùng một border cho mọi thành phần hoặc nhuộm canvas trắng.
- Reduced motion/transparency bỏ bóng; increased contrast/forced colors dùng
  Canvas/CanvasText. Không thêm blur, animation shadow, listener hoặc state.
- `store-app-frame.tsx`, `store-login.tsx`: import recipe local, giữ logic/header 816.
- `check-store-component-soft.cjs`: kiểm geometry theo baseline đã tích hợp,
  rest/hover/selection/focus, nhóm Thông báo, picker, dropdown, chart/print parity
  và preference fallbacks. `check-store-chrome.cjs`/`check-header-context.cjs`
  chờ đúng route và màn live trước đo để không lấy DOM đang được React thay;
  không đổi threshold hay bỏ kiểm header/navigation.

## Technical evidence

Production artifact `.local/form01/r3-build`, synthetic/ignored, Chromium
headless; không Computer Use. Các log cùng prefix `r3-` trong `.local/form01/`.

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build
  -- --outDir ../../.local/form01/r3-build --emptyOutDir`: PASS, log `r3-build.log`.
- `VITEST_MAX_WORKERS=2 npm run verify`: PASS **334 tests** (Store 281, Admin 16,
  API 2, rules 19, UI 16), types/contracts/examples/generated client, hai builds/
  PWA. Log `r3-verify.log`; cảnh báo chunk ExcelJS lớn có từ base.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_BASELINE_URL=http://127.0.0.1:4303
  node e2e/scripts/check-store-component-soft.cjs`: PASS 390×844,1440×1024,
  320×844,375×812,844×390; rest/hover, kích thước giữ trong 1px, selected/focus,
  filters, Thông báo thu/mở→đúng lô, report picker/selection menu, native select
  open/Escape/focus; chart và print parity ở 390/1440/320. Log `r3-components.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_BASELINE_URL=http://127.0.0.1:4303
  STORE_FORM_OUTPUT=.local/form01/r3-forms node e2e/scripts/check-store-form-soft.cjs`:
  PASS 5 viewport; form đã duyệt giữ geometry, text/cue/focus/errors, readonly,
  login/reveal/recovery, chữ 150%, forced colors/increased contrast; negative
  audit fixtures vẫn reject. Log `r3-forms.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_HEADER_OUTPUT=.local/form01/r3-header
  node e2e/scripts/check-header-context.cjs`: PASS 390/1440/320/900;
  Home copy, mobile Back/desktop ancestor, report parent,44px/keyboard/chữ 150%.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_BASELINE_URL=http://127.0.0.1:4303
  STORE_CHROME_OUTPUT=.local/form01/r3-chrome node e2e/scripts/check-store-chrome.cjs`:
  PASS 7 màn×390/1440/320, khoảng cách/anchor/contrast, modal headers, chart parity/
  print. Log `r3-chrome.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_KPH_SYNTHETIC_ROUTE=false
  STORE_KPH_COMPACT_OUTPUT=.local/form01/r3-kph node e2e/scripts/check-kph-compact-history.cjs`:
  PASS 390/1440/320, grouping/select/collapse, flat dates, append/unique IDs/focus,
  detail/touch. Production mode không có Vite source route để inject fixture;
  không tuyên bố lượt này kiểm nhánh synthetic source injection. Log `r3-kph.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_DATE_OUTPUT=.local/form01/r3-date
  node e2e/scripts/check-date-actions.cjs`: PASS 390/1440/320; nhắc 1/7 ngày,
  due/Thông báo, đúng loại KPH/prefill/cancel/review/save/single record/resolved,
  chọn loại khi chưa rõ. Log `r3-date.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_REPORT_OUTPUT=.local/form01/r3-report
  node e2e/scripts/check-report-fresh.cjs`: PASS 390/1440/320, filters/kỳ/lịch sử,
  validation/selection, text150/focus và contrast. Log `r3-report.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_REPORT_OUTPUT=.local/form01/r3-selection
  node e2e/scripts/check-report-selection-dock.cjs`: PASS 390/1440/320; selection
  scope/indeterminate/menu, nested select/return focus, dock/short viewport/text150.
- `STORE_PREVIEW_URL=http://127.0.0.1:4304 STORE_SCROLLBARS_OUTPUT=.local/form01/r3-scrollbars
  node e2e/scripts/check-store-scrollbars.cjs`: PASS 390×844,1440×1024,1280×720,
  900×650,1440×500; 7màn, modal/picker native drag, lock/restore, no overflow.
- `npm run check:docs`, `git diff --check`: PASS trước checkpoint.

Đã xem screenshot no-preference KPH filter mobile và nhóm Thông báo desktop;
Home/filter/notification/picker 390/1440 lưu `r3-*.png`. Các scene không thêm blur;
header 816 và canvas trắng vẫn giữ. Không đổi runtime sau QA.

## Giới hạn và bước tiếp

Memory-only/browser-local, chưa kiểm backend hoặc Safari/Windows/thiết bị thật;
không suy test scoped thành chứng nhận WCAG. Owner xem 4304: toolbar/filter KPH,
DATE nhắc/Thông báo, Báo cáo settings/picker/selection/history, Tra hạn và login;
so sánh mép nghỉ với selected/focus. Bản mở rộng chưa merge main/push/deploy.
