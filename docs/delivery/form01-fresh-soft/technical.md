# FORM01 — Co.op Fresh Soft cho form, 24/10/2026

Owner yêu cầu “các thành phần form hiện tại cứng, tối ưu mềm mại theo phong cách
mới, đặt tên cho phong cách đó luôn”. Tên ngắn **Co.op Fresh Soft**, giữ mã
recipe `coop-fresh-soft-v1` đã có, không tạo theme/setting mới. Candidate chờ owner
xem; chưa merge/push/deploy. Base `f77034d9c14b88f5ae6359e31cfd23b4e3e6b0d8`, nhánh
`store-app/form01-fresh-soft`, một writer tại worktree
`/Users/vup/.codex/worktrees/form01-fresh-soft/coopfood-kph`; không team.
Preview production mock: <http://127.0.0.1:4301/#kph>.

## Phạm vi và quyết định

Rà form KPH đã có material của KPH03 và các control local trước khi sửa. Phần
cứng còn lại là field trắng/contour mạnh, viền lồng và selected nét kép. Tái dùng
component hiện có; chỉ thêm recipe CSS scoped Store Fresh/login/portal.

- Input/select/textarea: fill rất nhẹ `#f3f8f5`, edge `#7d9084`/1px, radius 16;
  mép sáng và bóng nhỏ tĩnh. Giữ height/padding/text, không ép layout compact.
- Hover/focus chuyển fill trắng/edge xanh, giữ ring. Readonly/disabled/invalid có
  vật liệu riêng; native attrs, value/label/validation vẫn thuộc form/caller.
- Choice KPH giữ palette semantic, radio/check và selection; bỏ cảm giác nét
  kép bằng một edge với bóng thấp. Unit và footer radius đồng bộ, nhóm trắng.
- Login một outer shell cho icon/input/reveal, không thêm border lồng. Hero
  search/CTA giữ vật liệu riêng; không nhuộm canvas trắng đã duyệt.
- Reduced motion/transparency bỏ bóng, high contrast dùng hệ màu OS; không thêm
  blur, JS listener, dependency hoặc thay domain/API/storage/authorization.

## Files

- `apps/store-pwa/src/store-form-soft.css`: recipe, state, preference fallbacks.
- `store-app-frame.tsx`, `store-login.tsx`: import stylesheet local; không đổi props/logic.
- `e2e/scripts/check-store-form-soft.cjs`: baseline field bounds, rendered boundary/
  value/placeholder contrast, focus, native readonly và lỗi thật, login/reveal/
  error recovery, 150% chữ và forced-colors.
- Surface guide/Form controls/Visual DNA/component catalog, CURRENT_STATE/NEXT,
  plan và technical này: tên và recipe/phạm vi, không nhận owner acceptance hộ.

## Gate và evidence

Đã chạy trên production mock build tại 4301, artifact synthetic/ignored trong
`.local/form01/`; Playwright Chromium headless, không Computer Use. Các kiểm tra:

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS; 333 tests (Store 280, Admin 16,
  API 2, rules 19, UI 16), typecheck, contract/examples/generated client và hai
  production builds/PWA. Log `verify.log`. Cảnh báo chunk ExcelJS lớn có từ base.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build
  -- --outDir ../../.local/form01/build --emptyOutDir`: PASS; build dùng để xem/QA.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_FORM_OUTPUT=.local/form01/production-controls
  node e2e/scripts/check-store-form-soft.cjs`: PASS 390×844,1440×1024,320×844,
  375×812,844×390. Đối chiếu baseline 4296 (runtime e5628ab không đổi qua f77034d):
  bounds 4 field giữ trong 1px; contour≥3:1, value/placeholder≥4.5:1; keyboard
  focus, readonly, lỗi thật/focus lỗi, login/reveal/recovery, chữ 150%, forced colors.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_CREATE_FORMS_OUTPUT=.local/form01/production-kph
  node e2e/scripts/check-kph-create-forms.cjs`: PASS cả 2 loại tại 390/1440/320;
  validation/link lỗi, Other/calendar, ảnh/recovery, review, focus và contrast.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_REPORT_OUTPUT=.local/form01/production-header
  node e2e/scripts/check-report-header.cjs`: PASS 390/1440/320; mẫu dài 60 mục,
  lựa chọn tạm/cancel/xác nhận, kỳ/calendar, chữ 150% và focus.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_REPORT_OUTPUT=.local/form01/production-report
  node e2e/scripts/check-report-fresh.cjs`: PASS 390/1440/320.
- `STORE_APP_URL=http://127.0.0.1:4301 node e2e/scripts/check-shelf-refinement.cjs`:
  PASS main + quick tại 390/1440/320; lỗi ngày/khoảng ngày, picker, chữ 150%,
  focus/contrast. Log `production-shelf.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_SCROLLBARS_OUTPUT=.local/form01/production-scrollbars
  node e2e/scripts/check-store-scrollbars.cjs`: PASS 390×844,1440×1024,1280×720,
  900×650,1440×500; 7 screens, modal/picker, drag native, lock/restore, không tràn
  ngang và forced colors. Sửa setup test: hash navigation/wheel có thể còn vị
  trí cuộn cũ; đợi ổn định rồi đặt thumb về đầu trước kéo. Không đổi CSS scroll,
  threshold hay thao tác native. Log `production-scrollbars.log`.
- `npm run check:docs`, `git diff --check`: PASS.

Đã xem screenshot KPH mobile, login desktop và report create mobile; các ảnh,
JSON và log tương ứng nằm trong thư mục production của `.local/form01/`.
Không có thay đổi runtime sau lượt build/QA này.

## Giới hạn / bước tiếp

Store Fresh memory-only, reports browser-local, không kiểm backend thật hoặc
Safari/Windows/thiết bị thật. Không thêm unit tests chỉ mirror CSS; kiểm qua
build/types, interaction/geometry/contrast và hồi quy các form có sẵn.

Owner xem 4301: Tạo KPH cả 2 loại → field/Other/lỗi/ảnh/review, KPH/DATE filters,
report picker/kỳ/tạo/lưu, Tra hạn main/quick, login/reveal/focus. Chưa merge.
