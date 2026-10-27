# SEARCH01 — tìm kiếm đồng bộ,27/10/2026

Owner: “tạm ổn” cho LIST01, chuyển sang trình bày lại tìm kiếm ở các phần,
giữ tĩnh/đồng bộ/linh hoạt và theo style mới. LIST01 được chốt tạm tại
`df77179`, không suy quyền merge/push. Search là task riêng, root sole writer.

- Branch: `store-app/search01-consistent-fields`.
- Base: `df77179` (gồm LIST01 KPH + DATE + trạng thái bên phải).
- Worktree: `/Users/vup/.codex/worktrees/search01-consistent-fields/coopfood-kph`.
- Preview production mock: <http://127.0.0.1:4378/#kph>, dev4377.
- Technical PASS; owner visual pending; chưa merge/push/deploy/Cloudflare/Pages.

## Recipe và scope

Dùng lại StoreSearchField cho KPH live/loading và DATE, cùng composer, lịch sử
Báo cáo và picker mẫu. Component không sở hữu query/rule/filter/selection;
caller vẫn giữ semantics cũ. Thêm disabled thật cho skeleton, autoComplete off.

Một recipe: nền trắng matte, viền1px theo field token Fresh Solid, radius12px;
icon18px ở trái12px, chữ16/24, min-height44px và tự nở với chữ lớn. Padding
trái40/phải44 giữ chỗ nút xóa, không đổi geometry khi empty/value/focus/clear.
Clear44px, type=button, trả focus input, không submit; hover face nhỏ hơn để
không che focus edge. Focus xanh đậm inset trên nền trắng cho hero/content/
portal; không thêm motion/blur/shadow search. Disabled dùng field state token.

DATE giữ scan + submit Tìm, trong cụm riêng; form flex-wrap native. Khi thiếu
chỗ, input giữ chiều rộng đọc được, actions xuống dòng/căn phải. Label vẫn
“Tìm SKU, barcode, tên hàng hoặc lô”; placeholder “Tìm mã hàng, lô”. Không đổi
barcode FOUND/miss/recovery, Enter submit, exact lot/type, scan hoặc rule.
Form mã SKU/UPC trong tạo KPH vẫn là form field nghiệp vụ, không đổi flow.
Home/Thông báo/Tra hạn không thêm tìm kiếm mới. List item và output giữ nguyên.

## File owners

- `store-search-field.tsx` + mới `store-search-field.css`: shared behavior/recipe;
  CSS riêng tránh kéo style picker vào KPH loading.
- `store-kph-workspace.tsx`, `store-kph-loading.tsx`, `store-date-workspace.tsx`:
  sử dụng chung component và group DATE actions.
- `store-choice-sheet.tsx`, `store-form-controls.css`: choice sheet tự import
  CSS của mình sau khi search được tách.
- `store-kph-fresh.css`, `store-date-fresh.css`, `store-functional-layout.css`,
  `store-material.css`, `store-report-composer.css`, `store-report-soft.css`,
  `store-button-system.css`: bỏ recipe search superseded, cập nhật selector
  DATE actions, giữ các button/field khác.
- `e2e/scripts/check-report-fresh.cjs`: tìm input DATE qua wrapper mới.
- `e2e/scripts/check-kph-colors.cjs`: audit input bỏ qua background mà modal
  đã đặt aria-hidden/inert; ngưỡng text4.5/focus3:1 vẫn giữ cho UI đang hoạt động.
- CURRENT_STATE/NEXT/STORE_FORM_CONTROLS và record này: handoff.

Không đổi packages/ui, root config/lockfile, API, backend hoặc dependencies.

## Kiểm tra và evidence

- `npm run check --workspace @coopfood-kph/store-pwa` — PASS.
- `npm run test --workspace @coopfood-kph/store-pwa -- src/store-choice-sheet.test.tsx src/store-kph-workspace.test.tsx src/store-date-lookup.test.tsx src/store-date-workspace.test.tsx src/store-report-management.test.ts src/store-app.test.tsx` — PASS40tests.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa` — PASS118precache; warning Excel chunk lớn kế thừa.
- `STORE_PREVIEW_URL=http://127.0.0.1:4378 node /tmp/search01/browser.cjs` — production PASS (dev4377 cũng PASS): năm ngữ cảnh KPH/DATE/composer/picker/history ở
  390×844/1440×1024/320×844. Cùng radius12/bgwhite/font16/padding40/44/height44,
  focus inset, clear hit44/focus, geometry không nhảy, chữ200%/no overflow;
  DATE Enter→miss/clear/quét/cancel, picker cancel giữ selection, history — PASS.
- `STORE_PREVIEW_URL=http://127.0.0.1:4377 STORE_REPORT_OUTPUT=/tmp/search01/report-header node e2e/scripts/check-report-header.cjs` — PASS390/1440/320,63choices/keyboard/cancel/preserve period+selection/calendar/clear/150% và viewport620px cao, contrast.
- `npm run check:docs`, `git diff --check` — PASS.

Evidence local: `/tmp/search01/` (screenshots/results.json, report-header/).
Dữ liệu history được seed tổng hợp chỉ trong browser context test, không vào
repo hay session owner. Lab browser/local mock; chưa kiểm camera OS/thiết bị
thật hoặc API production. Scope nhỏ, không mở team/milestone cycle.

Bước nhỏ tiếp: owner xem search tại4378 ở KPH/DATE/Báo cáo và popup đổi mẫu;
chốt nhịp field/action khi màn hẹp. Không tự rollout ngoài Store Fresh.
