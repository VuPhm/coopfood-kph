# Modal theo hộp tài khoản

Follow-up ngày 11/10/2026 trên `store-app/figma-mobile-implementation`, cùng
workspace/base HEAD `b1c772f4753ad13db1a7930a484ac7933b73b383`.
Owner phản hồi round trước chưa đồng bộ. Đã đọc implementation và xem screenshot
hộp tài khoản tại 390×844 và 1440×1024 trước khi chỉnh. Không thay kế hoạch,
domain/API/Figma, không commit/merge/deploy; giữ các thay đổi KPH loading hiện có.

## Thay đổi

- Shared `DialogHeader` dùng gradient tài khoản 115deg, xanh #008655 → #00a777,
  title trắng 16px/600, lề 24px và slot X. Default X inverse, inset 12px;
  backdrop/radius/motion/focus vẫn primitive chung. Body mặc định padding 24px.
- Sheet lọc/chi tiết và popup tra tách header/body. Body trắng, nhóm mint,
  controls radius 14px, spacing 18/24px; glow tra chỉ vẽ trong body, giữ state và
  debounce ở owner hiện có. Reduced motion bao phủ nội dung popup portal.
- Form tạo, cài đặt, lọc legacy/prototype, xác nhận và Admin nhận shared header;
  tạo/quét dùng cùng gradient và giữ bố cục thao tác. Viewer ảnh giữ biến thể media.
- Inset của content không padding được khai báo với specificity rõ ràng, tránh
  thứ tự CSS lazy import đẩy header/nút X ra ngoài. Gate đợi form lazy tải xong
  trước khi kiểm tra geometry, không nới assertion workflow.

## File của follow-up

`packages/ui/src/dialog.tsx`, `dialog.css`;
`apps/store-pwa/src/store-sheet.tsx`, `store-app.tsx`, `store-app.css`,
`store-shelf-life.css`, `styles.css`, `app.tsx`, `image-viewer.tsx`,
`ui-dna-prototype.tsx`, `ui-dna-prototype.css`;
`e2e/scripts/check-modal-ui.cjs`, `check-close-buttons.cjs`, `check-shelf-motion.cjs`,
`check-modal-inp.cjs`, `check-store-qa-repairs.cjs`;
Visual DNA và bản ghi trạng thái/bàn giao này. Không nhận ownership các thay đổi
có sẵn ngoài follow-up.

## Kiểm tra

- Store unit: `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2`:
  **180 PASS**; UI **12 PASS**, Admin **14 PASS**. TypeScript Store/Admin PASS.
- Store mock build riêng và Admin build PASS; chunk-size warning baseline.
  Lệnh Store: `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/modal-account-reference/build --emptyOutDir`.
- `check-modal-ui.cjs`: 5 viewport PASS trên dev và build (390×844, 1440×1024, 320×740, 768×1024,
  844×390), so computed gradient/title/padding/X với hộp tài khoản, no blur,
  scroll lock/focus/ESC/backdrop/calendar/state, account/KPH/DATE/create.
- `check-shelf-motion.cjs`: 2 viewport PASS, glow width/color, holder node/layout,
  finite pop và reduced motion. Assertion chỉ đếm animation đang chạy; animation
  fill kết thúc không phải công việc lặp.
- `check-close-buttons.cjs`: Store 3, Admin 2, PWA 2 viewport PASS;
  có scanner/viewer lồng. `check-store-header.cjs`: 6 viewport PASS, avatar không lệch.
- `check-store-qa-repairs.cjs`: 2 viewport PASS, tạo/xem lại/lưu/duyệt/xuất,
  SKU/UPC và DATE guards trên dev/build. Gate build bật `PWA_FIRST_INSTALL=true`,
  đợi service worker ready và đóng notice bằng X thật trước khi thao tác;
  không chặn service worker hoặc force click xuyên toast. Log unit/build/Playwright tại `.local/modal-account-reference/`;
  screenshot modal tại `.local/modal-unification/`, controls `.local/close-buttons/`.

## Hiệu năng lab

`PWA_FIRST_INSTALL=true STORE_PREVIEW_URL=http://127.0.0.1:5179 INP_LABEL=account-reference INP_EXPECT_NO_BLUR=true INP_CHECK_GEOMETRY=true node e2e/scripts/check-modal-inp.cjs`:
Chromium build, CPU 6×, 5 lần mở/modal/viewport, không chạy cùng build/test khác.
Geometry/focus/ESC/backdrop và filter persistence PASS; mọi overlay không blur.

| Modal | Mobile median / max | Desktop median / max |
| --- | --- | --- |
| Tra nhanh | 80 / 120 ms | 80 / 144 ms |
| Tài khoản | 48 / 160 ms | 64 / 256 ms |
| Lọc | 88 / 112 ms | 88 / 120 ms |
| Tạo | 120 / 128 ms | 144 / 152 ms |

Dữ liệu `.local/modal-inp/account-reference/results.json`. Đây là Event Timing
lab, không phải field INP; lần mở đầu tài khoản desktop vẫn vượt 200ms ở CPU 6×.
Đo trước sửa riêng grid-row scanner theo chiều cao nội dung; paint/backdrop/motion
của các modal được đo không đổi bởi sửa đó.

Technical verification và owner visual acceptance là hai việc riêng. Phần mới
chờ owner xem popup tra/lọc trên `http://127.0.0.1:5175/#kph`; thiết bị thật/
OS keyboard/safe-area chưa kiểm tra trong headless. Backdrop vẫn không blur,
không animation lặp hoặc listener mới; không suy ra field INP từ lab.
