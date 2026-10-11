# DATE hợp nhất — Co.op Fresh r14

Owner yêu cầu ngày 11/10/2026: “bỏ tra cứu, trong date có tra cứu sku rồi, sau
hợp nhất thì áp giao diện mới vào”. Tiếp tục task/nhánh/worktree hiện có với
một writer `/root`, base checkpoint KPH accepted `d9845c7`. Remote chưa fetch;
không tích hợp Git hoặc deploy trong scope.

## Outcome

- Bỏ Tra cứu riêng khỏi Home desktop, rail và thanh mobile; mobile còn
  Trang chủ/KPH/DATE. `#lookup` cũ chuyển về `#date`.
- DATE dùng một thanh tìm/quét SKU, barcode, tên hàng hoặc lô. Tìm trực tiếp
  các lô trong phiên; exact match mới hiện metadata catalog, không suy đoán.
  Barcode và SKU luôn là chuỗi riêng. Miss và lỗi danh mục có thông báo riêng,
  giữ mã để nhập lại/quét lại.
- Hợp nhất 3 lô bánh quy của Lookup vào DATE; lô `C24-118` dùng SKU `0011730`
  của fixture catalog thay cho SKU mâu thuẫn `089332` trong DATE cũ. Đây là
  dữ liệu mẫu memory-only. NSX/HSD và trạng thái xử lý được giữ riêng; nhãn
  DATE cũ `track/warning/alert` không còn là bản sao trạng thái xử lý.
- Fresh dùng header xanh đậm, surface trắng, nhóm mint, tab xanh/chữ trắng,
  border/focus rõ, thẻ lô mobile và detail desktop, sheets chung. Đỏ chỉ cho
  quá HSD; ngày HSD là hôm nay dùng nhãn cảnh báo. Giữ công thức/ngày nghiệp vụ.
- Giữ Ghi nhận/Đã xử lý và guard terminal; state cập nhật trong phiên và số
  cảnh báo Home; chưa bật Thêm theo dõi, chưa mở API DATE.

## File đã đổi

- `apps/store-pwa/src/store-date-workspace.tsx`, `store-date-fresh.css`: thanh
  tìm/quét chung, metadata, thẻ lô/detail/sheets và CSS Fresh scoped.
- `store-app-mock.ts`: catalog/metadata dùng chung, thống nhất 7 lô, giữ
  identifier string và ngày mẫu; không đổi authority online.
- `store-app.tsx`, `store-app-frame.tsx`, `store-home.tsx`, `store-app.css`:
  bỏ destination riêng, alias route và 3 mục mobile; gỡ layout Lookup/DATE cũ.
- Retire `store-lookup-workspace.tsx`; chuyển lookup tests sang
  `store-date-lookup.test.tsx`, cập nhật `store-date-workspace.test.tsx` và
  `store-app.test.tsx` cho fixture/state/route mới.
- `e2e/scripts/check-date-fresh.cjs`: gate hợp nhất/scan synthetic/contrast/offline;
  cập nhật `check-mobile-toolbar.cjs`, `check-store-qa-repairs.cjs` theo IA/fixture.
- `docs/CURRENT_STATE.md`, `docs/NEXT.md`, Visual DNA và rollout/plan r14;
  r13 CLOSED được bảo tồn tại `plan-r13.json`, gồm closure docs-only `09411e8`.

## Kiểm tra và kết quả

Source candidate nằm trong `plan.json`; source manifest lưu ignored ở
`.local/date-fresh-r14/source-manifest.json`. Runtime dùng Node/npm của workspace,
Playwright Chromium headless. Không test OS camera hoặc backend DATE thật.

| Lệnh | Kết quả |
| --- | --- |
| `npm run verify` | PASS docs/contracts/generated client drift, TypeScript, **230 tests** (Store 182, Admin 14, API 2, rules 19, UI 13), online/default build |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build` | PASS TypeScript, mock bundle và PWA precache |
| `STORE_PREVIEW_URL=http://127.0.0.1:4202 STORE_CHECK_OFFLINE=1 node e2e/scripts/check-date-fresh.cjs` | PASS 390×844, 1440×1024, 320×844; alias, barcode/SKU/name/lot search, metadata, miss/recovery, synthetic scan callback, xử lý/terminal guard/state Home, filter focus, touch/no overflow, bounds mobile sheet; offline reload/search/update PASS |
| `STORE_PREVIEW_URL=http://127.0.0.1:5178 node e2e/scripts/check-mobile-toolbar.cjs` | PASS 5 viewport, 3 links/active, touch/clearance, quick utility state/focus/modal layering/login exclusion |
| `STORE_PREVIEW_URL=http://127.0.0.1:5178 node e2e/scripts/check-kph-fresh.cjs` | PASS KPH 3 viewport, search/selection, form recovery/focus, touch/no overflow |
| `STORE_APP_URL=http://127.0.0.1:5178 node e2e/scripts/check-store-qa-repairs.cjs` | PASS 390×844/1440×1024: create/lookup SKU-UPC, review, selected export workbook, DATE session/guards, utility route/IDs, product metadata |
| `npm run check:docs`, `git diff --check` | PASS sau cập nhật docs |

24 runtime contrast states: chữ tối thiểu **4,62:1**, input border **3,94:1**,
selected surface/focus/cue tối thiểu **5,67:1**. Bộ đo dùng computed style và
background/gradient ở vị trí render; disabled và decorative/sr-only không tính.
Đã xem screenshot mobile alerts/detail và desktop alerts/product; không dùng
pixel snapshot rộng. Evidence (ảnh/JSON/log) nằm ở `.local/date-fresh-r14`;
regression ở `.local/mobile-toolbar`, `.local/kph-fresh`, `.local/figma-mobile/r5`.
Các gate regression dev giữ coverage vì source byte-identical với candidate;
DATE gate đã chạy lại trên bản build 4202. Build có warning kích thước chunk
ExcelJS/ZXing hiện hữu; không thêm dependency hoặc thay chiến lược loading.

## Quyết định và giới hạn

- Một writer; giữ branch/worktree hiện tại vì đây là follow-up kế hoạch r6.
  Checkpoint KPH/source `d9845c7` + docs closure `09411e8` được giữ nguyên.
- Tìm nhập là live filter trên lô; query không trống chuyển Theo dõi để thấy
  tất cả trạng thái của mã tìm. Chọn Cảnh báo/filter vẫn giới hạn đúng status.
  Exact lot ID lọc một lô; barcode ánh xạ sang SKU; partial tên không suy diễn
  metadata product. Counts có nhãn phạm vi, processing và HSD được biểu đạt riêng.
- DATE chỉ memory-only; reload reset fixtures, kể cả offline. Mock catalog chạy
  trong phiên. Không có mutation thật hoặc nguồn tồn kho online mới.
- Camera callback đã kiểm bằng stream/BarcodeDetector synthetic; thiết bị thật
  và quyền browser/OS chưa được chứng minh. Online gateway/backend/auth/API,
  shared primitives, business rules và Pages không đổi.

## Nghiệm thu

Owner visual/workflow r14 pending. Preview mock ở
<http://127.0.0.1:4202/#date>; base KPH acceptance r13 giữ phạm vi riêng.
Thử SKU `0008421`, barcode `29123415005`, lô `C24-118`; xử lý một lô → Home
→ mở DATE lại để kiểm state. Không nhập dữ liệu vận hành thật.
