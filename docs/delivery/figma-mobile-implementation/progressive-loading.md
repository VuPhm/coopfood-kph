# Khung loading ổn định và ảnh Home — 11/10/2026

Follow-up trên working tree `store-app/figma-mobile-implementation`, base HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Owner yêu cầu không jump,
skeleton đúng tỷ lệ, khung nhẹ hiện trước; sau KPH áp dụng cho Home và tối ưu
ảnh. Phạm vi là bản hiện tại, giữ dữ liệu phiên và offline static cache.
Không commit/merge/deploy; giữ các thay đổi UI có sẵn của task.

## Implementation

- `main.tsx`, `store-loading-frame.tsx`: tải khung nhẹ song song với entry
  tương tác. Canvas ban đầu đúng nền và chiều cao viewport, không hiện skeleton
  danh sách chung trên Home. Khi khung sẵn sàng, header/rail/navigation/Home
  xuất hiện ngay; không đợi code workspace/form, không timer loading tối thiểu.
  Entry online vẫn có loader cũ, không nhận fixture preview.
- `store-app-frame.tsx`, `store-home.tsx`, `store-demo-profile.ts`,
  `store-app-mock.ts`, `store-app.tsx`: chia sẻ đúng markup/CSS/context của khung
  trước và sau loading. Home giữ thiết kế accepted, nút điều hướng và bố cục
  nội dung trước khi code tương tác entry tải xong. Chỉ preview dùng context mẫu.
- `store-kph-list.tsx`, `store-kph-loading.tsx`, `store-kph-workspace.tsx`:
  skeleton KPH giữ create actions, heading, tabs, toolbar, pagination và 25 dòng
  cùng markup như dữ liệu hiện tại. Text trong dòng được mask và aria-hidden,
  giữ wrapping/chip/table geometry; control chưa sẵn sàng disabled. Một layout
  theo breakpoint, không mount đồng thời cả cards/table. Data/session không đổi.
- `store-kph-form-assets.ts`, `create-record-dialog.tsx`: chia sẻ mapping icon.
  Skeleton form giữ back/header, các nhóm, chiều cao input, options theo kind và
  footer đúng mobile/desktop. Hủy/focus/recovery giữ nguyên. Chuyển sang form
  thật giữ scroll đã có trong skeleton, không autofocus làm cuộn lên đầu.
- `feature-loading.css`, `store-app.css`: mask tĩnh, không shimmer/stagger
  delay hoặc transform đẩy nội dung. Ảnh có aspect ratio cố định. Thông báo PWA
  trên KPH/DATE được đặt trên FAB vì workflow với worker thật phát hiện nó che
  nút tra hạn lùi; toast fixed không đẩy layout.

Các lớp hiện theo readiness thực: khung/navigation → điều khiển và nội dung
workspace → form khi mở; logo ưu tiên cao, ảnh trang trí Home lazy/priority thấp,
decode async. Không trì hoãn phần đã sẵn sàng để tạo animation tuần tự.
Tham khảo [CLS và reserve space](https://web.dev/articles/optimize-cls),
[responsive images](https://web.dev/articles/serve-responsive-images) và
[img attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img).

## Ảnh Home

Trong `apps/store-pwa/public/brand/` thêm 4 biến thể WebP, giữ ảnh gốc cho màn
đăng nhập và provenance. `srcset`/`sizes` theo kích thước CSS 72px cho logo,
310/360/460px cho ảnh giỏ. Không sửa ảnh minh chứng hay rule nén ảnh nghiệp vụ.

| Asset | Trước | Sau | Giảm bytes file |
| --- | ---: | ---: | ---: |
| Logo Home, 144w / 288w | 267.956 B PNG | 7.030 / 21.586 B | 97,4% / 91,9% |
| Giỏ Home, 620w / 920w | 280.024 B WebP | 63.490 / 117.990 B | 77,3% / 57,9% |

Tạo bằng `cwebp -resize <width> 0 -q 84 -m 6` cho giỏ; `-lossless -resize
<width> 0 -m 6` cho logo. Resize/encode asset hiện có, không tạo lại hình ảnh.
Playwright DPR 2 xác nhận mobile lấy 620w, desktop 920w. Ảnh gốc và các biến thể
vẫn precache: build 107 entries, **3424,72 KiB**, tăng ~219 KiB so với trước
follow-up. Cài cache tải nhiều hơn một lần; Home tải ảnh phù hợp kích thước.
Giảm bytes ảnh không phải tuyên bố giảm tổng download cài PWA hoặc field INP.

## Kiểm tra

- `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2`:
  **180 tests PASS**, 23 files.
- Build `VITE_STORE_APP_MOCK=true` và
  `VITE_STORE_APP_MOCK=false VITE_KPH_ONLINE=true`: TypeScript/Vite PASS.
  Excel chunk warning vẫn còn, không đổi giới hạn để che warning.
- `STORE_PREVIEW_URL=http://127.0.0.1:4197 node e2e/scripts/check-progressive-layout.cjs`:
  390×844 và 1440×1024, DPR 2, reduced motion, SW blocked. Gate entry/workspace/
  form/ảnh, chờ hơn 500ms để tránh bỏ qua shift vì grace period. So khung trước
  và sau tải: header/account/content/rail/nav, Home launcher/ảnh, KPH actions/
  heading/tabs/list/pagination, form header/back/cả 5 nhóm/footer: chênh
  **≤1 px**, raw layout-shift entries **0** cho cả bốn page cases.
  Form TPTS mobile và TPCN desktop; mobile kiểm tra giữ scrollTop 120px khi
  thay skeleton. Artifact `.local/progressive-loading/check/`, screenshot đã xem.
- `STORE_PREVIEW_URL=http://127.0.0.1:4197 node e2e/scripts/check-kph-lazy.cjs`:
  PASS hai viewport: skeleton, hủy/focus, selection/resize, lỗi chunk/reload.
- `STORE_APP_URL=http://127.0.0.1:4197 node e2e/scripts/check-store-qa-repairs.cjs`:
  PASS hai viewport, worker thật: tạo/review/lưu/duyệt/workbook, SKU/UPC, DATE,
  quick lookup, route/IDs và vùng chạm mobile. Toast không còn chặn FAB.
- `STORE_PREVIEW_URL=http://127.0.0.1:4197 node e2e/scripts/check-kph-offline.cjs`:
  PASS hai viewport; HTTP cache tắt, worker thật, offline reload. Chunk đầu tiên
  từ worker, tất cả 24 JS/CSS và 4 biến thể ảnh có trong cache; Home logo/giỏ
  decode được offline, form/tra hạn lùi/xuất Excel hoạt động như trước.
- Cập nhật script đo `check-kph-loading.cjs` để không đánh dấu skeleton là
  danh sách đã sẵn sàng; số đo cũ trong kph-loading.md là build lịch sử.
- `npm run check:docs` và `git diff --check`: PASS.

Technical checks không thay owner acceptance trên điện thoại. Bước nhỏ tiếp
theo: tải lại preview `http://127.0.0.1:4197/#home`, chấp nhận update nếu có,
thử Home → KPH → tạo phiếu trên mạng chậm rồi thử offline sau khi cache cài xong.
