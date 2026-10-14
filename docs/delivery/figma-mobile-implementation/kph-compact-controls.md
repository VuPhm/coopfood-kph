# KPH — thử compact khu chức năng, 14/10/2026

Owner yêu cầu compact thành phần chức năng, giữ nội dung; chọn **KPH trước**.
Tiếp tục task/worktree `store-app/figma-mobile-implementation` tại
`/Users/vup/Documents/coopfood-kph`, base `5fdfa3e`, writer Codex. Các thay đổi
working tree có trước được giữ nguyên. Đây là candidate thử nghiệm, chưa có
owner acceptance; không đổi DNA accepted hoặc frame Figma.

## Bố cục thử

- Hai CTA giữ tên/icon/chevron/màu, giảm padding và icon holder; min-height
  64 px, chiều cao thực 66 px ở mobile 390 và 64 px desktop. Chữ giữ nguyên,
  nhãn được wrap tự nhiên ở khung hẹp/chữ lớn.
- CTA → tìm/quét cách 12 px; tìm/quét vẫn cao 48 px. Tab bỏ padding ngoài,
  nút vẫn 44 px, khoảng giữa nút 8 px. Khoảng trước nội dung 12 px.
- Tiêu đề/số phiếu và thanh sort/chọn/lọc dùng flex wrap: cùng hàng khi đủ
  chiều rộng, hai hàng khi hẹp. Khoảng giữa hàng 8 px, giữa nhóm 12 px;
  giữ vùng chạm 44 px và khoảng giữa các nút 8 px.
- Thẻ/dòng phiếu, toàn bộ nội dung, typography, label/bar, form/detail/filter
  và semantics tìm/quét/chọn/duyệt/xuất giữ nguyên. Skeleton chịu cùng CSS.

Runtime chỉ thêm block `KPH compact-controls experiment` cuối
`apps/store-pwa/src/store-kph-fresh.css`; bỏ riêng block này để quay lại bố cục
trước. Không sửa JSX, rule, API, backend, shared UI hoặc dependency.

## Kiểm chứng

| Viewport | Phiếu đầu lên cao hơn | Nội dung/kích thước phiếu |
| --- | --- | --- |
| 390×844 | 58 px | Không đổi |
| 1440×1024 | 84 px | Không đổi |
| 320×740 | 76 px | Không đổi |
| 844×390 | 90 px | Không đổi |

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-compact-controls/build --emptyOutDir`:
  TypeScript/build/PWA PASS; warning chunk lớn có sẵn.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-kph-workspace.test.tsx src/store-app.test.tsx --maxWorkers=2`:
  **11 tests / 2 files PASS**.
- `node .local/kph-compact-controls/check.cjs`: Playwright headless bốn
  viewport PASS. So trực tiếp build trước 4213: text/copy/phiếu đầu cùng
  width/height/type scale; touch, keyboard sort/focus, chọn tất cả/search reset,
  active filter, 150% chữ (bao gồm nhãn CTA/count), không overflow hoặc page
  errors. Home/DATE text và content height không đổi. Đã xem screenshot
  mobile/desktop. Script và screenshot/results ở `.local/kph-compact-controls/`.
- Với `STORE_PREVIEW_URL=http://127.0.0.1:4215`:
  `node e2e/scripts/check-kph-fresh.cjs` PASS 390/1440/320 về list/search/
  selection/touch/create/focus;
  `node e2e/scripts/check-kph-filter-sort.cjs` PASS ba viewport về sort/filter/
  date guard/keyboard/contrast;
  `node e2e/scripts/check-progressive-layout.cjs` PASS Home/KPH 390/1440,
  geometry ≤1 px, không layout shift, gồm loading form.
- `npm run check:docs` và `git diff --check`: PASS.

## Preview và bước nhỏ tiếp theo

Bản thử: <http://127.0.0.1:4215/#kph>.
Bản trước: <http://127.0.0.1:4213/#kph>, build
`.local/kph-date-controls/build` được giữ nguyên để so sánh/quay lại.

Technical PASS với fixture tổng hợp; owner visual/device acceptance còn pending.
Bước nhỏ tiếp theo: owner xem khu chức năng và thử hai CTA/Chọn/Lọc ở 4215.
Chưa checkpoint, push, merge, deploy hoặc nhân rộng DATE.
