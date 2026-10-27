# DATE04 — nhập theo dõi DATE, candidate28/10/2026

Yêu cầu tiếp preparation: owner “làm”. Branch/worktree giữ nguyên task
`store-app/date04-intake-prep`, `/Users/vup/.codex/worktrees/date04-intake-prep/coopfood-kph`;
base a286a6c, root sole writer, không dispatch team. Remote freshness không kiểm
vì đây là mock UI slice local. Preview <http://127.0.0.1:4388/#date>.

## Kết quả và lựa chọn V1

- Thêm theo dõi ở DATE mở form Sản phẩm / Thông tin lô / Mốc DATE. Dùng StoreSheet,
  RHF/Zod, CalendarInput, StoreSearchField và BarcodeScannerDialog hiện có; full
  viewport mobile, dialog desktop, footer đứng yên và content cuộn bên trong.
  Close có xác nhận draft khi đã nhập; scanner/confirm quay lại giữ dữ liệu.
- Nhập SKU chính xác hoặc barcode trong catalog mock; FOUND xác nhận tên/loại,
  NOT_FOUND giữ mã và nhập tay explicit. Catalog lỗi giữ trạng thái riêng,
  retry/nhập tay không biến thành miss. Mã tra gốc lưu riêng; nhánh nhập tay chỉ
  gán mã đó thành barcode khi người dùng chọn xác nhận, không mặc định SKU=barcode. Request cũ không ghi đè mã mới.
- Defaults đã thông báo trước thực hiện: SKU/tên/NSX/HSD bắt buộc, mã lô tùy
  chọn, chưa quantity/Excel/thiếu NSX mới. Ngày hết HSD/NSX tương lai được giữ
  phase thật và có lời nhắc kiểm tra, không tự tạo KPH. Đây là candidate V1
  prototype để owner duyệt, không nâng thành policy online accepted.
- Lưu vào nguồn DATE chung chỉ sau validate; trạng thái Mở, chưa có reminder/KPH.
  Chọn đúng loại, bỏ bộ lọc đang che lô, mở đúng detail. Lô cảnh báo hiện ở
  Thông báo; report danh mục thấy cùng nguồn. Đóng/lỗi không thêm lô.
- ID nội bộ tách batchCode (null nếu chưa có). Fixture cũ vẫn dùng ID làm mã lô;
  lô mới dùng mã thực/Chưa có mã lô trong list/detail/notification/report/Excel,
  không lộ UUID như mã hàng. Search hỗ trợ batch/barcode snapshot mới.
- Duplicate bảo thủ: cùng SKU/mã lô thì chặn; nếu thiếu mã lô, cùng SKU/NSX/HSD
  là ứng viên trùng và chặn. Hai mã lô khác nhau có thể cùng ngày. Không gộp/
  ghi đè/tự mở lại resolved; có đường xem lô chưa resolved. Request ID giữ cho
  retry, append cùng ID trả cùng nguồn không thêm lần hai. Không claim đây là
  idempotency/unique constraint backend hoặc chống đua giữa thiết bị.
- Metadata explicit của lô nhập tay đi tiếp DATE→KPH (SKU/barcode/name/kind/note);
  chưa rõ loại thì giữ Chưa phân loại và chọn loại khi xử lý. Không tạo catalog.
- Form/validation chunk chỉ tải khi bấm entry; style nút entry nằm trong DATE CSS
  sẵn có, hit area44 ngay trước khi lazy chunk tải. Helper list/ID nhẹ không kéo
  Zod/form vào startup. Không dependency/root config/migration/API mới.

## File runtime và test

`store-date-intake.tsx/css/model.ts` là form + validation; `store-date-lot.ts`
đặt batch label/duplicate/idempotent append; `store-app-mock.ts` thêm optional
batchCode/productSnapshot. `store-date-workspace.tsx/fresh.css` thêm entry và
nối lưu/reveal/search. `store-date-actions.ts` dùng metadata explicit mới.
`store-notifications.tsx`, `store-date-report.tsx/model.ts/export.ts` dùng batch
thực; `store-report-library.ts` roundtrip batch qua history, giữ schema cũ.
Snapshot report clone metadata để không thay theo nguồn sau tạo.

Tests mới `store-date-intake-model.test.ts` và `store-date-intake.test.tsx`;
workspace test thay assertion creation chưa hỗ trợ bằng entry đã có. Không tắt
test hoặc nới timeout. Fixture report mới dùng filter search rỗng đúng schema
history hiện có; không nới guard để fixture tìm kiếm sai được persist.

## Kiểm tra và bằng chứng

1. `npm run check --workspace @coopfood-kph/store-pwa` — PASS.
2. `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2` — PASS
   43files/300tests. Sau đó chỉnh clone metadata snapshot/disable input khi save/
   tách helper khỏi lazy validation và làm rõ manual barcode; targeted intake-model/intake/report-model/
   report-library — PASS4files/14tests. CSS footer/close được gate browser cuối
   kiểm lại; không đổi rules/workflow khác sau full suite.
3. `VITE_STORE_APP_MOCK=false npm run build --workspace @coopfood-kph/store-pwa`
   — PASS92precache; mock true — PASS120precache. Mock cuối gồm toàn bộ source
   hiện hành/typecheck. Warning Excel chunk lớn kế thừa. Form JS11.10KB/gzip3.93KB
   + CSS3.28KB/gzip1.00KB deferred; actual request check xác nhận chưa tải form
   chunk khi vào DATE, chỉ tải sau bấm Thêm theo dõi.
4. `STORE_PREVIEW_URL=http://127.0.0.1:4388 STORE_DATE_OUTPUT=/tmp/date04/final
   node e2e/scripts/check-date-intake.cjs` — PASS390×844/1440×1024/320×740:
   entry44 trước lazy load; FOUND theo SKU, invalid dates, thêm/reveal/shared
   notification, tìm batch/barcode, duplicate không ghi nguồn, NOT_FOUND manual
   giữ số0 đầu/kind explicit, discard giữ draft, report thấy lô mới, KPH seed
   name/barcode/note; unavailable recovery; text200/no overflow; close thực sự
   hit-test được ở200%; contrast trên form. Scanner denied giả lập mở và quay
   về nhập tay giữ mã, không dùng camera thật.
5. `STORE_PREVIEW_URL=http://127.0.0.1:4388 STORE_DATE_OUTPUT=/tmp/date04/actions
   node e2e/scripts/check-date-actions.cjs` — PASS390/1440/320: nhắc1/7ngày/due,
   DATE→KPH TPCN/TPTS prefill/cancel/review/save đúng1record/resolved, unknown kind.
6. `STORE_PREVIEW_URL=http://127.0.0.1:4388 STORE_REPORT_OUTPUT=/tmp/date04/reports
   node e2e/scripts/check-report-management.cjs` — PASS390/1440/320: create/name/
   history/reuse/template/filter/selection/focus. Gate không tải/render PDF;
   test workbook mới kiểm mã lô thực trong cellC10 và legacy exporter suite giữ.
7. `npm run check:docs`, `git diff --check` — PASS.

[Unit/browser log](verification-output.txt), [intake browser results](browser-results.json).
Screenshots local `/tmp/date04/final/`; đã xem form filled390 và text200390,
headerclose/footer sau sửa. Full suite và targeted có coverage reuse rõ ở trên;
final browser chạy trên runtime sau các sửa cuối. Phép kiểm request lazy chạy
trước phần xác nhận barcode mới; boundary lazy không đổi, phần UI bổ sung chỉ
thuộc chunk deferred đã được gate browser cuối kiểm lại.

## Giới hạn và nghiệm thu

Đây là Store mock trong phiên: reload mất lô mới, chưa API DATE/persistence/
backend authorization. Saved report vẫn dùng mock library local hiện có, không
chứng minh production. Không mở Excel bulk, quantity, edit/delete hoặc nhánh
lưu thiếu NSX. Không kiểm camera OS/iOS/Android thật hoặc benchmark FPS mới;
route motion giữ implementation đã accepted, form không thêm per-frame engine.

Technical PASS; owner form/business V1 pending. Scenario nhỏ tiếp: DATE → Thêm
Theo dõi → nhập SKU0008421 hoặc barcode8936000123456 → mã lô mới/NSX/HSD → Thêm;
đối chiếu lô trong DATE/Thông báo. NOTIF01 vẫn chưa có owner acceptance riêng;
MOTION01 accepted được giữ. Chưa merge/push/deploy.
