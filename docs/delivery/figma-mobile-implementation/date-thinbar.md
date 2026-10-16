# DATE thin bar — 12/10/2026

> Đã thay thế theo yêu cầu owner 12/10/2026: bỏ bar danh sách, dùng nhãn và
> timeline Tra hạn trong chi tiết. File/checks bên dưới là bằng chứng lịch sử;
> xem [bàn giao hiện tại](date-milestones.md).

Bản đầu trước yêu cầu chuyển inline/gradient, được giữ làm lịch sử.
Source hiện tại xem [thin bar inline](date-inline-bar.md).

Owner xác nhận khung trên “đạt”, rồi yêu cầu thin bar compact cho mỗi sản phẩm,
kèm % ước lượng DATE còn lại và tham khảo phong cách Tra hạn.
Same task/worktree/writer, nhánh `store-app/figma-mobile-implementation`,
base `c6d9fa5`. Follow-up nhỏ; source đang working tree. Technical PASS;
owner acceptance thin bar pending. Preview mock <http://127.0.0.1:4201/#date>.

## Thiết kế và semantics

- Mỗi **lô** một thanh vì cùng sản phẩm có nhiều NSX/HSD khác nhau; không gộp
  thành một % sản phẩm. Thanh cao 6 px, bo tròn, phần tô là thời hạn còn lại;
  nhãn `≈7% còn` 12 px/600 bên phải. Một hàng dưới NSX/HSD, không thêm heading,
  ghi chú hoặc thao tác mới. Cả thẻ vẫn mở chi tiết.
- Dùng palette Fresh và mốc của Tra hạn qua `calculateShelfLife` hiện có:
  xanh trước cảnh báo; cam từ cảnh báo/hạn lùi; đỏ sau HSD, khi % bằng 0.
  Màu không biểu thị trạng thái đã xử lý của lô. Không đổi rule ngưỡng nghiệp vụ.
- Tổng thời hạn = `HSD - NSX + 1`; ngày còn = `HSD - hôm nay + 1`.
  % = clamp 0–100 của `ngày còn / tổng thời hạn × 100`.
  Dùng business date `Asia/Ho_Chi_Minh`; gồm ngày HSD, sau HSD về 0%.
  Trước NSX clamp 100% và mô tả “Chưa tới NSX”. Đây là ước lượng theo ngày,
  không phải đánh giá chất lượng hay quyền bán/xử lý.
- Làm tròn số nguyên; còn dương nhưng làm tròn 0 dùng `<1%` để tránh hiểu là
  hết hạn. Thiếu NSX, ngày không hợp lệ hoặc `HSD <= NSX`: thanh trung tính
  nét đứt + `—% còn`, không suy ra NSX hoặc tự bổ sung fixture.
- Tooltip/meter trợ năng có %/mốc/cách ước lượng; unknown có mô tả thiếu ngày
  và không có giá trị meter giả. Không thêm dependency/API, không sửa Figma.

Một hàng mới thêm 26 px/thẻ: 150 → 176 px ở các viewport kiểm; danh sách
4 lô mặc định 628 → 732 px. Giữ font, nội dung, padding 12/gap 8 đã nghiệm thu.
Khung trên và vị trí lô đầu giữ như lượt trước.

## Files và kiểm tra

- `apps/store-pwa/src/store-date-life.tsx`: component và estimate dùng rule hiện có.
- `store-date-workspace.tsx`, `store-date-fresh.css`: gắn bar vào mỗi thẻ và CSS scoped.
- `store-date-life.test.tsx`: 15 tests, inclusive dates, clamp, năm nhuận,
  ngưỡng short/long life, HSD/expired, thiếu/ngày lỗi và trợ năng.
- `store-app.test.tsx`: bỏ option `exact` không hỗ trợ của Testing Library
  trong readiness region; vẫn kiểm alias `#lookup` → `#date` như trước.
- `e2e/scripts/check-date-layout.cjs`: kiểm bar 6 px, độ dài fill khớp %,
  card compact và reflow; nâng giới hạn chiều cao đúng phần hàng mới.
- `e2e/scripts/check-date-life.cjs`: clocked fixture A24-301 tại NSX/cảnh báo/
  hạn lùi/HSD/expired, timezone UTC→HCM, màu/%, contrast và click bar mở detail.
- Docs CURRENT_STATE/NEXT/Visual DNA, nghiệm thu khung trên và bàn giao này.
  Giữ các thay đổi KPH/UI docs có sẵn trong worktree ngoài scope.

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/date-top-build --emptyOutDir` | PASS TypeScript/build/PWA |
| `npm --workspace @coopfood-kph/store-pwa run test -- src/store-date-life.test.tsx src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx --maxWorkers=2` | PASS 29 tests / 4 files |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-thinbar-20261012/layout node e2e/scripts/check-date-layout.cjs` | PASS 3 viewport; upper/card/bar geometry, CTA, tăng chữ 150% |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_KPH_COLORS_OUTPUT=.local/date-thinbar-20261012/reference node e2e/scripts/check-date-kph-reference.cjs` | PASS 3 viewport; sort/filter/reset/query/focus/bounds, contrast 12 states |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-thinbar-20261012/workflow node e2e/scripts/check-date-fresh.cjs` | PASS 3 viewport; tìm/quét/miss/recovery, metadata, xử lý/guard/state/navigation và contrast |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-thinbar-20261012/phases node e2e/scripts/check-date-life.cjs` | PASS 15 clock/viewport cases, contrast và click-through |
| `npm run check:docs` và `git diff --check` | PASS |

Evidence ignored `.local/date-thinbar-20261012/`: source trước sửa, ảnh
overview/detail/text 150%, lookup/filter/sort, phase/geometry/contrast JSON.
Đã xem overview 390/1440/320 và trạng thái xanh. Playwright headless ngoài
sandbox do môi trường Chromium, auto-review cho phép localhost; không dùng CUA.

Giới hạn: fixture DATE lưu trong phiên, backend/camera thật chưa nghiệm thu;
chunk warning hiện hữu. Chưa commit/deploy. Owner đã duyệt khung trên, thin
bar chờ xem riêng. Bước nhỏ tiếp: tải lại preview và xem % trên các lô cùng SKU.
