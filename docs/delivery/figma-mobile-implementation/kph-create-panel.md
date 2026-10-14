# KPH — CTA và khung tạo phiếu, 13/10/2026

Owner yêu cầu sửa hai CTA, đặc biệt icon/clickability; trình bày lại tạo phiếu
bằng bottom panel mobile, modal desktop như các mục khác và xử lý giật.
Tiếp tục cùng worktree `/Users/vup/Documents/coopfood-kph`, sole writer scope KPH,
nhánh `store-app/figma-mobile-implementation`, base `5fdfa3e`.
Các thay đổi rollout nhãn/DATE/Admin có sẵn trong working tree được giữ nguyên.
Preview source mới: <http://127.0.0.1:4201/#kph>, build riêng
`.local/kph-create-panel-build`; preview 4213 không ghi đè.
Technical PASS có mục tiêu; nghiệm thu owner/thiết bị thật còn pending.
Chưa commit, push, merge hoặc deploy.

## Kết quả và nguyên nhân

- CTA cam/xanh giữ hai loại TPCN/TPTS. PackagePlus/Leaf 22 px thay glyph nhỏ,
  nhãn “Tạo phiếu” hiện cả mobile/desktop, tên loại và chevron cho thấy có thể
  mở form. Native button + accessible name/haspopup, hover/press/focus không
  thay bounds. Live và skeleton dùng cùng `KphCreateButton`.
- Mobile dưới 900 px dùng panel sát đáy, bo góc 24, chừa ít nhất 24 px trên;
  desktop modal giữa màn hình, max 880×840 và inset 24. Chung header gradient
  xanh, chữ trắng, nút X inverse 44 px, body trắng/lề 24 (16 ở 320), footer
  CTA 48 px. Header min 72 px, tự tăng khi chữ lớn. Desktop form/review hai
  cột, các nhóm hàng hóa/số lượng/ghi nhận trải đầy hàng; body cuộn riêng.
- Đo trước ở 4213: loading DialogContent bị unmount khi form tải xong,
  overlay/content mới và animation `cf-modal-pop` chạy lần hai ở cả 390/1440.
  Nguồn bằng chứng `.local/kph-create-panel/before-results.json`, không chỉ
  suy luận từ CSS. Mốc này thuộc source KPH checkpoint trước, không dùng
  SHA đó để đại diện các thay đổi DATE/rollout chưa commit.
- Host hiện giữ một Dialog/portal/overlay/header/close từ loading → nhập →
  review. Form chỉ render body ở embedded mode. Giữ scroll từ skeleton trước
  paint, focus vào X không mở bàn phím tự động; close giữ nguyên body đến
  hết exit, lần mở mới tạo draft/session mới. Hủy/lỗi module không mở form muộn.
- Cùng một animation identity trên mobile/desktop, tránh chạy lại khi resize.
  Gắn form nặng sau khi khung nhẹ đã paint và hoàn tất entrance; reduced
  motion dùng khung paint trước, không animation. Busy/live status vẫn rõ.
  Không có timeout nhân tạo hoặc hiệu ứng chuyển cảnh khi loading/review đổi.
- Giữ RHF/Zod, default/option palette đã duyệt, barcode/SKU string, lookup
  found/miss/recovery, read-only ngày/người tạo, 1–3 ảnh/thứ tự, review trước gửi
  và idempotency. Default dialog consumer online/Pilot không dùng embedded mode.
  Không đổi OpenAPI, backend/quyền, dependency hay `packages/ui`.

## Files

- `apps/store-pwa/src/store-kph-create-button.tsx`: CTA dùng chung live/loading.
- `store-kph-workspace.tsx`: host có lifecycle độc lập body, focus/scroll/session,
  gắn form sau entrance; giữ callback nghiệp vụ.
- `create-record-dialog.tsx`: embedded body + thông báo reviewing cho host;
  default dialog vẫn sở hữu Dialog như trước. Header screen chuyển về X chung,
  Chỉnh sửa/Hủy giữ ở footer.
- `store-kph-loading.tsx`, `store-kph-fresh.css`: cùng CTA/template,
  responsive panel/modal, chrome/motion/recovery.
- `store-kph-workspace.test.tsx`: scope đúng nút toolbar khi CTA cũng có tên
  “Tạo phiếu”, tiếp tục kiểm toolbar mở loại đang chọn.
- `e2e/scripts/check-kph-create-panel.cjs`: guard portal identity, animation,
  scroll/template, review/resize/draft/photos, close/reopen, submit, CPU 6×.
- `check-progressive-layout.cjs`, `check-modal-ui.cjs`, `check-kph-offline.cjs`,
  `check-figma-mobile.cjs`: kỳ vọng close/header/panel/review layout hiện hành.
  Script Figma cũ không được coi là parity với node mới và không chạy toàn
  workflow cũ trong lượt này; không có Figma write.
- `check-modal-inp.cjs`: thêm `INP_SCENARIO` để đo riêng action cần sửa.
- CURRENT_STATE/NEXT/Visual DNA/component catalog và handoff này.

## Kiểm tra

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-create-panel-build --emptyOutDir` | PASS TypeScript/build/PWA; chunk warning có sẵn |
| `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2` | PASS 206 tests / 26 files sau thay host/embedded |
| `npm --workspace @coopfood-kph/store-pwa run test -- src/create-record-dialog.test.tsx src/store-create-review.test.tsx src/store-kph-workspace.test.tsx --maxWorkers=2` | PASS 28 tests / 3 files trên source cuối |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-kph-create-panel.cjs` | PASS 390×844 / 1440×1024 / 320×844, normal/reduced motion, CPU 6×: một opening animation (0 khi reduce), cùng DOM portal/overlay, geometry template ≤1 px, scroll 180 px, review/resize không restart, ảnh/draft/gửi/hủy/focus đúng |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-progressive-layout.cjs` | PASS Home/KPH 390/1440; skeleton geometry ≤1 px, zero layout shift, no pageerror |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-kph-lazy.cjs` | PASS 390/1440; hủy loading, focus, loại phiếu, failure/recovery |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-kph-fresh.cjs` | PASS 390/1440/320; list/search/selection, hai form, outside guard, Hủy/focus |
| `STORE_APP_URL=http://127.0.0.1:4201 node e2e/scripts/check-modal-ui.cjs` | PASS 5 viewport; shared chrome/reduced motion, body bounds, scroll lock/focus, nested calendar |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_KPH_COLORS_OUTPUT=.local/kph-create-panel/contrast node e2e/scripts/check-kph-colors.cjs` | PASS 66 runtime contrast states, text ≥4,5:1 và boundaries/selection/focus ≥3:1 |
| `node .local/kph-create-panel/zoom-nested.cjs` | PASS 390/1440/320: chữ 150% không cắt control/header; scanner/calendar/viewer focus, ảnh giữ đúng; error panel/Hủy |
| `npm run check:docs` / `git diff --check` | PASS |

Các gate Fresh/modal/contrast đã pass sau đổi composition; vòng sau tối ưu gắn
form kiểm lại lifecycle/progressive/lazy và targeted unit. Scanner/viewer dùng
fixture synthetic, không yêu cầu OS camera; chưa nghiệm thu camera thật.

## Độ trễ trong lab

Lệnh: `STORE_PREVIEW_URL=http://127.0.0.1:4201 INP_LABEL=kph-create-panel-after-deferred INP_SCENARIO=create INP_SAMPLES=5 INP_EXPECT_NO_BLUR=true INP_CHECK_GEOMETRY=true node e2e/scripts/check-modal-inp.cjs`.

| CPU 6×, 5 lần mở mỗi viewport | Trước tách việc gắn form | Sau |
| --- | --- | --- |
| 390 px, trung vị | 240 ms | 120 ms |
| 1440 px, trung vị | 208 ms | 144 ms |
| Lần mở đầu 390 / 1440 | 384 / 424 ms | 336 / 352 ms |

“Trước” là lần đo bản CTA/host mới nhưng mount full form ngay, không phải
baseline field INP. “Sau” giữ khung nhẹ trước/form sau entrance. Lần đầu còn
cost tải/evaluate module; không tuyên bố latency 0 hoặc bảo đảm mọi thiết bị.
Nguồn `.local/modal-inp/kph-create-panel-before-deferred/` và
`.local/modal-inp/kph-create-panel-after-deferred/`. Sửa giật đã có guard độc lập
cho DOM identity/animation/review/resize, không suy ra chỉ từ latency.

Evidence `.local/kph-create-panel/`: before/final screenshots, geometry/results,
build/unit/browser logs, zoom/recovery, source manifest. Đã xem mobile/desktop,
review, chữ 150% ở 320 và error panel. Playwright headless ngoài sandbox được
review tự động cho phép kiểm localhost; không dùng Computer Use.

Bước nhỏ tiếp: owner tải lại 4201/#kph, mở hai CTA, thử cuộn → xem lại → chỉnh
sửa → đóng/mở lại. Kiểm thêm trên thiết bị đã thấy giật để nghiệm thu thực tế.
