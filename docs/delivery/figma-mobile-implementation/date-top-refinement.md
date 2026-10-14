# DATE khung trên gọn theo KPH — 12/10/2026

Owner: “trong DATE, tối ưu lại phần khung trên, bỏ ghi chú thừa, dùng trọng số
gọn gàn giống trang kph”. Follow-up nhỏ, cùng nhánh/worktree/writer
`store-app/figma-mobile-implementation`, base `c6d9fa5`. Source đang working
tree; giữ các thay đổi KPH/popup và bố cục DATE trước lượt này.
Technical PASS; owner đã nghiệm thu khung trên ngày 12/10/2026 qua “đạt”.
Nghiệm thu này áp dụng khung trên/trọng số; thin bar là follow-up mới. Preview mock <http://127.0.0.1:4201/#date>.

## Thay đổi và quyết định

- Bỏ intro “Mã hàng & lô DATE”, hai dòng hướng dẫn và nhãn “Đã nhận diện mã
  hàng”. Header DATE đã xác định màn; thông tin sản phẩm vẫn hiển thị đầy đủ.
- Ô nhập/quét/Tìm cùng hàng, cao 48 px; quét rộng 44 px, nút Tìm tối thiểu
  56 px, gap 8 px. Placeholder “Mã hàng, lô”; label trợ năng vẫn nêu đầy đủ
  SKU/barcode/tên/lô. Nút giữ tên trợ năng “Tìm mã hàng” và trạng thái busy.
- Khung trên padding-top 20 px mobile/28 px desktop, cách tab 16 px.
  Tiêu đề danh sách 17 px/650; số lượng 13 px/400 cùng hàng và wrap khi cần.
  Bỏ trạng thái lặp trong số lượng vì nút trạng thái đã hiển thị lựa chọn.
  Tên sản phẩm nhận diện 16 px/650 như thẻ KPH; metadata 13 px.
- Giữ logic lookup/filter/sort/scan, metadata, identifiers dạng chuỗi,
  workflow/terminal guard/state phiên, card/detail và hướng dẫn xử lý.
  Không sửa API, dependency, dữ liệu hoặc frame Figma.

Geometry Chromium trên cùng fixture, trước/sau lượt này:

| Viewport | Khung tìm trước → sau | Y lô đầu trước → sau |
| --- | --- | --- |
| 390×844 | 212 → 48 px | 576 → 376 px |
| 1440×1024 | 138 → 48 px | 510 → 404 px |
| 320×844 | 232 → 48 px | 596 → 376 px |

## Files và kiểm tra

Source: `apps/store-pwa/src/store-date-workspace.tsx`, `store-date-fresh.css`.
Đổi readiness của test route/alias từ heading đã bỏ sang region “Tra mã hàng”
trong `apps/store-pwa/src/store-app.test.tsx`,
`e2e/scripts/check-date-fresh.cjs`, `check-date-kph-reference.cjs`.
`check-date-layout.cjs` thêm kiểm hàng tìm/quét/Tìm, touch target, chiều cao
khung trên và trọng số; giữ kiểm tương tác/bố cục/reflow hiện có.
Docs: CURRENT_STATE, NEXT, STORE_APP_VISUAL_DNA và bàn giao này.

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/date-top-build --emptyOutDir` | PASS TypeScript/build/PWA |
| `npm --workspace @coopfood-kph/store-pwa run test -- src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx --maxWorkers=2` | PASS 14 tests / 3 files |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-top-20261012/layout node e2e/scripts/check-date-layout.cjs` | PASS 3 viewport; hàng tìm 48 px, căn lề/gap, compact card/date facts, CTA, tăng chữ 150% |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_KPH_COLORS_OUTPUT=.local/date-top-20261012/reference node e2e/scripts/check-date-kph-reference.cjs` | PASS 3 viewport; sort/filter/reset/query, keyboard/outside/focus, bounds, contrast 12 states |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-top-20261012/workflow node e2e/scripts/check-date-fresh.cjs` | PASS 3 viewport; tìm/quét synthetic, lookup/miss/recovery, metadata, xử lý/guard/state phiên/navigation và scoped contrast |
| `npm run check:docs` và `git diff --check` | PASS |

Evidence ignored tại `.local/date-top-20261012/`: source trước sửa, geometry
trước/sau, ảnh overview/detail/text 150%, lookup/filter/sort và contrast JSON.
Đã xem ảnh overview 390/1440/320 và metadata ở 320. Chromium headless kiểm
localhost ngoài sandbox theo auto-review; không dùng Computer Use.

Giới hạn: DATE vẫn dữ liệu mẫu, lưu trong phiên; camera thật/backend chưa
nghiệm thu. Cảnh báo chunk lớn hiện hữu. Chưa commit/deploy; không đóng
gate thiết bị thật. Khung trên đã được owner nghiệm thu; bước tiếp theo theo
yêu cầu mới là thêm thin bar thời hạn còn lại cho từng lô.
