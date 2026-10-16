# KPH — choice và nhãn màu từng item, 12/10/2026

**Mốc trước:** owner yêu cầu phát triển lại palette choice cũ và thay dấu tròn
bằng thanh cạnh trái; đã triển khai ở [bàn giao mới](kph-choice-bars.md).

Tiếp tục task `store-app/figma-mobile-implementation` tại
`/Users/vup/Documents/coopfood-kph`, base `c6d9fa5`; writer của scope KPH và
primitive mới là Codex trong chat này. Owner xác nhận thích phong cách nhãn
v1, yêu cầu tổ chức/màu lại choice và thêm dấu màu từng item theo hướng Apple.
Phần mới chờ nghiệm thu owner tại <http://127.0.0.1:4213/#kph>.

## Kết quả và giả định

- Diễn giải hướng Apple thành dấu tròn gọn gợi Finder: chấm 8px, quầng dịu
  18px cạnh tên hàng. Dấu theo tình trạng đã ghi nhận (cam/đỏ/xám); ba nhãn
  chữ/icon accepted vẫn giữ. Approval không đổi màu dấu tình trạng.
- Form Fresh: lưới hai cột, tình trạng Khác chiếm hàng cuối; biện pháp TPCN
  2×2/TPTS một hàng. Icon choice và selected dùng palette nhãn; vòng tròn
  có check biểu diễn selected, outline riêng cho focus.
- Giữ thứ tự/default/enum/label, native radio/fieldset/legend, validation,
  OTHER, API/media/quyền/duyệt/xuất và workflow. HỦY là biện pháp trung tính.
- Palette scoped `ui-label-palette` được dùng chung cho nhãn, dấu item và
  choice; không nhân bản các cặp màu. `KphChoiceContent` chia sẻ geometry
  của form/skeleton. Mỗi item chỉ thêm một span trang trí, không tab stop.

## File đổi trong lượt này

- `packages/ui/src/list-item-marker.tsx`, `list-label.tsx`, `list-label.css`,
  `index.ts`; `packages/ui/DESIGN_SYSTEM.md`.
- `apps/store-pwa/src/create-record-dialog.tsx`, `store-kph-choice.tsx`,
  `store-kph-list.tsx`, `store-kph-loading.tsx`, `store-kph-fresh.css`,
  `store-kph-label.test.tsx`.
- `e2e/scripts/check-kph-choice-items.cjs`.
- `docs/product/LIST_LABEL_SYSTEM.md`, `STORE_APP_COMPONENT_CATALOG.md`,
  `STORE_APP_VISUAL_DNA.md`, CURRENT_STATE/NEXT và hai bàn giao nhãn KPH.
- Khôi phục type import `ShelfLifeResult` bị thiếu trong WIP
  `store-shelf-life.tsx` để TypeScript kiểm được. Không đổi logic DATE.

Các source/test DATE còn đang được cập nhật ở checkout chung trong lúc kiểm;
không nhận các thay đổi đó vào scope/acceptance KPH. Build preview có source
working tree tại thời điểm build, dùng dữ liệu mock trong phiên.

## Kiểm chứng

- `npm run check`: PASS TypeScript tất cả workspaces sau khôi phục type import.
- `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=2` và
  `npm --workspace @coopfood-kph/ui test`: PASS 186 + 14 tests. Lần Store test
  đầu dùng worker mặc định timeout khi lazy form chưa sẵn sàng; chạy lại giới
  hạn hai worker PASS, không sửa/tắt test hoặc tăng timeout.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-list-labels/build --emptyOutDir`: PASS mock/PWA build, TypeScript gồm tests hiện có.
- `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-kph-choice-items.cjs`:
  PASS 390×844/1440×1024/320×844, hai loại: màu dấu theo tình trạng, lưới
  choice, default/selection, arrow keys/focus, OTHER giữ nội dung, tất cả
  màu selected/contrast (text ≥4,5:1, indicator ≥3:1), touch và chữ 150% wrap.
- `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-progressive-layout.cjs`:
  PASS 390/1440, KPH/Home/form: frame/skeleton → ready geometry ≤1px, không shift.

- `STORE_PREVIEW_URL=http://127.0.0.1:4213 STORE_LABEL_OUTPUT=.local/kph-choice-items/list-regression node e2e/scripts/check-kph-list-labels.cjs`: PASS ba viewport,
  sáu tone/ba chiều, long label 150%, search/select/review/export eligibility.
- `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-kph-fresh.cjs`:
  PASS ba viewport, hai form, focus/dismiss/recovery, readonly và touch.
- `npm --workspace @coopfood-kph/store-pwa test -- src/create-record-dialog.test.tsx src/store-kph-label.test.tsx src/store-kph-workspace.test.tsx --maxWorkers=2`: PASS 29 tests trên source cuối (form/label/workspace).
- `npm run check:docs`, `git diff --check`: PASS.

Evidence ignored `.local/kph-choice-items/evidence` và `list-regression`;
Fresh gate output `.local/kph-fresh`; progressive script giữ
output `.local/progressive-loading/check`. Playwright headless Chromium dùng
automatic approval cho localhost. Đã xem ảnh choice 390/320 (cả chữ 150%), list mobile/desktop sau căn lại dấu;
không snapshot pixel rộng hoặc Computer Use.

## Giới hạn và bước nhỏ tiếp

Gate mock/fixture không thay real-backend E2E hoặc camera thật; phần mới chờ
owner nghiệm thu. ExcelJS large chunk warning có sẵn. Không push/merge/deploy
hoặc Figma write. Bước nhỏ tiếp: owner tải lại preview 4213, xem hai form và
dấu màu từng item ở mobile/desktop; sau đó chọn list tiếp theo để rollout.
