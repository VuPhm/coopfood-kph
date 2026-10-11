# Tra hạn lùi — header và lớp cuộn chung

Ngày 11/10/2026. Owner yêu cầu áp dụng phong cách header/cuộn của Home cho
Tra hạn và từ giờ giữ thành phần xuyên suốt không lệch giữa các trang.
Technical PASS; hình ảnh mới chờ owner xem tại `http://127.0.0.1:5175/#shelf`.

## Quyết định và implementation

- `store-header.css` mới sở hữu gutter/top/size chung. Avatar 40px trong nút
  44px, góc phải cách top 14px; gutter 22px mobile, 16px khi dưới 360px, 36px
  desktop. Back dùng slot 44px. Mọi route Home/shelf/lookup/KPH/DATE dùng cùng
  hình học, avatar tròn và chữ căn giữa; tên/vai trò giữ trong sheet tài khoản.
  Navbar/rail không dịch vị trí.
- Đã bỏ rule avatar/account riêng cũ ở CSS base, desktop, Home và shelf.
  `StoreAccountControl` vẫn tách state mở modal, giữ tối ưu INP trước round này.
- `store-raised-surface` dùng chung cho Home và shelf: header gradient xanh
  sticky ở lớp 0; main trắng lớp 1, radius trên 25px, overlap 20px, min-height
  100dvh. Wheel/native page scroll đưa khối trắng lên phủ header, không listener
  scroll/translate hoặc vùng cuộn lồng. Focus vào control header đưa trang về đầu.
- Home giữ hero 186px, nội dung và decoration; shelf hero 166px, tiêu đề 25/32px,
  subtitle và back/context. Wrapper `store-shelf-page` giữ nội dung tối đa 1160px
  trên desktop trong nền trắng phủ toàn chiều rộng; form/result/history/glow,
  debounce/state và popup ẩn toolbar giữ semantics hiện có.
- Gate phát hiện lịch chọn ngày tràn màn ngang thấp khi cả trên/dưới anchor
  không đủ chỗ: clamp top trong viewport và max-height/scroll cho popover.
  Không đổi rule chọn ngày, validation hay domain/API. Có unit regression riêng.
- Visual DNA ghi yêu cầu lâu dài: feature CSS không override slot avatar,
  trang mới dùng header chung và phải thêm vào gate so sánh vị trí.

## Files trong round

`apps/store-pwa/src/store-header.css`, `store-app.tsx`, `store-app.css`,
`store-shelf-life.css`, `calendar-input.tsx`, `calendar-input.test.tsx`, `styles.css`;
`e2e/scripts/check-store-header.cjs`; `docs/product/STORE_APP_VISUAL_DNA.md` và
tài liệu này. Các thay đổi khác đã có trong worktree được giữ nguyên.

## Verification

- Store TypeScript/build PASS. `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2`:
  **175 tests / 23 files PASS**. Targeted calendar/session/shelf: 33 PASS.
- `node e2e/scripts/check-store-header.cjs`: PASS 390×844, 1440×1024, 320×740,
  768×1024, 844×390, 1024×768. So sánh x/y/width/height chính xác của avatar và
  nút tài khoản ở 5 route, shape tròn và căn giữa; back đồng nhất, navigation không dịch, title không
  chồng avatar. Đo native wheel/main/header, white surface hit-test phủ header,
  keyboard/account/focus/route reset, tự tra và picker trong viewport.
- Home scroll và shelf DNA gates PASS 5 viewport mỗi gate; toolbar gate PASS
  5 viewport, gồm popup ẩn công cụ dưới, state/focus và route. Không tràn ngang
  hoặc lỗi JS. Artifact đã xem tại `.local/store-header/`, `.local/shelf-header/`.
- `npm run check:docs`, `git diff --check` PASS. Vẫn ở nhánh
  `store-app/figma-mobile-implementation`, không commit/merge/deploy hoặc sửa
  Figma, API/domain, Pages ref/tag bảo tồn.

Giới hạn: mock, Chromium headless; chưa chứng nhận OS keyboard/safe-area thực
hoặc đo lại field INP. Không thêm animation hay công việc theo từng frame vào
header. Bước nhỏ tiếp theo: owner chuyển Home → Tra hạn → Tra cứu và cuộn Tra
hạn để xem tính ổn định của avatar và lớp trắng mới.
