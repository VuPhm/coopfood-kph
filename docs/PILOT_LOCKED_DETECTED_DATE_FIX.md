# Pilot Pages — ngày phát hiện bị khóa nhưng vẫn báo nhập ngày

Ngày: 20/10/2026. Worktree `0cc0`, branch `codex/github-pages-pwa`.
Baseline sạch, đồng bộ origin: `f6b4d57`.

## Báo cáo và đường lỗi

Người dùng xác nhận Android báo lỗi ở **Ngày phát hiện** trong form tạo KPH,
dù trường đã khóa. Chưa có model/browser version hoặc kiểm tra trên máy thật.

Code có hai điểm tái hiện được trong regression test:

- Ngày mặc định dùng nguyên `Intl.DateTimeFormat("vi-VN").format()`, nhưng
  parser/validation yêu cầu `dd/mm/yyyy` với chữ số Latin. Nếu chuỗi locale khác
  thứ tự, separator hoặc có ký tự điều hướng ẩn thì ngày tự sinh không parse
  được; `initialMonth` còn có thể throw khi render. Không thể yêu cầu người dùng
  sửa ngày vì trường chỉ đọc.
- `CalendarInput` có HTML readonly nhưng handler vẫn gọi `onValueChange` khi
  nhận change event. Sự kiện mang giá trị rỗng/khác có thể làm hỏng ngày khóa.

Theo [MDN về Intl.format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/format),
output có thể khác giữa implementation và chứa literal/ký tự điều hướng.
Đây là cơ chế tương thích đã mô phỏng trong test, chưa phải xác nhận output
thực tế trên thiết bị Android báo lỗi.

## Patch

File thay đổi: `apps/store-pwa/src/business-date.ts`,
`apps/store-pwa/src/calendar-input.tsx`, `apps/store-pwa/src/business-date.test.ts`,
`apps/store-pwa/src/calendar-input.test.tsx`,
`apps/store-pwa/src/create-record-date-compatibility.test.tsx` và tài liệu này.

- Dùng phần year/month/day đã tách theo `Asia/Ho_Chi_Minh`, chỉ định Gregorian
  và Latin digits; tạo ISO rồi dùng `formatDisplayDate` của rule hiện có để
  sinh chính xác `dd/mm/yyyy`. ISO và display cùng một nguồn ngày.
- Handler CalendarInput bỏ qua change khi readonly. Giữ thuộc tính readonly,
  nút lịch disabled và khả năng đọc ngày bằng accessibility.
- Không nới validator hoặc đổi schema; ngày xử lý vẫn optional và kiểm tra ngày
  hợp lệ khi được nhập. Không thay DB, API, Pages config hay dữ liệu đã lưu.

## Kiểm chứng

- Trước sửa: 13 test fail khi mô phỏng format() không canonical và change
  trên readonly; 5 case hiện hành/timezone vẫn pass.
- Thêm 19 regression cases: locale format khác/ẩn ký tự, biên ngày/năm và năm
  nhuận theo giờ Việt Nam, readonly change rỗng/ISO/ngày khác, lưu hai loại KPH
  với ngày khóa, và ngày xử lý không hợp lệ vẫn bị từ chối.
- `npm --workspace @coopfood-kph/store-pwa test`: **272 tests / 26 files pass**.
- `npm run build`: pass.
- `npm --workspace @coopfood-kph/store-pwa run build -- --base /coopfood-kph/`:
  pass; cảnh báo chunk ExcelJS có sẵn không đổi.
- `npm run check:docs`, `git diff --check`: pass.
- Smoke production preview riêng tại `127.0.0.1:5192/coopfood-kph/`, đúng script
  `index-De8_Z1QZ.js`: TPCN/TPTS đều hiện `20/10/2026`, readonly và native validity
  hợp lệ; nhập hàng/người, chọn PNG tổng hợp và lưu mà không chỉnh ngày. TPTS
  vẫn nhận barcode `2912345612345` thành `1.234 kg`; mỗi loại lưu một phiếu.
  Không truy cập hoặc sửa dữ liệu vận hành thật.

## Giới hạn / bước tiếp theo

Preview dùng desktop Chromium, chưa phải Android thật. Kiểm trên đúng thiết bị
báo lỗi: mở lại/reload candidate, tạo một phiếu mỗi loại, giữ ngày khóa và lưu.
Không xóa site data/cache bằng cách reset IndexedDB; phiếu pilot nằm cục bộ.
Rollback revert riêng commit, không migration hoặc reset dữ liệu.
