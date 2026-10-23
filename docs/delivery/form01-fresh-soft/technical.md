# FORM01 revision 2 — Co.op Fresh Soft, mép nhẹ theo Home

Ngày 24/10/2026. Owner xem revision 1 tại 4301 và nhận xét “viền vẫn dày, có thể
cân nhắc triết lý viền của các item home, tham khảo iếp theo ios27”. Tiếp cùng
nhánh `store-app/form01-fresh-soft`, worktree
`/Users/vup/.codex/worktrees/form01-fresh-soft/coopfood-kph`, base
`f77034d9c14b88f5ae6359e31cfd23b4e3e6b0d8`, một writer, không team.
Revision 1 `de548b7` và [evidence cũ](revision1.md) được giữ làm lịch sử;
không dùng thay cho kiểm vật liệu revision 2.

**Tên giữ Co.op Fresh Soft (`coop-fresh-soft-v1`).** Preview revision 2:
<http://127.0.0.1:4302/#kph>. Technical và owner acceptance tách riêng;
chưa merge/push/deploy.

## Checkpoint và gate

Candidate `56e2edd3aae3710aec7de8101a20f158c5189956` chứa runtime/test đúng working tree đã
kiểm trên production artifact. Sau QA không sửa runtime; commit ledger tiếp
chỉ ghi bằng chứng. Technical PASS revision 2; owner pending, chưa merge.

## Quyết định và nguồn tham khảo

- Home dùng border trong suốt/mép 6%, pastel, mép sáng và bóng card thấp.
  Form nghỉ nay dùng edge `rgb(0 60 40 / 6%)` thay `#7d9084`; fill `#f0f7f3`,
  highlight trắng và bóng `0 2px 5px rgb(0 60 40 / 5%)`. Hộp border 1px vẫn giữ
  bounds, radius 16, không thay padding/height/text hoặc canvas trắng.
- Hover chỉ đổi fill `#eaf4ee`; focus dùng edge xanh/fill trắng/ring thật.
  Error, selected, readonly và disabled giữ trạng thái/semantics. Tăng tương
  phản hoặc forced colors dùng Canvas/CanvasText, bỏ bóng, cả login shell.
- Chữ gợi ý login đổi sang màu muted đậm hơn để đạt 4.5:1 trên fill mới. Số
  lượng chỉ ở Store Fresh có placeholder “Nhập số lượng” khi trống; không đổi
  default 1, validation, logic hoặc online/Pilot.
- [Apple iOS 27](https://www.apple.com/lae/os/ios/) nhấn mạnh độ đọc, độ tách lớp
  và khả năng điều chỉnh vật liệu; [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
  hướng dẫn chọn vật liệu theo vai trò. Áp dụng ở đây là diễn giải cho PWA,
  không sao chép native glass hoặc thêm blur/lớp filter.
- Viền nghỉ là trang trí khi đã có label và content/placeholder rõ. Audit
  phân biệt cue với contour theo [WCAG 1.4.11 — Boundaries](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html#boundaries):
  field thiếu cue vẫn cần contour≥3:1; chữ≥4.5:1 và focus/error/selection≥3:1.
  Search cho phép icon tương phản + content, vẫn cần accessible name. Không
  dùng kết quả scoped để tuyên bố chứng nhận WCAG đầy đủ.

## Files

- `apps/store-pwa/src/store-form-soft.css`: resting/focus/hover và fallback.
- `apps/store-pwa/src/create-record-dialog.tsx`: placeholder Số lượng có scope.
- `e2e/scripts/check-kph-colors.cjs`: audit cue nhận diện; không bỏ ngưỡng chữ/
  focus/selected. `check-store-form-soft.cjs` có fixture đối chứng: field thiếu
  content, cue ẩn, chữ nhạt và focus nhạt phải thất bại; field đủ cue mới pass.
- Recipe/Form controls/Visual DNA/catalog, CURRENT_STATE/NEXT và ledger r2.
  Import từ StoreAppFrame/StoreLogin giữ nguyên revision 1. Không đổi packages/ui,
  dependency, API, rule ngày, ảnh/snapshot, authorization hoặc storage.

## Kiểm tra trên production mock

Runtime source đã được build và kiểm trước checkpoint; các artifact synthetic
đều ignored trong `.local/form01/`, Chromium headless. Không dùng Computer Use.
Port 4301 và 4302 cùng serve `.local/form01/build`; 4302 là origin mới cho owner.

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build
  -- --outDir ../../.local/form01/build --emptyOutDir`: PASS; `r2-build.log`.
- `VITEST_MAX_WORKERS=2 npm run verify`: PASS 333 tests (Store 280, Admin 16,
  API 2, rules 19, UI 16), types/contracts/examples/generated client và hai
  production builds/PWA; `r2-verify.log`. ExcelJS large chunk là cảnh báo từ base.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_FORM_OUTPUT=.local/form01/r2-production-controls
  node e2e/scripts/check-store-form-soft.cjs`: PASS 390×844,1440×1024,320×844,
  375×812,844×390; geometry 4 field so baseline 4296 giữ trong 1px, mép nghỉ nhẹ,
  label/content, focus/error/readonly, login/reveal/recovery, chữ 150%, forced
  colors và increased contrast. Đối chứng audit đủ 4 trường hợp âm đều reject.
- Cùng script chạy tại 4302, output `.local/form01/r2-preview-controls`: PASS
  cả 5 viewport; đây là đúng origin bàn giao, cùng production artifact.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_CREATE_FORMS_OUTPUT=.local/form01/r2-production-kph
  node e2e/scripts/check-kph-create-forms.cjs`: PASS cả 2 loại ở 390/1440/320,
  linked validation, Other/calendar, ảnh 1–3/recovery, review và focus.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_REPORT_OUTPUT=.local/form01/r2-production-report
  node e2e/scripts/check-report-fresh.cjs`: PASS 390/1440/320, gồm audit text/cue.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_REPORT_OUTPUT=.local/form01/r2-production-header
  node e2e/scripts/check-report-header.cjs`: PASS 390/1440/320, picker 60 mục,
  chọn tạm/cancel, giữ kỳ, calendar, chữ 150% và focus.
- `STORE_APP_URL=http://127.0.0.1:4301 node e2e/scripts/check-shelf-refinement.cjs`:
  PASS main + quick ở 390/1440/320, lỗi ngày/duration, picker, text150/focus.
  Log `r2-production-shelf.log`; ảnh/JSON ở `.local/shelf02/refinement`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4301 STORE_SCROLLBARS_OUTPUT=.local/form01/r2-production-scrollbars
  node e2e/scripts/check-store-scrollbars.cjs`: PASS 390×844,1440×1024,1280×720,
  900×650,1440×500; 7 màn, modal, native drag, lock/restore/no overflow/forced colors.
- `npm run check:docs`, `git diff --check`: PASS trước checkpoint.

Đã xem screenshot production KPH ở 390/1440 và login390: không còn contour đậm
quanh mọi field; selected/error/focus vẫn tách rõ. Dev HMR từng đổi thứ tự CSS
lazy khiến quantity desktop 44px; production fresh navigation xác nhận 52px khớp
baseline, cả 5 viewport geometry pass. Dùng production artifact để owner xem.

## Giới hạn và bước tiếp

Mock memory-only/browser-local, chưa kiểm backend hoặc Safari/Windows/thiết bị
thật; kiểm Chromium không thay nghiệm thu owner. Owner xem 4302: mở tạo KPH,
để trống Số lượng, Tab vào ô nhập, gây lỗi, thử Other/ảnh/review; kiểm filters,
Báo cáo/Tra hạn/login. Nhìn mép nghỉ, không gian và độ rõ trước duyệt; chưa merge.
