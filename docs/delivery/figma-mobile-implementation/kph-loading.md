# Tối ưu tải KPH — 11/10/2026

Follow-up trên working tree `store-app/figma-mobile-implementation`, base HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Giữ các thay đổi UI có sẵn;
chưa commit/merge/deploy. Owner yêu cầu khảo sát và áp dụng lazy load,
skeleton, phân trang và kỹ thuật hữu ích cho KPH.

## Quyết định và nguồn tham khảo

- Tách JavaScript theo entry/tuyến và form. `import()` chỉ tải entry được cấu
  hình; Store App tải KPH khi có ý định/mở tuyến, form khi hover/focus/mở tạo
  phiếu. Mở trực tiếp `#kph` tải workspace song song với shell. Tham khảo
  [web.dev code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting/)
  và [React lazy](https://react.dev/reference/react/lazy). Loader cập nhật
  component bằng state khi import hoàn tất, tránh thời gian giữ fallback phát
  sinh trong phép thử Suspense; không đặt timer loading tối thiểu.
- Skeleton dùng token có sẵn, không shimmer, có `aria-busy`/status; giữ shell,
  navigation và bố cục form trong lúc chờ. Import thất bại có lỗi/nút tải lại;
  form đang tải có thể hủy, không tự mở lại khi chunk về muộn. Giữ focus modal.
- Online **đã có** 25 phiếu/trang và giữ trang trước khi chờ trang mới.
  Giữ guard placeholder chỉ khi cùng user/store/filter/sort, chặn chọn/duyệt/
  xuất trên placeholder. Thêm prefetch trang trước/sau khi hover/focus nút,
  cùng query key, `staleTime` 30 giây, signal, retry false. Tham khảo
  [TanStack pagination](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)
  và [prefetching](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching).
- Store App chỉ mount một layout danh sách theo breakpoint 900px; giữ selection
  và page khi đổi viewport. Memo hóa ngày ISO, chuỗi tìm kiếm, count, filter/sort
  và slice trang, tránh tính lại khi chỉ mở modal/chọn dòng.
- Ảnh minh chứng lịch sử online dùng `loading="lazy" decoding="async"` để
  browser có thể tải/giải mã sau nội dung; [MDN img](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img).
- Chưa thêm virtualization, infinite scroll, debounce hoặc thư viện mới: chỉ
  25 dòng/trang; giữ selection theo trang và backend authority theo
  [paging contract](../../product/HISTORY_PAGING_CONTRACT.md).
  [useDeferredValue](https://react.dev/reference/react/useDeferredValue) không
  phải debounce network; chưa có số đo cần áp dụng cho danh sách này.

## File thay đổi trong follow-up

Các file source dưới `apps/store-pwa/src/`:

- `main.tsx`: bootstrap entry bất đồng bộ, skeleton/error; preload KPH khi
  mở link trực tiếp. App online vẫn sở hữu QueryClient như implementation cũ.
- `store-app.tsx`, `store-kph-workspace.tsx`: loader/prefetch theo ý định,
  skeleton form, một layout và memo hóa; giữ state dữ liệu phiên.
- `store-sheet.tsx`, `store-date-workspace.tsx`: tách helper khỏi StoreApp,
  loại vòng import làm workspace bị kéo vào entry sớm.
- `feature-loading.tsx`, `feature-loading.css`, `use-store-desktop-layout.ts`:
  loading/error recovery và subscription breakpoint có cleanup.
- `create-record-dialog.tsx`: callback close autofocus tùy chọn, bàn giao focus
  giữa loading dialog và form thật; caller cũ giữ mặc định.
- `app.tsx`, `history-records.tsx`: Excel import khi export, skeleton lần tải
  lịch sử online chưa có data, prefetch trang có scope và lazy thumbnail.
- `store-kph-workspace.test.tsx`, `app.online.test.tsx`: chờ form thật, prefetch
  không thay trang/selection và phản hồi muộn sau đổi store.

Ba script `e2e/scripts/check-kph-{loading,lazy,online-loading}.cjs` đo tải,
chunk delay/failure/cancel, layout/page state và API pagination fixture.
`docs/CURRENT_STATE.md` và `docs/NEXT.md` ghi bàn giao/bước tiếp theo.
Không đổi API, backend, schema, authorization, snapshot/ảnh, date rule,
selection xuyên trang hoặc export limit.

## Số đo build

Chromium headless, CPU **6×**, 390×844 và 1440×1024, reduced motion, fixture
tổng hợp; **3 cold browser contexts** mỗi viewport/trường hợp. Baseline chụp
trước follow-up tại `.local/kph-loading/before`; build cuối tại `after`.
Working tree cũng tiếp nhận follow-up modal chung trong phiên này: các số đo
so sánh hai bản build, không phải ablation riêng từng thay đổi. Không chạy
test/build đồng thời với benchmark.

| Chỉ số | Trước | Sau |
| --- | ---: | ---: |
| JS ở Home (CDP transfer, gồm header) | 154.279 B | 108.105 B, giảm 29,9% |
| JS khi mở trực tiếp KPH | 154.279 B | 115.417 B, giảm 25,2% |
| DOM KPH mobile, 25 phiếu | 556 | 294, giảm 47,1% |
| DOM KPH desktop, 25 phiếu | 556 | 305, giảm 45,1% |
| Mở trực tiếp KPH, trung vị mobile / desktop | 912 / 901 ms | 863 / 872 ms |

Mốc danh sách sẵn sàng lấy trong browser qua MutationObserver + hai RAF,
trước khi Playwright đọc DOM/accessibility; đây là mốc sau paint, không phải
LCP. Chuyển tuyến đo từ timestamp click thật, không tính thời gian Playwright
chờ nút. Event Timing đo riêng tương tác, duration lượng tử hóa.

| Home → KPH, trung vị | Trước | Sau, chunk lạnh | Sau, hover trước 200 ms |
| --- | ---: | ---: | ---: |
| Mobile: click → danh sách sau paint | 339 ms | 395 ms | 263 ms |
| Desktop: click → danh sách sau paint | 351 ms | 375 ms | 236 ms |
| Mobile: Event Timing click | 72 ms | 80 ms | 16 ms |
| Desktop: Event Timing click | 80 ms | 88 ms | 16 ms |

**Đánh đổi:** cold navigation thêm 24–56 ms để tải chunk, có skeleton trong lúc
chờ. Prefetch cải thiện thời gian sau click; hover 200 ms không nằm trong cột
cuối và không được bảo đảm cho tap. Chênh lệch mở trực tiếp nhỏ, chỉ có 3 mẫu;
không suy ra cải thiện field từ số đo này.

Home không yêu cầu workspace/form/Excel, KPH list không yêu cầu form/Excel
trong browser kiểm tra. Form riêng khoảng 61,20 kB (gzip 21,61 kB); Excel
929,58 kB chỉ import khi xuất. Warning chunk size còn cho Excel. Giữ SW
precache/offline: benchmark chặn SW, không đại diện lưu lượng cài/cập nhật PWA.

JSON/PNG local: `.local/kph-loading/{baseline,optimized,optimized-intent,baseline-direct,optimized-direct,lazy,online-check}`.
Preview build cuối: <http://127.0.0.1:4197/#kph>.

## Kiểm tra

- `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2`: **178 PASS**.
- `npm run test --workspace @coopfood-kph/ui`: **12 PASS**.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa -- --outDir ../../.local/kph-loading/after --emptyOutDir`: TypeScript/build PASS.
- `VITE_STORE_APP_MOCK=false VITE_KPH_ONLINE=true npm run build --workspace @coopfood-kph/store-pwa -- --outDir ../../.local/kph-loading/online --emptyOutDir`: TypeScript/build PASS.
- `STORE_PREVIEW_URL=http://127.0.0.1:4197 KPH_LABEL=optimized KPH_EXPECT_SPLIT=true node e2e/scripts/check-kph-loading.cjs`: PASS hai viewport;
  baseline URL 4196, `KPH_DIRECT=true` / `KPH_INTENT_WAIT=200` cho trường hợp bổ sung.
- `STORE_PREVIEW_URL=http://127.0.0.1:4197 node e2e/scripts/check-kph-lazy.cjs`: PASS hai viewport;
  skeleton, selection, resize, hủy trước khi tải xong, focus/geometry, lỗi
  route/form/entry, tải lại phục hồi và quay về Home khi route lỗi. PNG đã xem.
- `STORE_PREVIEW_URL=http://127.0.0.1:4198 node e2e/scripts/check-kph-online-loading.cjs`: PASS hai viewport;
  API fixture đúng store/type/pageSize, skeleton, prefetch chỉ một request,
  placeholder busy và chặn selection cũ, Excel chưa tải.
- `STORE_APP_URL=http://127.0.0.1:4197 node e2e/scripts/check-store-qa-repairs.cjs`: PASS hai viewport;
  tạo → review → lưu → duyệt → đọc workbook xuất, route, SKU/UPC, DATE, lookup.
- `STORE_PREVIEW_URL=http://127.0.0.1:4197 INP_LABEL=kph-loading INP_SAMPLES=3 INP_EXPECT_NO_BLUR=true INP_CHECK_GEOMETRY=true node e2e/scripts/check-modal-inp.cjs`: PASS hai viewport;
  tài khoản/lọc/tạo/quick, focus/Escape/outside, hai loại phiếu. CPU 6× trung vị
  mobile tài khoản/lọc/tạo **48/64/96 ms**, desktop **48/72/88 ms**; max 208 ms.
  Artifact `.local/modal-inp/kph-loading`; đây là lab interaction, chưa field INP.
- `npm run check:docs` và `git diff --check`: PASS.

Technical PASS chưa thay owner acceptance hoặc real-backend/thiết bị thật.
Bước nhỏ tiếp theo: owner thử KPH/tạo phiếu trên thiết bị đã thấy >600 ms,
so sánh lần lạnh/lần quay lại; đo riêng API/ảnh và SW nếu vẫn chậm.
