# DATE gọn summary và chi tiết — 12/10/2026

Theo phản hồi owner: summary trên thừa/tốn diện tích, bỏ ghi chú xử lý lô,
giảm cuộn. Lượt nhỏ trên cùng task/worktree/writer, nhánh
`store-app/figma-mobile-implementation`, base `c6d9fa5`. Source working tree;
preview <http://127.0.0.1:4201/#date>. Technical gate và nghiệm thu owner riêng.

## Thay đổi

- Mã hàng nhận diện được trình bày bằng hàng tên/SKU/UPC gọn, có native
  `details/summary` mở nhóm hàng/NCC/đơn vị/cửa hàng khi cần. Giữ dữ liệu lookup,
  leading zero, keyboard Enter/Space/focus, miss và recovery. Khi đổi sản phẩm,
  phần thông tin mở rộng reset đóng, tránh mang UI state sang sản phẩm khác.
- Chi tiết dùng tên hàng và SKU/lô ở hai hàng ngắn. Bỏ bảng Summary năm hàng
  lặp sản phẩm, mã, ngày còn lại và cửa hàng. HSD còn/quá đặt cùng vùng nhãn.
- Bỏ ngày chính phóng lớn và ngày ngắn lặp trên timeline; bốn ngày đầy đủ còn
  ở bảng mốc hai cột. Hạn lùi/HSD nhấn bằng weight 650 và màu theo trạng thái,
  không lặp ngày trong nhiều khối. Timeline vẫn dùng chung implementation Tra
  hạn; CSS DATE chỉ giữ tên mốc trên rail. Tra hạn không đổi.
- Bỏ tiêu đề/đoạn hướng dẫn Xử lý lô và ghi chú triển khai dưới CTA. Hai nút
  Ghi nhận/Đã xử lý giữ 48 px, workflow/guard/nhãn trạng thái riêng không đổi.
  Thiếu NSX/ngày lỗi vẫn có giải thích cần thiết và không tạo mốc giả.
- Pad body mobile 24 → 16 px, pad card mốc 16 → 12 px, gap 12 px. Không giảm
  cỡ chữ các ngày/identifier để ép vừa, không thêm timer, library hoặc đo DOM
  runtime. Không sửa primitive/shared sheet hoặc KPH đang ở scope khác.

## Kiểm tra

Source: `apps/store-pwa/src/store-date-workspace.tsx`, `store-date-fresh.css`.
Browser gate mới: `e2e/scripts/check-date-compact.cjs`; cập nhật
`check-date-fresh.cjs` kiểm mở/đóng metadata thay vì chỉ đọc DOM ẩn. Docs:
CURRENT_STATE/NEXT, DATE model, Visual DNA và handoff này; handoff mốc giữ lịch sử.

| Lệnh | Kết quả |
| --- | --- |
| `npm --workspace @coopfood-kph/store-pwa run check` | PASS |
| `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2 src/store-date-assessment.test.ts src/store-date-milestones.test.tsx src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx` | PASS 32 tests / 5 files |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/date-top-build --emptyOutDir` | PASS TypeScript/build/PWA |
| `STORE_DATE_OUTPUT=.local/date-compact-20261012/compact node e2e/scripts/check-date-compact.cjs` | PASS 390/1440/320: disclosure keyboard/metadata, bốn lô × ba viewport, CTA không cuộn, contrast, detail/product chữ 150% |
| `STORE_DATE_OUTPUT=.local/date-compact-20261012/phases node e2e/scripts/check-date-milestones.cjs` | PASS 15 cases, parity Tra hạn, HCM boundary/contrast/reflow |
| `STORE_DATE_OUTPUT=.local/date-compact-20261012/workflow node e2e/scripts/check-date-fresh.cjs` | PASS 3 viewport, tìm/quét/miss/recovery, metadata theo sản phẩm, state/guard/navigation |
| `npm run check:docs` và `git diff --check` | PASS |

Browser gates dùng `STORE_PREVIEW_URL=http://127.0.0.1:4201`, production mock
build, Playwright headless 390×844, 1440×1024, thêm 320×844 và chữ 150%.
Chromium/localhost ngoài sandbox qua auto-review, không Computer Use/Figma.
Evidence ignored `.local/date-compact-20261012/`: source trước, screenshot
trước/sau, before.json, compact geometry và phase/workflow contrast JSON.
Số đo trước: product 251/167/271 px tại 390/1440/320; CTA của lô A24-255 dưới
màn hình ở cả ba kích thước. Đo sau cho cùng lô A24-255:

| Viewport | Mã hàng trước → sau | Detail trước → sau | Giảm detail | CTA bottom trước → sau |
| --- | --- | --- | --- | --- |
| 390×844 | 251 → 62 px | 820 → 473 px | 42% | 916 → 828 px |
| 1440×1024 | 167 → 62 px | 934 → 449 px | 52% | 1198 → 666 px |
| 320×844 | 271 → 62 px | 820 → 497 px | 39% | 913 → 828 px |

Bốn lô đủ NSX/đến hạn lùi, hết HSD, thiếu NSX, đã ghi nhận đều không cần
cuộn detail để tới CTA ở cỡ chữ thường; lô A24-301 ở chữ 150% cũng không cần
cuộn. Product metadata mở rộng 150% không clipped hoặc overflow ngang.
Đã xem ảnh detail/lookup 390, detail/metadata 320 và desktop trước bàn giao.
Phạm vi này là synthetic fixture/viewport, chưa là số đo thiết bị thực.

Giới hạn: mock DATE trong phiên; API/tạo sửa lô, theo dõi qua nửa đêm,
thông báo/thống kê/camera thật chưa triển khai hoặc nghiệm thu. Warning chunk
ExcelJS lớn hiện hữu. Không commit/deploy. Bước nhỏ tiếp: owner tải lại DATE,
thử mở thông tin hàng rồi mở lô để xem giao diện gọn và các nút ngay trong màn.
