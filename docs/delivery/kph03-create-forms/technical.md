# KPH03 — hai form tạo phiếu Fresh, 22/10/2026

## Phạm vi và baseline

Yêu cầu trực tiếp: “146e2e1 từ đây áp tiếp cho kph; tối ưu toàn diệu cho
2 form tạo phiếu”. Base chính xác `146e2e16bd78c37bc0b726bdd73e1903d022571b`;
worktree `/Users/vup/.codex/worktrees/kph03-create-forms/coopfood-kph`, nhánh
`store-app/kph03-create-forms`, current chat là sole writer. Main vẫn giữ
nguyên. Hướng vật liệu đọc từ bộ guide UI03 trên main3fe1c9c; không mang
implementation nào từ nhánh thử cũ vào task.

TPCN/TPTS dùng chung CreateRecordDialog; chỉ composition Fresh/screen đổi từ
năm sang bốn nhóm, quantity ghép vào Hàng hóa. Default dialog của online/Pilot
vẫn năm nhóm và nguyên trường/luồng. Shared form nhận cải thiện error linkage,
ảnh async/session và chặn submit lặp; không đổi schema, option/default, date,
lookup contract, snapshot, original/stamped hay idempotency policy.

Không đổi list/grouping KPH02, Home/DATE/reports, backend/OpenAPI, packages/ui,
lockfile/config hoặc Pages. Không tự merge/push/deploy. Owner visual pending.

## Implementation

- `create-record-dialog.tsx`: gộp số lượng ở Fresh, ngày read-only thành hàng
  gọn; lỗi barcode/product/quantity/optional details/calendar/recorder/note có
  aria-invalid và liên kết error ID qua Field adapter local, không sửa primitive.
  Thiếu ảnh đưa focus tới thông báo; khi focus native radio/file, giữ label
  trong vùng cuộn phía trên footer. Review/edit giữ draft/ảnh.
- Bỏ root watch theo từng ký tự barcode, lookup đọc getValues lúc blur/scan;
  không thêm debounce hay thay kết quả found/miss/service failure. ChoiceGroup
  tiếp tục đăng ký cùng RHF sau reset để ô “Khác” mở đúng.
- Session guard bỏ kết quả ảnh đang xử lý sau close/reset/unmount, thu hồi URL
  trung gian; khóa picker trong batch, chặn submit trùng lúc saving. Ảnh online
  giữ nguyên bytes, ảnh Pilot vẫn xử lý/đóng tem như trước.
- `store-kph-create-forms.css`: chỉ `.store-create-screen[data-kind]`, holder
  trắng/edge#dfe5e9/bóng thấp, lựa chọn pastel/sheens/viền trong suốt lúc nghỉ,
  selected/check/focus vẫn rõ. Input giữ contour, mobile16px/52px; choice≥52px,
  xóa thumbnail44px; footer48px, safe-area/native scroll, desktop hai cột.
- `store-glass.css`: cho create portal nhận các token vật liệu đã có và
  preference overrides; không sao chép giá trị, không thêm blur surface.
- `store-kph-loading.tsx`: bốn nhóm/số lượng/ngày gọn đồng bộ geometry thật.
  `store-kph-workspace.tsx` chỉ import stylesheet có scope; host/lazy portal giữ.
- Test component và `e2e/scripts/check-kph-create-forms.cjs` kiểm nghiệp vụ,
  error linkage, ảnh muộn, material/contrast/Other/calendar/photos/review/focus.

## Kết quả và giới hạn

Số đo trước trên production mock main4263 (source146e2e1), sau trên task4272,
Chromium headless, cùng font/viewport, TPCN rỗng trước lỗi/ảnh:

| Viewport | Scroll content trước | Sau | Giảm |
| --- | --- | --- | --- |
| 390×844 | 1725px | 1542px | 183px (~10,6%) |
| 1440×1024 | 1203px | 1144px | 59px (~4,9%) |

Min-height/text/record của workspace không đổi. Đây là chiều dài form, không
phải chiều cao modal hoặc kết luận thời gian thao tác của người dùng. TPTS có
option matrix riêng; không ép đồng chiều dài với TPCN. Không thêm backdrop-filter
trong form/review/scrim. Screenshot đã xem mobile/desktop/form/review.

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS docs, Contract Lock/OpenAPI
  drift, types, **298 tests** (Admin16/Store245/API2/rules19/UI16), online/default
  builds và PWA. Log `.local/kph03/verify-final.log`.
- Production mock build PASS, precache114 entries; chỉ warning ExcelJS chunk
  lớn đã biết. Log `.local/kph03/mock-build.log`.
- `check-kph-create-panel.cjs` PASS390/1440/320 × normal/reduced motion, CPU6×:
  một portal/overlay/entrance, skeleton/live chênh≤1px, giữ scroll/draft/ảnh,
  review/edit, resize/viewport thấp, hủy/mở mới/submit/focus.
- `check-kph-create-forms.cjs` PASS TPCN/TPTS ×390/1440/320: material/contrast
  (text≥4,5:1, contour/focus/selection≥3:1 trong scope đo), error descriptions,
  optional Other/calendar Escape, thiếu ảnh focus đúng, max3/xóa/chọn lại,
  review/edit, no overflow và shadow tĩnh/reduced preferences. Log `forms.log`.
- Sau gate tích hợp/panel, chỉ giới hạn transition của choice/photo còn
  background/border; gate form và mock build chạy lại trên cùng source cuối.
  Không thay geometry/domain/lazy/portal, nên giữ evidence panel và unit gate.
- `npm run check:docs`, `git diff --check`: PASS.

So sánh lab mở form đang được ghi riêng bên dưới trước handoff; không dùng
một sample để tuyên bố nhanh hơn baseline.
Evidence ignored trong `.local/kph03/`: baseline ảnh ở `/tmp/kph03-before`,
`forms/results.json`/screenshots/contrast, `panel/results.json`, log verify/build.
Không commit ảnh/dữ liệu vận hành thật. Các ảnh dùng fixture tổng hợp.

Chỉ mock/Chromium và component regression; chưa chứng minh backend thật, camera
phần cứng, Safari/IME/keyboard thiết bị thật hoặc pin/GPU. Không coi event timing
CPU throttling là field INP hay toàn app đạt WCAG.

## Owner review

Production mock preview <http://127.0.0.1:4272/#kph>. Mở lần lượt **TP khô & khác**
và **TP tươi sống**; xem khối đầu/số lượng, đổi tình trạng và Khác, thử ảnh,
Xem lại → Chỉnh sửa để kiểm draft. Dữ liệu mẫu chỉ trong phiên, không gửi backend.
Gate owner đang pending; kỹ thuật PASS không tự thay nghiệm thu thực.
