# UI02 — rà soát/sửa scrollbar Store Fresh, 23/10/2026

Owner yêu cầu “tối ưu scroll bar, có lỗi hiển thị thanh scroll trên máy tính”,
sau đó xác nhận “rà soát hết”. Candidate, chưa owner acceptance/merge/push/deploy.
Base`3b0da6c`; nhánh`store-app/ui02-scrollbars`, worktree
`/Users/vup/.codex/worktrees/ui-scrollbars/coopfood-kph`; một writer, không team.
Main/Pages không thay đổi bởi task. Preview production mock:
<http://127.0.0.1:4295/#kph>.

## Phát hiện và cách sửa

- Playwright headless mặc định thêm `--hide-scrollbars`; gate cũ không lộ lỗi
  paint/geometry của native bar. Probe mở lại bars thấy thanh15px ở desktop.
- Chi tiết KPH cuộn cả outer dialog: bar chạy từ header xanh tới mép bo góc;
  filter dùng body riêng nên cách hiển thị lệch nhau. Tạo phiếu và tiện ích ẩn
  bar dù nội dung dài. Giữ native scrolling, thống nhất thumb mảnh trung tính.
- Từ900px, popup StoreSheet/tiện ích/tài khoản cuộn trong body và clip outer;
  header/close đứng yên. Choice sheet giữ search/actions, chỉ results cuộn.
  Footer KPH/DATE không hở đệm dưới body. Mobile composition không đổi.
- Form tạo/review/loading có scrollbar desktop kéo được. Sidebar chỉ hiện bar
  khi cửa sổ thấp. Không ép thanh ngang trên bảng KPH; tags mobile tiếp tục cuộn
  ngang/ẩn bar theo thiết kế được duyệt.
- Bù biến gap do Radix cung cấp cho nút nổi khi body bị khóa, tránh giật ngang;
  không tự thay lock/focus/portal. High contrast dùng bar đầy đủ và màu hệ thống.

## Files

- `apps/store-pwa/src/store-scrollbars.css`: style và composition scoped desktop,
  WebKit fallback, high contrast, fixed action compensation.
- `apps/store-pwa/src/store-app-frame.tsx`: import stylesheet chung.
- `e2e/scripts/check-store-scrollbars.cjs`: bật bars thật,7màn/5viewport,
  native drag/root/sidebar/modal/results, body lock/restore, header/close/footer,
  focus, không x-shift/x-overflow, high contrast và mobile tags.
- `docs/product/STORE_APP_FRAME.md`, CURRENT_STATE/NEXT và bàn giao này.

## Kiểm tra

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/ui02-scrollbars/build --emptyOutDir`:
  PASS TypeScript/build/PWA. Log `.local/ui02-scrollbars/build.log`; ExcelJS
  chunk warning là baseline, không thêm dependency.
- `STORE_PREVIEW_URL=http://127.0.0.1:4295 STORE_SCROLLBARS_OUTPUT=.local/ui02-scrollbars/production-browser node e2e/scripts/check-store-scrollbars.cjs`:
  PASS390×844,1440×1024,1280×720,900×650,1440×500. Home/KPH/DATE/Thông báo/
  Báo cáo/Tra hạn/login; filter/account/detail/create/quick, report picker và
  DATE filter. Chromium launch `ignoreDefaultArgs: ['--hide-scrollbars']`;
  native thumb drag thực bằng mouse, không thay bằng scrollTop để chứng minh
  drag. ScrollTop chỉ dùng để tới cuối sau drag và reset. Root/background lock,
  return focus, header/footer bounds, no horizontal overflow và forced-colors.
  Log `.local/ui02-scrollbars/production-browser.log`; ảnh/JSON cùng thư mục.
- URL4295 + `STORE_KPH_SYNTHETIC_ROUTE=false STORE_KPH_COMPACT_OUTPUT=.local/ui02-scrollbars/kph-regression node e2e/scripts/check-kph-compact-history.cjs`:
  PASS390/1440/320, grouping/select/append/focus/OTHER/detail/native tag swipe.
- URL4295 + `node e2e/scripts/check-store-chrome.cjs`: PASS390/1440/320,
 7màn, spacing/anchor/contrast, modal/composer header, chart parity và print.
- `npm run check:docs`, `git diff --check`: kiểm cuối sau cập nhật docs.

Đã xem ảnh detail1280×720, form/account/report picker1440×500; thanh trong body,
header và close không trôi, không che hành động. Baseline probes/logs nằm trong
`.local/ui02-scrollbars/`; không dùng Computer Use.

## Giới hạn / bước tiếp

Chỉ CSS/import và browser gate; không đổi nghiệp vụ, API, authorization, source
backend hoặc shared package. Không thêm tests unit chỉ để mirror CSS; build và
interaction gate kiểm trực tiếp thay đổi. Không coi đây là đo production hoặc
kiểm Safari/Windows/thiết bị thật. Store Fresh vẫn memory-only.

Owner xem4295 ở desktop: cuộn trang, mở chi tiết KPH/bộ lọc/tạo phiếu/tiện ích,
kéo thumb, thu cửa sổ thấp và đóng bằng Escape. Chưa merge/deploy.
