# DATE04 revision2 — bottom panel và tự nhập,28/10/2026

Owner tại4388/#date: “dùng bot pannel, cho tuỳ chọn tự nhập, cái nút lắp quá chắp vá”.
Hiểu bot panel là bottom panel; tiếp cùng task/branch/worktree DATE04, root sole
writer. Scope V1/rules/date/duplicate/source/persistence giữ; không dispatch team,
merge/push/deploy. Revision1 f899c9c không được coi là owner đã nghiệm thu.
[Receipt revision1](technical-r1.md) giữ bằng chứng trước phản hồi.

Preview mới <http://127.0.0.1:4390/#date>. Technical PASS, owner revision2 pending.

## File và kết quả

- `store-date-workspace.tsx`, `store-date-fresh.css`: trả heading về tên/count;
  đưa entry vào group Thao tác DATE, cạnh Cần chú ý/Lọc. Mobile nút+44px có
  accessible name/title Thêm theo dõi; desktop thêm chữ. Dùng Button asChild
  giữ ref, token/hover/focus/primary hiện có; icon trắng đúng contrast, không
  sửa component UI chung hoặc chồng palette riêng lên control khác.
- `store-date-intake.css`: neo bottom0 trên mọi viewport, rộng tối đa760px,
  cao min84dvh/820px, chừa ít nhất32px phía trên; góc24px ở trên, vuông dưới.
  Nội dung cuộn, footer không nhảy giữa Tra mã hàng/Tự nhập. Slide CSS220ms/
  exit140ms, transform/opacity hữu hạn, reduced-motion bỏ effect, không per-frame
  JS/blur/new dependency. Header close hit-test được ở chữ200%.
- `store-date-intake.tsx`: hai lựa chọn ngay đầu panel. Tự nhập mở SKU/tên/loại,
  barcode tùy chọn, mã lô/NSX/HSD; không cần tra thất bại trước. Switching method
  dùng cùng reset sản phẩm, pending lookup cũ bị invalidated. Barcode nhập tay
  là field riêng, không mặc định bằng SKU. Nhánh tra lỗi/miss giữ nguyên recovery.
- `store-app-mock.ts`, `store-date-intake-model.ts`: provenance MANUAL cho dữ
  liệu tự nhập chưa tra, không giả NOT_FOUND/FOUND. Barcode trim khoảng trắng,
  giữ số0 đầu. Validation/mốc/trùng/request ID/DATE→KPH/Thông báo/Report chung
  giữ implementation V1; không API/schema/persistence backend mới.

## Kiểm tra

- `npm run check --workspace @coopfood-kph/store-pwa` — PASS.
- `npm run test --workspace @coopfood-kph/store-pwa -- src/store-date-intake.test.tsx
  src/store-date-intake-model.test.ts src/store-date-workspace.test.tsx --maxWorkers=2`
  — PASS3files/15tests. Test mới xác nhận nhập trực tiếp không gọi catalog và
  lưu MANUAL + SKU/barcode số0 đầu, không dùng NOT_FOUND cho kết quả chưa tra.
- `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa`
  — PASS120precache, Excel chunk warning kế thừa. Không đổi dependency/root config.
- `STORE_PREVIEW_URL=http://127.0.0.1:4390 STORE_DATE_OUTPUT=/tmp/date04-r2/panel
  node e2e/scripts/check-date-intake-panel.cjs` — PASS390×844/1440×1024/320×740/
  844×390: entry trong toolbar thay heading, target44 và màu icon bằng màu text;
  bottom đúng viewport, có khoảng trên/góc24/24/0/0; footer delta≤1px khi đổi
  mode; tự nhập→lưu→notification→đúng detail; contrast, chữ200/no overflow,
  close hit-test, reduced-motion và JS errors0. Guard icon đã bắt một override
  toolbar làm icon xanh trên nút xanh; sửa selector cục bộ, không nới assertion.
- `STORE_PREVIEW_URL=http://127.0.0.1:4390 STORE_DATE_OUTPUT=/tmp/date04-r2/workflow
  node e2e/scripts/check-date-intake.cjs` — PASS390/1440/320: FOUND/SKU, manual
  after miss, unavailable/retry, identity preservation, required dates,
  duplicate/reveal/exact batch/barcode, KPH seed, report membership, discard,
  scanner denied mock/recovery, contrast/text200/close.
- `npm run check:docs`, `git diff --check` — PASS.

[Log](verification-r2.txt), [panel results](panel-r2-results.json),
[workflow results](workflow-r2-results.json). Screenshots `/tmp/date04-r2/panel/`
và `/tmp/date04-r2/workflow/`; đã xem toolbar390 và panel nhập390.

## Coverage reuse và giới hạn

300Store tests/14targeted cùng DATE-actions/report-management ở revision1 là
bằng chứng nền tại f899c9c (receipt r1), không tuyên bố đã chạy full301 ở r2.
R2 không đổi các tính ngày/duplicate/append/report/KPH callback; input manual
mới và model trim được15tests cùng browser r2 kiểm. Record/gate kỹ thuật r1 đã
reset khi mở r2, owner vẫn pending. Không có sign-off hoặc quyền deploy mới.

Mock trong phiên; reload mất lô mới, chưa backend/API DATE hoặc camera/keyboard
thiết bị thật. Test viewport ngắn/chữ lớn không thay real-device QA. Không thêm
quantity, nhập Excel hoặc thay luật NSX/HSD. Bước nhỏ tiếp: mở nút+ trên DATE,
chọn Tự nhập ngay trong bottom panel, nhập một lô và xem vị trí thao tác mới.
