# Sửa lệch desktop và hai dải xanh — 21/10/2026

Owner chưa đạt bản này; [page kit 22/10](page-kit-2026-10-22.md) thay toàn bộ khung rộng/gọn riêng.

Owner **chưa chấp nhận** bản global frame trước: dạng compact DATE/KPH lệch
so với Home/đăng nhập trên desktop; yêu cầu khung div cha chung và xử lý hai
khối xanh ở hai bên. Bản này là follow-up mới, chờ owner xem lại hình ảnh.

Cùng branch `store-app/header-01-style-rollout`, base `0041ac0`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/header-style-rollout`;
một writer `/root`, chưa commit/merge/deploy. Preview <http://127.0.0.1:4232/#kph>.

## Nguyên nhân đã tái hiện

KPH còn `max-width:1440px; margin-inline:auto` từ layout cũ, bao cả header và
nắp trắng. Ở viewport 1920px, cột main rộng 1672px nhưng KPH chỉ 1440px, thụt
116px mỗi bên. Header KPH bắt đầu x364 thay vì x248, Back x400 thay vì x284,
nút tài khoản x1724 thay vì x1840; nền xanh main lộ thành hai dải bên cạnh.
DATE/Home không có giới hạn tương tự. Gate trước chỉ đến viewport 1440px nên
không bắt được ngưỡng này; không dùng PASS trước làm bằng chứng cho màn rộng.

## Thay đổi

- `store-frame-canvas.css` mới: parent canvas width 100%, min-width 0, position
  relative/isolation. `StoreAppFrame` bọc cả header/main trong parent này;
  `StoreLogin` dùng cùng lớp canvas ở khung hai cột. Giữ login hai cột và toàn
  bộ semantics xác thực; không thêm tài khoản/sidebar vào login.
- `store-app-header.tsx`/`store-header.css`: `store-appbar-row` là một hàng grid
  chung chứa brand/Back, title/store và account. Header rộng/gọn dùng cùng hàng
  44px, cùng gutter và mốc top14px. Avatar tham gia grid, bỏ absolute top/right
  phụ thuộc block khác nhau. Phần welcome/tiêu đề rộng nằm dưới hàng này.
- `store-kph-fresh.css`: bỏ max-width/margin ngoài đã lỗi thời. Khung chứa
  AppHeader/hero/cover phải phủ hết main; chỉ phần nội dung bên trong mới được
  giới hạn chiều rộng khi có nhu cầu.
- `store-app-frame.css`, `store-kph-fresh.css`, `store-date-fresh.css`: root
  neutral/trắng; nền xanh giới hạn trong vùng trang thay vì tô root toàn app.
  `store-shelf-life.css` và raised-cover selector theo cấu trúc parent mới.
- `check-store-header.cjs`: thêm **1920×1080 và 2560×1440**; assert header và
  cover đúng x/width canvas, row top14, account sát mép hàng, ngoài các kiểm
  tra avatar/Back/focus/native scroll/chữ lớn hiện có.

Ảnh trước/sau 1440/1920 tại `.local/desktop-frame/` (ignored, dữ liệu mẫu).
Đã xem trực tiếp KPH/DATE 1920 sau sửa: không còn dải xanh hai bên nắp trắng,
header/Back/account về cùng anchor với Home. Home và login giữ bố cục rộng.

## Kiểm chứng

- Mock build TypeScript/Vite/PWA: PASS; warning chunk ExcelJS lớn là baseline.
- `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2`:
  PASS 233 tests / 34 files.
- `STORE_APP_URL=http://127.0.0.1:4232 node e2e/scripts/check-store-header.cjs`:
  PASS 8 viewport: 390×844, 1440×1024, 320×740, 768×1024, 844×390, 1024×768,
  1920×1080, 2560×1440; bounds/anchor/cover/focus/route và reflow.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-login-scroll-layer.cjs`:
  PASS 5 viewport, desktop hai cột/native cover, form/reveal/error/keyboard.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-progressive-layout.cjs`:
  PASS Home/KPH × 390/1440, zero layout shifts/JS error khi loading/live/form.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-report-header.cjs`:
  PASS 390/1440/320, dynamic title/Back, picker/kỳ/lịch/chữ 150%.
- `npm run check:docs` và `git diff --check`: PASS.

Giữ nghiệp vụ/API/quyền và phạm vi Store App hiện tại. Chưa nghiệm thu owner
hoặc thiết bị thật. Bước nhỏ tiếp: owner xem lại Home/DATE/KPH ở cùng chiều
rộng desktop, đặc biệt từ 1920px; không suy quyền tích hợp từ technical PASS.
