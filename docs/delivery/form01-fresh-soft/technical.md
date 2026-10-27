# FORM01 revision 4 — token nút và mép chrome, 24/10/2026

Owner nhận xét preview 4304 chưa hiệu quả trên mọi nút, đặc biệt nút xanh;
yêu cầu làm tổng thể token nút rồi áp tiếp vào mép khối trượt/sidebar/menu bar.
[Revision 3](revision3.md) là lịch sử; form revision 2 đã được owner chấp nhận,
revision 4 còn chờ owner xem. Không suy technical PASS thành nghiệm thu.

## Checkpoint

Candidate `d4f9d17d14ab6abbccaeb930c04ac5592cae8069` chứa source/test/docs đã kiểm trên production mock artifact.
Technical PASS revision4; owner pending. Sau checkpoint chỉ cập nhật ledger,
không đổi runtime. Build và QA ở trên chạy đúng source của checkpoint này.

## Phạm vi và quyết định

- Cùng nhánh `store-app/form01-fresh-soft`, một writer tại
  `/Users/vup/.codex/worktrees/form01-fresh-soft/coopfood-kph`.
- Giữ base hợp nhất `568c8cd2b320f0d1d33abb875cc8df15979e5516`, đã tích hợp đúng
  `816b4e33d27ef9512af05e5968511e6a29690536`. Header/navigation không đổi.
- Main giữ `f77034d`; chưa merge main/push/deploy. Không thay Pages, backend,
  API/authorization/storage, dependency, root config/lockfile hay palette global.
- Hiện chat này là integration owner duy nhất của `packages/ui/src/button.tsx`.
  Chỉ thêm metadata không trực quan, không thay class/props/default styling.
- So với production r3 tại 4304; production mock r4 tại
  <http://127.0.0.1:4306/#kph>, artifact `.local/form01/r4-build`.

**Co.op Fresh Soft** giữ triết lý: **Nền và khoảng cách tạo khối; viền nghỉ lùi
xuống; trạng thái giữ rõ.** [Quy chuẩn/token](../../product/STORE_APP_SURFACE_STYLE.md)
là nguồn chính, liên kết từ UI DNA, Visual DNA, Form Controls và Component Catalog.

## Implementation

- `store-button-system.css`: nguồn `--store-button-*` và role/state binding
  Store-local cho primary, secondary, ghost, danger, icon, selected, disabled.
  Primary xanh gradient nhẹ/mép sáng/bóng thấp; secondary dùng fill nhẹ và
  inset edge6% thay nét dày. Giữ border box, font, height, padding, hit target.
- `packages/ui/src/button.tsx`: thêm `data-slot`, `data-variant`, `data-size`;
  primary của shared Button giờ nối đúng token, không suy role từ text/utility.
  Native login/account/filter/retry, selection/tab/chip cũng dùng cùng recipe.
  DATE “Ghi nhận” vẫn cam; hero inverse/KPH nhãn loại giữ vai trò riêng.
- State giữ cue/check/aria/native disabled. Focus3px rõ; pressed tại chỗ, không
  translate/brightness. Dùng hai translate token0px vì minifier chuyển literal
  `translate:none` sang transform, làm active utility cũ vẫn dịch nút1px.
- Disabled không giảm opacity. Chữ và nền đổi đồng bộ khi bật lại; bỏ transition
  màu chữ và transition selected/disabled để tránh khoảnh khắc chữ xám trên xanh
  thiếu tương phản. Hover nền nút phụ vẫn chuyển nhẹ120ms.
- `store-chrome-soft.css`: nguồn `--store-layer-*` cho mép khối trắng trượt,
  modal/sheet, sidebar, menu mobile và report dock. Edge6%, highlight mảnh,
  bóng thấp sát mép; sidebar current stripe3px, menu giữ capsule/aria-current.
  Không đổi placement, border widths, kích thước hay scroll owner.
- `store-component-soft.css` tham chiếu token nút chung; `store-form-soft.css`
  bỏ shadow primary cũ để tránh hai nguồn. Frame/login import hai recipe mới.
- Reduced motion/transparency bỏ bóng; contrast more/forced colors dùng cue hệ
  OS và bỏ gradient. Print/chart/semantic status không nhận recipe mới.
- `check-store-button-system.cjs`: real CTA/state/disabled recovery, rendered
  contrast, selection, geometry parity và shared Button isolation ngoài Fresh.
- `check-store-scrollbars.cjs`: chờ KPH live; chờ scroll yên liên tục300ms trước
  reset precondition kéo thumb. Probe xác nhận wheel compositor còn chạy sau hai
  sample bằng nhau (y0→52→71), không phải CSS geometry thay đổi. Giữ nguyên
  assertion scrollY0, kéo native thumb, threshold và kiểm lock/restore.

## Bằng chứng kỹ thuật

Chromium headless, native scrollbar visible, synthetic/ignored data; không
Computer Use. Log/artifact dưới `.local/form01/r4-*`, không commit dữ liệu thật.

Task-local dependency links trước đó trỏ workspace package về main. Đã tách
ignored root node_modules thành links third-party cũ, riêng @coopfood-kph trỏ
package/app trong task để QA đúng source. Không install/đổi lockfile/main deps.
Các lượt dưới đây đều sau khi sửa link và xác nhận metadata Button thực tế.

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build --
  --outDir ../../.local/form01/r4-build --emptyOutDir`: PASS, `r4-build.log`.
- `VITEST_MAX_WORKERS=2 npm run verify`: PASS **334 tests** (Store281, Admin16,
  API2, rules19, UI16); docs/contracts/generated-client/types/build/PWA PASS.
  `r4-verify.log`. Cảnh báo chunk ExcelJS lớn đã có từ base.
- `STORE_PREVIEW_URL=http://127.0.0.1:4306 STORE_BASELINE_URL=http://127.0.0.1:4304
  node e2e/scripts/check-store-button-system.cjs`: PASS390×844,1440×1024,
  320×844,375×812,844×390. Normal/hover/pressed/focus text contrast≥4.5; actual
  bounding y không dịch khi nhấn; native/shared disabled giống nhau; bật lại
  đọc rõ ngay; geometry cap/sidebar/menu/modal/CTA giữ trong1px; reduced/contrast
  modes và ngoài Fresh giữ Button nền#006633 không gradient. `r4-buttons.log`.
- `STORE_APP_URL=http://127.0.0.1:4306 node e2e/scripts/check-shelf-refinement.cjs`:
  PASS main/quick390/1440/320: contrast/errors/picker/text150/focus. `r4-shelf.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4306 STORE_SCROLLBARS_OUTPUT=.local/form01/r4-scrollbars
  node e2e/scripts/check-store-scrollbars.cjs`: gate native bars 7 màn, dialogs,
  thumb drag, sidebar, lock/restore, no horizontal overflow ở390×844,1440×1024,
  1280×720,900×650,1440×500: **PASS** cả5 viewport, `r4-scrollbars.log`.

Các flow dưới đã PASS trên r4 sau sửa workspace links và translate; thay đổi
runtime cuối chỉ bỏ color transition/transition state, được gate nút mới và
verify ở trên kiểm lại. Reuse coverage interaction/geometry này vì không đổi
DOM, state, layout, handlers hay rule sau lượt đó; không dùng r3 làm bằng chứng
cho vật liệu primary mới.

- `STORE_PREVIEW_URL=http://127.0.0.1:4306 STORE_BASELINE_URL=http://127.0.0.1:4304
  STORE_COMPONENT_OUTPUT=.local/form01/r4-components node e2e/scripts/check-store-component-soft.cjs`:
  PASS5 viewport, rest/hover/selected/focus, filters/notification/picker/menu,
  contrast modes, chart/print parity. `r4-components.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4306 STORE_BASELINE_URL=http://127.0.0.1:4304
  STORE_CHROME_OUTPUT=.local/form01/r4-chrome node e2e/scripts/check-store-chrome.cjs`:
  PASS7 màn×390/1440/320, spacing/anchors/contrast/modal headers/chart/print.
- `STORE_PREVIEW_URL=http://127.0.0.1:4306 STORE_CREATE_FORMS_OUTPUT=.local/form01/r4-kph
  node e2e/scripts/check-kph-create-forms.cjs`: PASS2 loại×390/1440/320,
  linked errors/Other/calendar/photo bounds/recovery/review/focus. `r4-kph.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4306 STORE_DATE_OUTPUT=.local/form01/r4-date
  node e2e/scripts/check-date-actions.cjs`: PASS390/1440/320, reminder1/7,
  notifications/KPH prefill/cancel/review/save/single record/resolved.
- `STORE_PREVIEW_URL=http://127.0.0.1:4306 STORE_REPORT_OUTPUT=.local/form01/r4-report
  node e2e/scripts/check-report-fresh.cjs`: PASS390/1440/320, filter/kỳ/history/
  validation/selection/text150/focus/contrast. `r4-report.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4306 STORE_REPORT_OUTPUT=.local/form01/r4-selection
  node e2e/scripts/check-report-selection-dock.cjs`: PASS390/1440/320,
  selection scope/indeterminate/menu/nested select/focus/dock/short/text150.

`npm run check:docs` và `git diff --check`: PASS trước checkpoint.

Đã xem screenshot no-preference KPH form/filter390 và report/sidebar1440 ở
`r4-buttons/`: primary xanh có chiều sâu nhẹ, viền nghỉ mềm, text/check rõ,
canvas trắng/header816 vẫn giữ. Technical record không thay thế owner acceptance.

## Giới hạn và bước nhỏ tiếp theo

Memory-only/browser-local; chưa xác minh backend, Safari/Windows hay thiết bị
thật. Audit contrast có mục tiêu, không suy thành chứng nhận toàn bộ WCAG.
Owner xem4306: nút xanh Xem lại/Xong/Tạo báo cáo/Tra cứu, chọn filter, mở sheet,
so mép khối/sidebar/menu mobile và thử focus/disabled. Chưa merge main/push/deploy.

## Chuẩn bị tích hợp và vòng kế tiếp — 24/10/2026

Theo yêu cầu mới, [gói merge cùng816b4e3](merge-preparation-2026-10-24.md) đã
preflight sạch, không đổi runtime hoặc main. [Compact tùy chọn trong Cài đặt](compact-next-round.md)
là phạm vi chuẩn bị cho vòng sau, mặc định tắt; chưa triển khai hoặc đổi token
mật độ ở candidate này. Owner gate vẫn pending; không tự ghi nghiệm thu.
