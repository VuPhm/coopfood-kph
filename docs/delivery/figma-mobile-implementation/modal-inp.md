# Modal responsiveness — 11/10/2026

Follow-up trên working tree `store-app/figma-mobile-implementation`, base HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Giữ các thay đổi UI có sẵn;
không mở cycle mới, chưa commit/merge/deploy. Owner báo INP >600 ms khi mở
tài khoản, bộ lọc và tạo phiếu.

## Thay đổi

- `packages/ui/src/dialog.tsx`: backdrop giữ màu tối 55%, bỏ blur toàn viewport.
  Giữ Radix modal, scroll lock, focus trap, Escape và outside dismissal.
  Dùng một `transform` để căn giữa: minifier của build cũ hạ `translate: none`
  của sheet thành `transform`, để lại translate utility và làm sheet lệch.
- `apps/store-pwa/src/store-account-sheet.tsx` và `store-app.tsx`: nút tài khoản
  sở hữu state mở/đóng, không render lại Home/workspace khi bật sheet.
- `apps/store-pwa/src/store-kph-workspace.tsx`: filter sở hữu state mở riêng;
  hai nút tạo gọi cùng control sở hữu dialog qua ref React 19. Dữ liệu, filter,
  selection và save vẫn do workspace quản lý. Callback save dùng records ref
  hiện có, không giữ snapshot danh sách cũ trong closure.
- `apps/store-pwa/src/create-record-dialog.tsx`: memo hóa form; giữ reset,
  review, ảnh, lookup và submit semantics.
- `e2e/scripts/check-modal-inp.cjs`: phép đo Event Timing cho click thật,
  screenshot, geometry, focus, Escape, backdrop, filter persistence và hai loại
  phiếu; tùy chọn CPU throttle và trace để tái kiểm tra.

## Phép đo

Chromium headless, motion bình thường, CPU throttle **6×**, fixture tổng hợp,
390×844 và 1440×1024. Mỗi modal 5 lần mở, gồm lần đầu và các lần mở lại.
Đợi paint trước khi Playwright đọc cây accessibility để tránh thêm công việc
vào presentation delay. Lấy duration lớn nhất của Event Timing thuộc click mở;
API lượng tử hóa duration theo 8 ms, ngưỡng observer 16 ms.

| Modal | Mobile trung vị / lớn nhất | Desktop trung vị / lớn nhất |
| --- | --- | --- |
| Tài khoản | 56 / 280 ms | 72 / 272 ms |
| Lọc KPH | 64 / 104 ms | 120 / 128 ms |
| Tạo phiếu TPTS | 128 / 176 ms | 128 / 208 ms |

Artifact local: `.local/modal-inp/build-final/results.json` và sáu PNG cùng thư
mục. Preview build tổng hợp: <http://127.0.0.1:4187/#kph>.
Build cũ đã có lỗi geometry, nên không dùng nó làm bằng chứng giảm phần trăm.
Các lượt trace/ablation ban đầu có instrumentation hoặc tải kiểm tra đồng thời,
chỉ dùng chẩn đoán, không dùng làm benchmark so sánh cuối.

Đây là **lab latency của các click được kiểm tra**, chưa phải field INP trên
thiết bị owner. React dev có overhead khác build tối ưu; không đối chiếu trực
tiếp số dev >600 ms với bảng build để tuyên bố tỷ lệ cải thiện. Lần mở đầu tài
khoản vẫn vượt 200 ms khi CPU throttle 6×. Hướng dẫn phương pháp:
[Google — Optimize INP](https://web.dev/articles/optimize-inp).

## Kiểm tra

- `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2`: **174 PASS**.
- `npm run test --workspace @coopfood-kph/ui`: **12 PASS**.
- TypeScript Store PWA và UI: PASS.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa -- --outDir ../../.local/modal-inp/build-after`: PASS.
  Warning chunk size / static + dynamic Excel import đã có sẵn.
- `STORE_PREVIEW_URL=http://127.0.0.1:4187 INP_LABEL=build-final INP_SAMPLES=5 INP_EXPECT_NO_BLUR=true INP_CHECK_GEOMETRY=true node e2e/scripts/check-modal-inp.cjs`: PASS cả hai viewport.
- `INP_LABEL=dev-final INP_SAMPLES=3 INP_EXPECT_NO_BLUR=true INP_CHECK_GEOMETRY=true node e2e/scripts/check-modal-inp.cjs`: PASS cả hai viewport,
  gồm filter persistence và mở/đóng TPCN/TPTS. Dev CPU 6× lớn nhất:
  mobile tài khoản 400 ms, lọc 192 ms, tạo 536 ms;
  desktop tài khoản 392 ms, lọc 200 ms, tạo 376 ms.
- `STORE_PREVIEW_URL=http://127.0.0.1:4187 node e2e/scripts/check-store-identity.cjs`: PASS 5 viewport, reduced motion, login/account/Escape/focus.
- `STORE_APP_URL=http://127.0.0.1:4187 node e2e/scripts/check-store-qa-repairs.cjs`: PASS 390×844 / 1440×1024, tạo → review → lưu → duyệt → export,
  SKU/UPC, selection, DATE, route và lookup regression.
- `npm run check:docs`: PASS.
- `git diff --check`: PASS.

Bước nhỏ tiếp theo: owner đo lại trên browser/thiết bị đã thấy >600 ms;
đối chiếu bản build và dev riêng, kiểm tra hình ảnh backdrop không blur.
Technical PASS chưa thay owner acceptance hoặc cho phép deploy.
