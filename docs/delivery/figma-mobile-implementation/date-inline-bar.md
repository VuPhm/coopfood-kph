# DATE thin bar inline + gradient — 12/10/2026

> Đã thay thế theo yêu cầu owner 12/10/2026: bỏ bar danh sách, dùng nhãn và
> timeline Tra hạn trong chi tiết. File/checks bên dưới là bằng chứng lịch sử;
> xem [bàn giao hiện tại](date-milestones.md).

Owner yêu cầu bar ngắn, chuyển màu mượt như Tra hạn, cùng hàng SKU/lô và căn
phải; % bên trái, state hoàn chỉnh, trọng số rõ và ưu tiên hiệu năng.
Follow-up nhỏ trên cùng task/worktree/writer, nhánh
`store-app/figma-mobile-implementation`, base `c6d9fa5`. Working tree;
technical PASS, owner acceptance pending. Preview <http://127.0.0.1:4201/#date>.

## Thiết kế và semantics

- Thanh 5 px × 48 px mobile/64 px desktop; % 12 px/600 bên trái. Indicator
  căn phải hàng SKU/lô 12 px/400; tên 16 px/650 giữ ưu tiên đọc. Identifier
  wrap thành các cụm SKU/lô khi thiếu chỗ, giữ nguyên giá trị. Không thêm hàng
  bar riêng vào card; vùng tìm/tab/detail không đổi.
- Một gradient xanh → vàng cam → cam; chấm chỉ vị trí hôm nay trên vòng đời
  NSX→HSD, không còn fill theo % như bản đầu. Gradient dùng token Tra hạn/Fresh,
  chấm và chữ theo phase thực. Warning/withdrawal position lấy số ngày từ
  `calculateShelfLife`, không sao chép tỷ lệ giãn nhãn của timeline lớn.
- % còn giữ inclusive HSD, clamp/làm tròn và `<1%` từ bản đầu. Chấm dùng
  elapsed ngày NSX→HSD: trước NSX tại đầu, ngày HSD tại cuối. HSD hôm nay
  vẫn còn một ngày trong %; quá HSD là 0%, thanh đỏ/dấu kết thúc × thay chấm.
- Thiếu NSX hiện “Thiếu NSX”; ngày lỗi hiện “Ngày lỗi”, không meter/holder giả.
  Khi HSD hợp lệ đã qua, biết thời hạn còn lại là 0 dù thiếu NSX; không suy ra
  NSX hay vẽ gradient cho trường hợp này. Nếu có NSX nhưng cặp ngày sai vẫn báo
  lỗi, không bỏ guard HSD > NSX. Tooltip/trợ năng giải thích %/phase/chấm.
- Không đổi lookup/filter/sort/state/xử lý, API, fixtures hoặc dependency.
  Bản đầu ở [date-thinbar](date-thinbar.md) giữ lịch sử, chưa được nghiệm thu.

## Hiệu năng và geometry

`React.memo` nhận props scalar `lotId/manufactured/expiry/today`: đổi query,
popup hoặc trạng thái xử lý với cùng ngày/lô không tính/render lại bar.
Test spy xác nhận 1 lần tính ban đầu, vẫn 1 khi parent rerender cùng props,
thành 2 khi đổi business date; vẫn tính lại nếu NSX/HSD đổi.

Bar hợp lệ có 3 DOM elements; chấm/dấu kết thúc bằng CSS pseudo-element,
gradient tĩnh, không timer/animation JS/đo DOM ở runtime/cache global.
Unknown chỉ có 2 elements. Không thêm GPU layer hoặc thư viện chart cho bar.
Đây là bằng chứng cấu trúc và skip-calculation, chưa phải field INP/thiết bị thật.

Danh sách mặc định 4 lô từ 732 px bản đầu về 628 px ở 390/1440, 651 px ở 320
(một tên dài wrap). Giữ mọi ngày/identifier, target/card action và reflow 150%.

## Files và kiểm tra

Files: `apps/store-pwa/src/store-date-life.tsx`, `store-date-life.test.tsx`,
`store-date-workspace.tsx`, `store-date-fresh.css`; gates
`e2e/scripts/check-date-layout.cjs`, `check-date-life.cjs`; CURRENT_STATE,
NEXT, Visual DNA và hai handoff DATE. Các thay đổi khác có sẵn giữ ngoài scope.

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/date-top-build --emptyOutDir` | PASS TypeScript/build/PWA |
| `npm --workspace @coopfood-kph/store-pwa run test -- src/store-date-life.test.tsx src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx --maxWorkers=2` | PASS 32 tests / 4 files, gồm memo/date/marker boundaries |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-inline-20261012/layout node e2e/scripts/check-date-layout.cjs` | PASS 390/1440/320, cùng hàng/căn phải/% bên trái, bar 48/64×5, card compact, CTA và chữ 150% |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-inline-20261012/phases node e2e/scripts/check-date-life.cjs` | PASS 15 clock/viewport cases: safe/warning/withdrawal/HSD/expired, HCM date, gradient/marker, contrast và click detail |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_KPH_COLORS_OUTPUT=.local/date-inline-20261012/reference node e2e/scripts/check-date-kph-reference.cjs` | PASS 3 viewport, sort/filter/reset/query/focus/bounds, contrast 12 states |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-inline-20261012/workflow node e2e/scripts/check-date-fresh.cjs` | PASS 3 viewport, tìm/quét/miss/recovery, metadata, xử lý/guard/state/navigation và contrast |
| `npm run check:docs` và `git diff --check` | PASS |

Evidence ignored `.local/date-inline-20261012/`: source trước, overview/state/
text-150 screenshots, phase/geometry/contrast JSON và source manifest.
Đã xem mobile/desktop/320 và warning. Playwright Chromium ngoài sandbox theo
auto-review cho localhost; không dùng Computer Use hoặc Figma write.

Giới hạn: mock DATE trong phiên, backend/camera thật chưa nghiệm thu; warning
chunk lớn hiện hữu. Chưa commit/deploy. Bước nhỏ tiếp: owner tải lại DATE để
xem bar inline và state; technical PASS không thay nghiệm thu của owner.
