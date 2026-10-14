# DATE dựng lại bố cục — 11/10/2026

Owner: “có vẻ lệch space, cho phép xoá hết trình bày lại date”. Thay cấu trúc
trình bày DATE trong cùng worktree/writer, nhánh `store-app/figma-mobile-implementation`,
base `c6d9fa5`. Source đang working tree, preview mock <http://127.0.0.1:4201/#date>.
Technical verification đạt; nghiệm thu owner còn pending. Candidate r14/4202
và plan đã commit là lịch sử, không đại diện source hiện tại.

## Bố cục và quyết định

- Thay các hàng rời của root bằng hai vùng: tìm/quét (kèm thông tin mã hàng
  và thông báo khi có), quản lý lô (tab → tiêu đề/số kết quả → sắp xếp/lọc →
  trạng thái → danh sách). Chung lề; gap 8/12/16/24 px, bỏ margin âm.
- Bỏ hero mint lớn. Tiêu đề gọn; placeholder “Mã hàng hoặc lô”, label/help vẫn
  nêu SKU/barcode/tên/lô. Search/scan cao 48 px; tab/trạng thái/lọc/sort 44 px.
- Mobile một cột, lề 20 px (16 ở 320). Desktop max-width 1184 px/lề 32,
  danh sách và chi tiết hai cột căn đầu; placeholder chi tiết cao 260 px thay
  cho khung 440 px kéo theo danh sách.
- Thẻ lô chia rõ tên/hạn còn lại, SKU/lô, NSX/HSD, trạng thái/thao tác.
  Ngày dùng toàn chiều rộng thẻ, nhãn và giá trị tách dòng. Thiếu NSX không
  suy ra giá trị. Hai CTA chi tiết chia đều, cao 48 px, Ghi nhận cam và Đã xử lý xanh.
- Giữ Co.op Fresh và popup/lọc từ KPH. Đỏ chỉ dùng quá HSD. Logic tìm/quét,
  exact metadata, identifiers dạng chuỗi, filter/reset/sort, xử lý/terminal
  guard và state phiên không đổi. Không thêm API/dependency/Figma write.

## Follow-up danh sách gọn hơn

Owner muốn “trình bày danh sách tiết kiệm không gian hơn 1 ít, hiện được nhiều
mục”. Chỉ sửa CSS thẻ: padding 16 → 12 px, gap trong thẻ và giữa các mục
12 → 8 px; NSX/HSD cùng hàng, mỗi nhãn-ngày dùng một dòng khi đủ chỗ và tự
wrap khi tăng chữ. Giữ cỡ chữ/tương phản, tất cả nội dung và click mở chi tiết.

Danh sách 4 lô mặc định: 840 → 628 px ở 390/1440 (giảm 25,2%),
909 → 628 px ở 320 (giảm 30,9%). Đây là geometry Chromium trên cùng fixture.
`check-date-layout.cjs` đổi kỳ vọng ngày hai dòng sang chiều cao dòng đọc được,
kiểm thẻ compact, vẫn kiểm CTA/căn lề/reflow 150%. Build TypeScript/PWA PASS;
layout và `check-date-kph-reference.cjs` PASS cả 3 viewport (contrast 12 states,
order/reset/query/focus/CTA). Các gate workflow/unit bên dưới thuộc lượt dựng
lại trước; follow-up chỉ đổi CSS và kỳ vọng bố cục, không sửa runtime logic.

Lệnh: `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-compact node e2e/scripts/check-date-layout.cjs`
và `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_KPH_COLORS_OUTPUT=.local/date-compact node e2e/scripts/check-date-kph-reference.cjs`.
Evidence mới `.local/date-compact/`: ảnh trước/sau, layout/contrast JSON,
build/browser logs và manifest. Đã xem ảnh 390/320; owner acceptance pending.

## Files và kiểm tra

Files lượt này: `apps/store-pwa/src/store-date-workspace.tsx`,
`apps/store-pwa/src/store-date-fresh.css`, `e2e/scripts/check-date-layout.cjs`,
CURRENT_STATE/NEXT/Visual DNA và hai handoff DATE. Các thay đổi KPH/popup chung
trong working tree thuộc follow-up trước, không phải phạm vi dựng lại DATE.

| Lệnh | Kết quả |
| --- | --- |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-fresh-build --emptyOutDir` | PASS TypeScript/build/PWA |
| `npm --workspace @coopfood-kph/store-pwa run test -- src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx --maxWorkers=2` | PASS 14 tests / 3 files |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 node e2e/scripts/check-date-layout.cjs` | PASS 390×844 / 1440×1024 / 320×844; căn lề/gap, sort/lọc cùng hàng, NSX/HSD toàn hàng, chi tiết responsive, CTA bằng nhau, tăng chữ 150% không tràn/cắt control |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_KPH_COLORS_OUTPUT=.local/date-recomposition node e2e/scripts/check-date-kph-reference.cjs` | PASS 3 viewport; tab 44 px, filter/sort/reset/query, keyboard/outside/focus, popup/CTA footer ở chiều cao 390, 12 contrast states |
| `STORE_PREVIEW_URL=http://127.0.0.1:4201 STORE_DATE_OUTPUT=.local/date-recomposition/regression node e2e/scripts/check-date-fresh.cjs` | PASS 3 viewport; tìm/quét synthetic, lookup/miss/recovery, metadata/string identifiers, xử lý/terminal guard/state phiên/navigation, 24 contrast states |
| `npm run check:docs` và `git diff --check` | PASS |

Evidence `.local/date-recomposition/`: ảnh trước/sau, overview 3 viewport,
filter/sort/CTA detail, tăng chữ, geometry/contrast JSON, build/unit/browser
logs và source manifest. Đã xem ảnh 390/1440/320 và detail/filter để kiểm thị giác.
Chromium headless cần chạy ngoài sandbox do SIGTRAP lúc khởi động; tự động
review cho phép kiểm localhost. Không dùng Computer Use.

DATE vẫn dữ liệu mẫu chỉ lưu trong phiên; backend/camera thật chưa nghiệm thu.
Cảnh báo chunk lớn hiện hữu trong build. Bước nhỏ tiếp theo: owner tải lại
4201/#date để nghiệm thu khoảng cách, thẻ lô và panel chi tiết. Chưa commit,
push, merge hoặc deploy cho lượt này.
