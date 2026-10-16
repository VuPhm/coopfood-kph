# KPH — nắp trượt từ tab trở xuống, 14/10/2026

## Follow-up: tìm kiếm trước CTA, solid sáng

Owner yêu cầu đưa tìm kiếm lên trước CTA, tối ưu spacing dọc và làm CTA solid
nhẹ/sáng trên nền xanh tối. Đổi thứ tự DOM ở workspace **và skeleton** thành
tìm/quét → hai CTA → nắp từ tab trở xuống; thứ tự bàn phím theo bố cục.
Padding trên underlay 12 px mobile / 16 px desktop; tìm → CTA và CTA → nắp
đều 8 px. Vùng chạm/input, cỡ chữ, nội dung phiếu và nắp trượt giữ nguyên.

CTA TPCN dùng `--store-module-orange` (#fff0e6), chữ/icon
`--store-warning-ink`; TPTS dùng `--store-module-mint` (#e6f7f2), chữ/icon
`--store-brand-action`. Nền đặc không gradient; icon holder trong suốt,
hover có viền đậm và pressed inset theo currentColor, focus trắng trên xanh.

Runtime: `apps/store-pwa/src/store-kph-workspace.tsx`, `store-kph-loading.tsx`,
`store-kph-fresh.css`. Browser gate `e2e/scripts/check-kph-sliding-cover.cjs`
kiểm gap tìm/CTA và CTA/nắp. Docs CURRENT_STATE/NEXT và tài liệu này cập nhật.
Không đổi form, API/backend, shared UI hoặc DNA accepted.

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-search-first/build --emptyOutDir`:
  TypeScript/build/PWA PASS, warning chunk lớn có sẵn.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-kph-workspace.test.tsx src/store-app.test.tsx --maxWorkers=2`:
  **11 tests / 2 files PASS**.
- `node .local/kph-search-first/check.cjs`: PASS 390×844/1440×1024/320×740,
  DOM order, gap 8 px, palette solid, keyboard search → scan → CTA, text
  ≥4,5:1, input boundary/focus ≥3:1, hover. Đã xem screenshot mobile/desktop.
- Với `STORE_PREVIEW_URL=http://127.0.0.1:4218`, chạy
  `node e2e/scripts/check-kph-sliding-cover.cjs`: PASS năm viewport,
  gồm 150% chữ/focus/empty list; `node e2e/scripts/check-kph-fresh.cjs`: PASS
  390/1440/320 về tìm/chọn/tạo phiếu/modal focus;
  `node e2e/scripts/check-progressive-layout.cjs`: PASS Home/KPH 390/1440,
  geometry ≤1 px, không layout shift, cả form loading.
- `npm run check:docs` và `git diff --check`: PASS.

Evidence/build: `.local/kph-search-first/`. Preview **4215** trỏ bản mới,
4218 dùng kiểm tra. Build nền xanh/CTA tối trước tại
`.local/kph-green-underlay/build` giữ nguyên để so sánh/quay lại.
Owner/device acceptance pending. Bước nhỏ tiếp theo: tải lại 4215, xem tìm
trước CTA và thử cả hai nút. Không checkpoint/push/merge/deploy/nhân rộng DATE.

## Follow-up: toàn bộ lớp dưới nền xanh

Owner yêu cầu tối ưu toàn bộ nền xanh của lớp dưới nắp. Header, nền app/main
và underlay thống nhất `--store-brand-start` (`#00724e`), bỏ góc bo giữa header
và underlay để xanh liền mạch. Nắp từ tab xuống vẫn trắng. CTA giữ cam/xanh,
viền trắng 65% phân biệt trên nền xanh; ô tìm dùng viền sáng `--store-line`;
outline upper controls/header trắng. Nội dung, geometry và cuộn không đổi.

Runtime chỉ sửa `apps/store-pwa/src/store-kph-fresh.css`; CURRENT_STATE/NEXT
và tài liệu này cập nhật evidence. Build mới tại `.local/kph-green-underlay/build`
đã thay preview **4215**; bản nắp trước `.local/kph-sliding-cover/build` giữ riêng.

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-green-underlay/build --emptyOutDir`:
  TypeScript/build/PWA PASS, warning chunk lớn có sẵn.
- `node .local/kph-green-underlay/check.cjs`: PASS 390×844, 1440×1024,
  320×740; xanh đồng nhất/nắp trắng, text ≥4,5:1, input boundary/focus ≥3:1,
  focus trắng và hover. Screenshot/results tại `.local/kph-green-underlay/`;
  đã xem initial mobile.
- Với `STORE_PREVIEW_URL=http://127.0.0.1:4217`, chạy
  `node e2e/scripts/check-kph-sliding-cover.cjs`: PASS năm viewport; chạy
  `node e2e/scripts/check-progressive-layout.cjs`: PASS Home/KPH 390/1440,
  geometry ≤1 px, không layout shift. Sau đó chỉ sửa màu viền ô tìm và ưu tiên
  cascade outline; đã build/contrast/focus lại bản cuối, geometry không đổi.
- `npm run check:docs` và `git diff --check`: PASS.

Owner/device acceptance pending; bước nhỏ tiếp theo: tải lại 4215 và xem lớp
xanh khi nắp trượt. Bố cục và evidence trước follow-up được giữ bên dưới.

Owner yêu cầu áp dụng nắp trượt cho phần từ tab trở xuống trên bản compact.
Tiếp tục task `store-app/figma-mobile-implementation`, base `5fdfa3e`, worktree
`/Users/vup/Documents/coopfood-kph`, writer Codex. Giữ các follow-up có trước;
không checkpoint, push, merge, deploy hoặc sửa Figma/DNA accepted.

## Cơ chế

- CTA tạo phiếu và tìm/quét nằm trong `store-kph-underlay`, nền canvas, sticky
  `top: 0`. Header vẫn cuộn theo trang; underlay bám đỉnh sau khi header đi qua.
- `store-ticket-list` là nắp trắng bo góc 24 px: bắt đầu trước tab, chứa tab,
  tiêu đề/số phiếu, sort/chọn/lọc, batch, danh sách và phân trang. Nắp ở lớp
  trên, cuộn lên che underlay và cuộn về đầu để hiện lại. Shadow nhẹ phân lớp.
- Giữ cuộn document tự nhiên, không thêm scroll container hoặc listener/motion
  theo scroll. Nắp tối thiểu một viewport để vẫn trượt được khi search không
  có phiếu. Bố cục compact/nội dung và kích thước thẻ/dòng giữ nguyên;
  thêm 8 px trước nắp để không che focus ring ô tìm/quét lúc ở đầu trang.
- Focus bàn phím vào CTA/tìm/quét hoặc header đang bị che đưa trang về đầu;
  focus ở list/sort/filter giữ cuộn tự nhiên. Dialog và loading giữ primitive
  hiện có. Skeleton dùng cùng wrapper và CSS.

Runtime: `apps/store-pwa/src/store-kph-workspace.tsx`, `store-kph-loading.tsx`,
`store-kph-fresh.css`, `store-app-frame.tsx`.
Browser gate: `e2e/scripts/check-kph-sliding-cover.cjs`.
Docs: CURRENT_STATE, NEXT và tài liệu này. Không đổi DATE/Home composition,
shared UI, API/backend, dữ liệu hoặc semantics nghiệp vụ.

## Kiểm chứng

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-sliding-cover/build --emptyOutDir`:
  TypeScript/build/PWA PASS, warning chunk lớn có sẵn.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-kph-workspace.test.tsx src/store-app.test.tsx --maxWorkers=2`:
  **11 tests / 2 files PASS**.
- Với `STORE_PREVIEW_URL=http://127.0.0.1:4216`:
  `node e2e/scripts/check-kph-sliding-cover.cjs` PASS ở **390×844,
  1440×1024, 320×740, 768×1024, 844×390**. Wheel scroll thật: underlay đứng
  đỉnh, nắp dịch đúng scrollY/hit-test che vùng dưới; copy phiếu giữ nguyên;
  focus/create/Escape/search/header reveal, empty list, 150% chữ, route reset,
  không overflow/page errors. Kiểm khoảng hở focus ring 8 px.
- `node e2e/scripts/check-progressive-layout.cjs` trên cùng URL:
  Home/KPH 390/1440 PASS, geometry ≤1 px và không layout shift, cả loading form.
- `node e2e/scripts/check-kph-fresh.cjs` và
  `node e2e/scripts/check-kph-filter-sort.cjs`: PASS 390/1440/320 về tìm/chọn/
  tạo phiếu/modal focus/sort/filter/calendar/contrast. Sau đó chỉ thêm khoảng
  hở 8 px cho focus; đã chạy lại cover/progressive và build bản cuối.
- `npm run check:docs` và `git diff --check`: PASS.

Screenshot/results: `.local/kph-sliding-cover/check/`; đã xem initial/midway
mobile và raised desktop. Fixture tổng hợp, browser headless; owner visual/
device acceptance còn pending.

## Preview và bước nhỏ tiếp theo

**http://127.0.0.1:4215/#kph** đã trỏ build mới; 4216 dùng kiểm tra cùng build.
Build compact trước tại `.local/kph-compact-controls/build` được giữ nguyên,
bản trước compact ở 4213 cũng giữ nguyên.

Bước nhỏ tiếp theo: owner tải lại 4215, cuộn từ tab lên che CTA/tìm kiếm rồi
cuộn về đầu; thử Chọn/Lọc. Muốn quay lại: bỏ wrapper/handler nắp ở hai
workspace/loading, bỏ block CSS nắp cuối file và handler KPH ở frame, hoặc
chạy Vite preview với build compact trước. Không nhân rộng sang DATE.
