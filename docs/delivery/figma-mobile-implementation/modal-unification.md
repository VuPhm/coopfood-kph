# Modal chung và popup tra có backdrop

Ngày 11/10/2026. Follow-up owner trên nhánh `store-app/figma-mobile-implementation`,
workspace `/Users/vup/Documents/coopfood-kph`, base HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Technical PASS; visual acceptance pending.
Các thay đổi có sẵn, gồm tối ưu state/lazy loading của round INP, được giữ nguyên.
Không commit/merge/deploy, không đổi Figma/API/domain/Pages ref.

## Implementation

- Popup tra dùng `DialogContent` chung thay panel tự viết. Portal nằm trên
  scrim không blur 55%; Radix khóa cuộn/trap focus/chặn trang phía sau và quản lý
  Escape/outside. Mở focus panel; đóng bằng X/Escape/backdrop trả focus FAB.
  Calendar branch tiếp tục chọn ngày được; Escape đóng calendar trước modal.
  Toolbar/FAB ẩn khi tra, hiện lại khi đóng. Route change vẫn đóng popup.
- State lookup/debounce vẫn do owner phiên hiện có giữ; modal unmount không reset
  input/mode/ngày/kết quả. Không tạo history cho popup, không đổi logic tính hạn lùi.
  Selector shelf dùng chung cho trang và portal để giữ form/glow đã chấp nhận.
- `packages/ui/src/dialog.css` gom scrim, radius 24px, shadow và finite opacity/scale.
  Motion vào 180ms/ra 120ms, overlay 150ms; reduced motion bỏ animation. Không blur,
  GPU hint persistent, công việc theo frame hay scroll handler cho backdrop.
- X dùng chung 44px/36px/20px, inset 12px; title chừa chỗ. Sheet lọc/chi tiết bỏ
  nút Đóng riêng; mobile bottom sheet, desktop centered. Account giữ hero xanh;
  create/scanner/viewer giữ biến thể workflow hiện có. Primitive dùng chung cũng
  áp dụng Admin. Overlay utility cũ bỏ blur; filter prototype dùng cùng Dialog.
- Cập nhật gate: offline notice đợi entry async render; locator ticket theo view
  đang hiển thị khi resize card/table. Không nới assertion nghiệp vụ.

## File đổi trong round

- UI: `packages/ui/src/dialog.tsx`, `dialog.css`, `dialog.test.tsx`.
- Store: `store-app.tsx`, `store-app.test.tsx`, `store-app.css`, `store-sheet.tsx`,
  `store-shelf-life.css`, `styles.css`, `expiry-dialog.tsx`,
  `ui-dna-prototype.tsx`, `ui-dna-prototype.css` trong `apps/store-pwa/src/`.
- Gate: `e2e/scripts/check-modal-ui.cjs`, `check-modal-inp.cjs`,
  `check-close-buttons.cjs`, `check-store-qa-repairs.cjs`.
- Contract hình ảnh: `docs/product/STORE_APP_VISUAL_DNA.md` và tài liệu này.

## Kiểm thử

- Store unit: `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2`:
  **177 PASS**. UI **12 PASS**, Admin **14 PASS**. Có regression backdrop và
  nested calendar Escape; session/route/reset/history vẫn đạt.
- Store build mock riêng và Admin build PASS. Warning chunk size baseline.
  Build local: `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/modal-unification/build --emptyOutDir`.
- `STORE_APP_URL=http://127.0.0.1:5179 node e2e/scripts/check-modal-ui.cjs`:
  **5 viewport PASS** (390×844, 1440×1024, 320×740, 768×1024, 844×390),
  shared scrim/chrome/radius, no blur, reduced motion, scroll lock/focus,
  date picker, auto lookup/state, backdrop/X, account/filter/detail/create/DATE.
- `check-close-buttons.cjs`: Store **3**, Admin **2**, PWA **2** viewport PASS,
  gồm scanner và viewer lồng, touch geometry/X/focus. `check-store-qa-repairs.cjs`:
  **2 PASS** create/review/save/approve/export, SKU/UPC, DATE guards, route/IDs.
- Toolbar gate **5 PASS**; header gate **6 PASS**, vị trí avatar/back/navigation
  không đổi. Screenshots đã xem tại `.local/modal-unification/`, `.local/close-buttons/`.

## Hiệu năng

Bản build, Chromium headless, motion bình thường, CPU 6×; 5 lần mở/modal/viewport; lượt cuối không chạy song song test/build khác.
Event Timing lượng tử hóa 8ms. Không lấy lab latency này làm field INP hoặc so sánh
phần trăm với dev. Dữ liệu `.local/modal-inp/unified-final/results.json`.

| Modal | Mobile median / max | Desktop median / max |
| --- | --- | --- |
| Tra nhanh | 96 / 128 ms | 88 / 152 ms |
| Tài khoản | 48 / 200 ms | 80 / 504 ms |
| Lọc | 56 / 96 ms | 72 / 144 ms |
| Tạo | 96 / 136 ms | 104 / 120 ms |

Backdrop tất cả đo được `backdrop-filter: none`; geometry/focus/ESC/outside và
filter persistence PASS. Lần mở đầu tài khoản vẫn có độ trễ trên 200ms ở CPU 6×;
không tuyên bố toàn hệ thống đạt field INP. Màn thật/OS keyboard/safe-area còn cần
owner kiểm tra. Bước nhỏ tiếp theo: thử popup tra mobile tại
`http://127.0.0.1:5175/#kph`, xem backdrop và đóng bằng X/nền phủ.
