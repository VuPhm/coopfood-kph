# DATE theo mẫu KPH Co.op Fresh — 11/10/2026

Bố cục trong lượt này đã được thay theo yêu cầu owner cho phép bỏ trình bày
cũ sau phản hồi lệch space. Popup/lọc và semantics tiếp tục được tái sử dụng;
[bàn giao dựng lại DATE](date-recomposition.md) là kết quả hiện hành.

Owner yêu cầu “tham chiếu trang này, sửa trang DATE”, xác nhận “Dùng mẫu KPH
vừa chỉnh”, sau đó phản hồi “tab lệch chiều cao”. Lượt UI nhỏ tiếp tục cùng
writer/worktree/nhánh `store-app/figma-mobile-implementation`, base `c6d9fa5`.
Preview hiện tại: <http://127.0.0.1:4201/#date>. Owner visual/workflow pending;
candidate r14 `59f2174` và preview 4202 giữ bằng chứng trước lượt này. `plan.json`
r14 giữ nguyên mốc đã commit; không coi SHA r14 là source của follow-up này.
Source mới đang trong working tree, chưa commit/push/merge/deploy.

## Kết quả và quyết định

- DATE và KPH dùng cùng popup sắp xếp từ `StoreQuickSort`: nền chọn xanh,
  chữ trắng, dấu ✓, mô tả, keyboard/focus, click ngoài và vị trí vừa viewport.
  DATE có Mặc định / HSD gần nhất / Tên hàng. Mặc định giữ thứ tự lô ban đầu;
  sort chỉ đổi thứ tự kết quả, không sửa fixture hoặc trạng thái xử lý.
- Hộp lọc DATE theo cấu trúc KPH: nhóm trạng thái và sắp xếp, lựa chọn rõ,
  badge tiêu chí khác mặc định, footer Đặt lại/Xong trong viewport khi cuộn.
  Tất cả tương ứng Theo dõi DATE; các trạng thái tương ứng Cảnh báo. Áp dụng
  ngay; Xong đóng hộp; Đặt lại khôi phục Mở/Cảnh báo/thứ tự mặc định và giữ query.
- CTA Ghi nhận dùng cam `#c24e00`, Đã xử lý dùng xanh `#00724e`; hover đậm hơn.
  Giữ guard đã ghi nhận/terminal, ngày/HSD, metadata exact match, SKU/barcode
  dạng chuỗi, scan/miss/recovery và state lô trong phiên.
- Sửa phản hồi tab: DATE trước có tab chính 48 px, hàng trạng thái tăng lên
  54 px ở 320 px khi label/badge xuống dòng. Hai hàng nay cùng min-height
  44 px như KPH, line-height/padding thống nhất; label và badge có cột riêng,
  badge có geometry cố định ở mọi trạng thái. Kiểm mặc định và Đã ghi nhận
  đều 44 px, cùng y trong từng hàng tại 390/1440/320.
- Style DATE scoped; dùng shared Dialog/Radix và Lucide có sẵn. Không thêm
  dependency, API, mutation online, rule HSD, shared package hoặc Figma write.

## Files

- `apps/store-pwa/src/store-date-workspace.tsx`, `store-date-fresh.css`:
  toolbar, sort trên kết quả, hộp lọc, badge, CTA và geometry tab.
- `apps/store-pwa/src/store-quick-sort.tsx`: tách popup có sẵn để hai consumer
  dùng chung. `store-kph-sort.tsx` giữ options/wrapper KPH và nút skeleton.
- `store-kph-fresh.css`: đổi prefix sort sang `store-quick-sort-*`, giữ geometry
  và màu KPH. Filter/style khác của KPH giữ follow-up trước đó.
- `e2e/scripts/check-date-kph-reference.cjs`: sort/filter/sync/reset, query,
  keyboard/outside, bounds/touch, tab geometry, CTA và contrast.
- `check-kph-colors.cjs`, `check-kph-filter-sort.cjs`: theo prefix chung,
  audit thêm selected surface của trạng thái DATE; ngưỡng không đổi.
- `check-date-fresh.cjs`: output path tùy chọn để giữ evidence r14 riêng.
- CURRENT_STATE/NEXT/Visual DNA và handoff: scope và preview hiện hành.

## Kiểm tra

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2` | PASS 182 tests / 23 files |
| `npm --workspace @coopfood-kph/store-pwa run test -- src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx --maxWorkers=2` | PASS sau sửa geometry/markup tab cuối |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-fresh-build --emptyOutDir` | PASS TypeScript/build/PWA |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-date-kph-reference.cjs` | PASS 390×844 / 1440×1024 / 320×844; tab 44 px, order/reset/query, 12 contrast states; popup/filter/CTA footer còn vừa khi cao 390 |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-kph-reference/regression node e2e/scripts/check-date-fresh.cjs` | PASS 3 viewport, search/scan synthetic, identifier/metadata/miss/recovery, processing/terminal guard/state phiên/navigation |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-kph-filter-sort.cjs` | PASS 3 viewport, KPH ordering/filter/calendar/focus/bounds/contrast sau dùng popup chung |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-progressive-layout.cjs` | PASS Home/KPH 2 viewport, skeleton ≤1px và zero layout shift |
| `STORE_APP_URL=http://127.0.0.1:4201 node e2e/scripts/check-modal-ui.cjs` | PASS 5 viewport, shared chrome/scroll lock/focus/picker/modal bounds |
| `npm run check:docs` và `git diff --check` | PASS |

Evidence mới ở `.local/date-kph-reference/`: before/final screenshots,
contrast-results, build/unit logs, regression và source-manifest. Đã xem ảnh
mobile/desktop/320, filter, sort và CTA detail. KPH follow-up cũng được kiểm lại;
manifest trước tái sử dụng popup giữ lịch sử riêng.

Technical PASS là kiểm trên Chromium/mock, không phải nghiệm thu owner hoặc
backend/camera thật. DATE vẫn memory-only; reload reset lô như r14. Cảnh báo
chunk lớn ExcelJS/ZXing hiện hữu giữ nguyên. Bước nhỏ tiếp theo: owner tải lại
4201/#date, xem tab, mở sắp xếp/lọc và thử Ghi nhận/Đã xử lý trên lô mẫu.
