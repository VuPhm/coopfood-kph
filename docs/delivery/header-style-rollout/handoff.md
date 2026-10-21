# Đồng bộ header Store App — 20/10/2026

Candidate mới nhất: [page kit xuyên suốt 22/10](page-kit-2026-10-22.md), thay các khung riêng bên dưới.

Follow-up mới nhất: [bộ khung global AppHeader/sidebar](global-frame-2026-10-21.md).

Tiếp nối 21/10: [Home, sidebar, mobile ba ô và Thông báo rỗng](navigation-2026-10-21.md) là scope mới nhất cùng nhánh/worktree.

Owner yêu cầu áp phong cách header Home và Tra hạn lùi cho các chỗ chưa áp,
sau đó xác nhận chỉ Store App hiện tại. Candidate đã triển khai, technical PASS;
chờ owner xem hình ảnh. Không coi kết quả kiểm tra là nghiệm thu.

- Branch: `store-app/header-01-style-rollout`; base `0041ac0`.
- Worktree: `/Users/vup/Documents/coopfood-kph/.local/worktrees/header-style-rollout`.
- Writer: `/root`; thay đổi chưa commit, không merge/deploy.
- Preview bản build: <http://127.0.0.1:4232/#kph> (DATE `#date`, Báo cáo `#reports`).

## Thay đổi và quyết định

Yêu cầu mới nhất: Home/đăng nhập/Tra hạn là dạng rộng có chủ đích; thêm dạng
trượt compact cho tác nghiệp. `StorePageHero` có `density="compact" | "spacious"`
(mặc định compact). Compact gom Back/title/avatar một hàng, h1 20/26px,
mô tả 12/16px và padding đến control 8px. Touch 44px, avatar 40px/anchor giữ
nguyên; chữ 150% tự reflow/tăng chiều cao. Desktop vẫn thấy tên cửa hàng cạnh
tiêu đề. Home/Tra hạn/login không dùng rule compact.

390px: nắp KPH y202 (trước y269), DATE y122 (trước y189), menu Báo cáo y66
(trước y146): lên thêm 67/67/80px. Đã xem screenshot desktop/mobile và 320px
chữ lớn. Kiểm cuối lượt compact: build/PWA PASS, 9 targeted tests/2 files PASS;
header sáu viewport, sticky KPH/DATE năm viewport, báo cáo 390/1440/320,
progressive Home/KPH 390/1440 zero shifts PASS. Full 229 tests đã chạy lại PASS sau tinh chỉnh composer mẫu đang mở (lượt mới nhất).


Tinh chỉnh thêm trang mở mẫu theo yêu cầu owner:

- `store-date-report.tsx` dùng StorePageHero trực tiếp: tên mẫu là h1, subtitle
  Báo cáo DATE, Back về menu mẫu; tìm/Đổi mẫu/Info trên cùng hàng xanh. Kỳ/phạm
  vi/danh mục/CTA ở `report-composer-cap`, overlap 12px, cuộn native phủ hero.
  Không dùng pull-to-dismiss hoặc thêm tab/listener gesture.
- `store-page-hero.tsx`/`store-app-frame.tsx` hỗ trợ header options từ consumer
  qua renderer (title/subtitle/Back/ref), vẫn một header và anchor account chung.
- `store-report-hub.tsx` bỏ wrapper header composer riêng để không lặp chrome.
  `store-report-composer.css` giữ compact tokens/44–48px touch, title wrap,
  settings/list cùng gutter; input border sáng trên xanh, focus input trắng,
  nút xóa dark trên input trắng. `store-report-template-picker.tsx` giữ nhãn
  Đổi mẫu ở 360px trở lên; dưới 360px chevron vẫn có accessible label/title.
- Header/tiêu đề/nav cũ bỏ, composer primary heading dùng tên mẫu; 390px nắp
  bắt đầu y122. Giữ nguyên apply/cancel picker/kỳ/selection và toàn bộ workflow.
- `check-report-header.cjs` kiểm hero/nắp/scroll/focus/one heading cùng flow cũ;
  `check-report-fresh.cjs` đồng bộ kỳ vọng border với query trên xanh như DATE.
- Kiểm cuối: build/PWA PASS; Store 229 tests PASS; header 6 viewport PASS;
  composer header/picker/60 mẫu/lịch/chữ 150% và report surface/Fresh/regression
  390/1440/320 PASS; toàn bộ lựa chọn, tạo/lưu/snapshot/xuất/in giữ gate cũ.
  Owner visual pending; preview cùng cổng 4232, vào Báo cáo rồi mở mẫu.

Owner phản hồi lượt đầu hiểu sai: cần hợp nhất nền xanh tác nghiệp đã có với
cấu trúc trượt, không thêm một khối header xanh riêng phía trên. Implementation
hiện tại thay bản tách hai hero đó.

- `apps/store-pwa/src/store-page-hero.tsx` mới: khối sticky duy nhất chứa header
  và control tác nghiệp. Context nhận header từ shell; không portal, không
  listener scroll, không nhân đôi header, không dựng copy nội dung phía sau.
- `store-app-frame.tsx`: giữ account/navigation ownership, chuyển header vào
  hero của KPH/DATE/Báo cáo. Home/Tra hạn giữ composition cũ.
- `store-header.css`: hình học shared, hero composed trong suốt ở phần header,
  bỏ min-height/đệm đáy riêng, gutter chung 22/16/36px. Nền xanh Fresh tác nghiệp
  `#00724e → #008655`, chữ trắng cho tương phản. Phần chừa navigation ở trong
  nắp trắng KPH/DATE để hero không unpin sớm ở màn ngang thấp/cuộn cuối.
- `store-kph-workspace.tsx`, `store-kph-loading.tsx`, `store-date-workspace.tsx`:
  dùng chung hero cho cả header và vùng tìm/CTA. Giữ region Tra mã hàng.
  `store-kph-fresh.css`, `store-date-fresh.css`: bỏ nền/sticky/pad lồng của vùng
  cũ, để wrapper chung sở hữu; giữ nắp/tab/list. Dạng compact có geometry
  hiện tại ghi ở trên.
- `store-report-hub.tsx`, `store-report-surface.tsx/.css`: menu/composer có header
  và một nắp trắng; lịch sử/chi tiết ghép header vào hero có sẵn. Composer vẫn
  không gesture. Print bỏ đệm vùng hero. `store-date-report.css` bỏ header riêng.
- `store-app.tsx`, `store-loading-frame.tsx`: placeholder/chunk failure giữ chrome;
  KPH skeleton/runtime dùng đúng cùng hero. `store-shelf-life.css` bỏ override
  chrome đã chuyển vào shared header, giữ reference Tra hạn.
- `store-sticky-tabs.tsx`: dự phòng pixel khi reveal focus dưới tab như lượt trước.
  `e2e/scripts/check-store-header.cjs`: kiểm một header/một nền, ghép không gap,
  cuộn phủ/focus/anchor/chữ 150%. Docs CURRENT_STATE/NEXT/Visual DNA/bàn giao cập nhật.

Không đổi API, contract, quyền hay semantics tạo/tìm/duyệt/xuất; không mở rollout
Admin/KPH online/Pilot. Candidate chưa được owner nghiệm thu.

## Kiểm chứng

Chạy từ worktree nêu trên:

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build`:
  PASS TypeScript/Vite/PWA; cảnh báo chunk ExcelJS lớn là baseline.
- `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2`:
  PASS 229 tests / 33 files sau khi ghép lại hero.
- `STORE_APP_URL=http://127.0.0.1:4231 node e2e/scripts/check-store-header.cjs`:
  PASS 390×844, 1440×1024, 320×740, 768×1024, 844×390, 1024×768;
  một hero/header, không gap/nền lồng, anchor/không chồng lấn, native layers,
  focus tài khoản/Back, route reset,
  tra hạn/calendar và chữ header 150% ở 390/1440/320.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-sticky-tabs.cjs`:
  PASS KPH/DATE × 5 viewport; slide/pin/đổi tab/focus/popup/chữ tab 150%/trở về.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-report-header.cjs`:
  PASS 390/1440/320; composer không tab, chọn tạm/hủy/đổi mẫu giữ kỳ,
  60 mẫu, lịch và chữ 150%.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-progressive-layout.cjs`:
  PASS Home/KPH × 390/1440, zero layout shifts và JS errors.
  Gate dùng chunk production; chạy dev server không chặn được entry nên không
  có ý nghĩa để kiểm skeleton, đã chạy lại đúng trên bản build.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-kph-sliding-cover.cjs`:
  PASS 5 viewport; cuộn/phủ/focus/tạo phiếu/empty/chữ 150%/route.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-date-sliding-cover.cjs`:
  PASS 5 viewport; cuộn/phủ/focus/metadata/empty/chữ 150%/route và contrast.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-report-surface.cjs`:
  PASS 390/1440/320; composer native scroll/giữ selection, lịch sử gesture/focus.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-date-report.cjs`:
  PASS 390/1440/320; tạo/lưu/lịch sử/snapshot/export Excel/print PDF và lỗi storage.
- Kiểm cuối lượt compact:
  `npm --workspace @coopfood-kph/store-pwa run test -- src/store-app.test.tsx src/store-date-workspace.test.tsx --maxWorkers=2`:
  PASS 9 tests / 2 files.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-login-scroll-layer.cjs`:
  PASS 5 viewport; dạng rộng/cuộn native, brand đứng yên, keyboard/form và reflow.
- `npm run check:docs`, `git diff --check`: PASS.

Screenshot cục bộ: `.local/store-header/`, `.local/sticky-tabs/check/`,
`.local/progressive-loading/check/`, `.local/reports-design/evidence-r14/header/`.
Đã xem trực quan hero KPH desktop/mobile, DATE mobile và lịch sử Báo cáo desktop/mobile.

## Giới hạn và bước tiếp theo

Kiểm Chromium headless, mock fixtures; chưa thiết bị thật/OS keyboard/safe-area
hoặc backend thật. Home/Tra hạn lùi là reference có sẵn, không đổi Figma.
Bước nhỏ tiếp: owner xem preview KPH → DATE → Báo cáo, cuộn và quay về header;
chốt hình ảnh trước checkpoint/tích hợp nếu muốn tiếp tục.
