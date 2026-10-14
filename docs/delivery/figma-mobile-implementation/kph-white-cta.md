# KPH — CTA trắng, nhãn màu và cấu trúc thống nhất

Ngày 14/10/2026. Owner yêu cầu CTA nền trắng với nhãn màu phân biệt và sửa
cấu trúc hai CTA đang lệch. Tiếp tục `store-app/figma-mobile-implementation`,
base `5fdfa3e`, worktree `/Users/vup/Documents/coopfood-kph`, writer Codex.
Các follow-up tìm trước CTA/nền xanh/nắp trượt được giữ nguyên.

## Kết quả

- `KphCreateButton` dùng hai hàng ở cả mobile/desktop: header icon / Tạo phiếu /
  chevron trong grid, nhãn loại phiếu ở hàng dưới. Bỏ `display: contents`,
  strong tràn sang cột khác và chevron absolute; loại các override CTA cũ
  ở breakpoint/compact/underlay để chỉ có một mẫu bố cục.
- Nền CTA trắng; nhãn TPCN cam `--store-action-orange` (#c24e00), TPTS xanh
  `--store-brand-action` (#00724e), chữ trắng. Icon theo cùng accent, chữ
  Tạo phiếu màu ink. Không đổi nhãn/type/aria name/haspopup/callback.
- Min-height 72 px, padding 8 px, gap hai hàng 6 px; header 24 px và label
  tối thiểu 24 px. Hai CTA cùng chiều cao, icon/header/chevron/nhãn cùng trục.
  Chữ lớn reflow tự nhiên, label co giãn giữ hai CTA cân nhau.
- Hover có viền accent, pressed có inset accent, focus trắng trên xanh.
  Khung loading dùng cùng component/CSS. Tìm trước CTA, khoảng 8 px trước/
  sau CTA, nắp trượt và nội dung phiếu giữ nguyên.

Runtime: `apps/store-pwa/src/store-kph-create-button.tsx`, `store-kph-fresh.css`.
Docs: CURRENT_STATE, NEXT và tài liệu này. Không đổi workspace state, form,
API/backend, shared UI, dependency, DATE hoặc Figma/DNA accepted.

## Kiểm chứng

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-white-cta/build --emptyOutDir`:
  TypeScript/build/PWA PASS; warning chunk lớn có sẵn.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-kph-workspace.test.tsx src/store-app.test.tsx --maxWorkers=2`:
  **11 tests / 2 files PASS**.
- `node .local/kph-white-cta/check.cjs`: PASS 390×844/1440×1024/320×740:
  nền trắng/palette nhãn, DOM order/keyboard, spacing, geometry CTA/header/
  nhãn/chevron cùng width/height/y; tăng chữ CTA 150%, không clipping/overflow
  và hai CTA/nhãn/header cùng chiều cao. Runtime audit text ≥4,5:1,
  input boundary/focus ≥3:1, hover/focus. Đã xem mobile/desktop và 320 chữ lớn.
- Với `STORE_PREVIEW_URL=http://127.0.0.1:4219`, chạy
  `node e2e/scripts/check-kph-fresh.cjs`: PASS ba viewport về list/tìm/chọn/
  mở cả hai form/đóng/trả focus;
  `node e2e/scripts/check-kph-sliding-cover.cjs`: PASS năm viewport,
  gồm focus/empty list/150% chữ/route reset;
  `node e2e/scripts/check-progressive-layout.cjs`: PASS Home/KPH 390/1440,
  geometry ≤1 px và không layout shift, cả loading form.
- `npm run check:docs` và `git diff --check`: PASS.

Evidence tại `.local/kph-white-cta/`. Preview **http://127.0.0.1:4215/#kph**
đã cập nhật; 4219 kiểm tra cùng build. Build CTA pastel trước tại
`.local/kph-search-first/build` được giữ nguyên để so sánh/quay lại.

Technical PASS với fixture tổng hợp; owner/device acceptance pending.
Bước nhỏ tiếp theo: tải lại 4215, xem hai CTA trắng/nhãn màu và thử hai loại.
Không checkpoint, push, merge, deploy hoặc nhân rộng.
