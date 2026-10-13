# Pilot: lịch sử nhiều phiếu và quét liên tiếp

Base `c10f502`, branch `codex/github-pages-pwa`, yêu cầu ngày 13/10/2026.
Hai round; chỉ dữ liệu tổng hợp trong test, chưa có phép đo trên iPhone thật.

## Round 1 — tái hiện và sửa điểm nghẽn

- Lịch sử 200 phiếu: chọn một phiếu gọi render trạng thái cho 400 row/card.
  Memo row/card với callback ổn định giảm còn 2 lần (desktop + mobile của phiếu
  thay đổi). Không dùng ngưỡng timing dễ nhiễu làm acceptance test.
- ZXing constructor delay 100 ms chỉ áp dụng sau thành công; source
  `BrowserCodeReader` mặc định `timeBetweenDecodingAttempts = 0` cho frame thất
  bại. Đặt rõ 100 ms cho retry, vẫn giữ formats và TRY_HARDER hiện có; dừng
  decode ngay khi nhận một mã để tránh thêm công việc trong feedback 450 ms.
- Callback form đổi identity trước đây mở camera lần hai. Scanner đọc callback
  hiện hành qua ref cập nhật layout effect, không restart vì parent render lại.
- Enumerate camera chạy nền và có session guard; không chặn preview/decoder.
  Ideal 1280×720 áp dụng cả khi chọn device cụ thể, tránh mở frame lớn hơn cần thiết.
- Lưu phiếu chỉ chờ commit dữ liệu, không chờ quota/persistent-storage telemetry;
  lịch sử hydrate độc lập với health. Lỗi health không biến save đã commit thành
  failed draft. Thumbnail lazy/async; ảnh xem đầy đủ và ảnh xuất Excel giữ nguyên.
- Scanner nói rõ kết quả điền SKU/UPC, tên hàng hóa/NCC nhập tay. Pilot chưa có
  catalog lookup; không tạo lookup giả hoặc suy diễn SKU/tên/NCC từ barcode.

Test trước patch fail đúng các trường hợp trên; sau patch cover selection,
parent rerender/latest callback, miss retry, slow enumeration, quota pending/fail.

## Round 2 — giới hạn DOM và recovery decoder

- Lịch sử dựng 50 phiếu ban đầu, thêm từng nhóm 50 bằng nút “Hiển thị thêm”.
  Filter/sort thực hiện trước khi cắt nhóm; đổi loại, filter, sort hoặc trash mode
  reset nhóm. Toàn bộ phiếu vẫn ở bộ nhớ, tổng số/chọn tất cả/duyệt/xoá mềm/
  khôi phục/xuất Excel vẫn xử lý toàn bộ phạm vi hiện hành, kể cả phiếu chưa dựng.
- Với 1.000 phiếu tổng hợp, render ban đầu chỉ 50 row + 50 mobile card; chọn một
  phiếu chỉ render lại row/card của nó. Duyệt nhiều phiếu dùng Set membership
  thay cho tìm ID tuyến tính ở từng record.
- Native detector chỉ được dùng khi hỗ trợ đủ các formats đã chấp nhận; nếu
  hỗ trợ một phần, dùng ZXing để tránh các formats còn lại không được thử decode.
  Native reject ba frame liên tiếp cũng chuyển sang cùng ZXing fallback trên
  video đang chạy, không xin camera lần hai. Một frame lỗi hoặc kết quả rỗng
  không tự coi là lỗi; detect thành công reset bộ đếm lỗi liên tiếp.
- Test 20 lượt quét/mở lại với camera opt-in: mỗi mã trả về đúng một lần,
  callback phiên cũ bị bỏ qua, dùng một stream và dừng track khi unmount.
  Cả hai engine lỗi vẫn cho nhập tay. Đây là mock lifecycle, không phải camera thật.
- Copy xuất Excel được đồng bộ với thay đổi workbook có thể chỉnh sửa đã commit
  trước hai round này; không còn ghi “khóa định dạng”.

## Kiểm tra

- `npm --workspace @coopfood-kph/store-pwa test`: 226 test / 21 file pass (bao gồm
  1.000 phiếu, chọn/xuất đủ 1.000, sort toàn tập, duyệt/filter, xoá/khôi phục,
  native thiếu formats, lỗi liên tiếp, 20 lượt quét và stale callback).
- `npm run build` và build Store PWA với `--base /coopfood-kph/`: pass.
  Warning chunk ExcelJS >500 kB hiện hữu, dependency này vẫn tải theo yêu cầu.
- `npm run check:docs`, `git diff --check`: pass.
- Browser riêng trên origin 5185, mode test và fixture 1.000 phiếu trong bộ nhớ:
  xác nhận xem thêm 50→100; mobile 320/375 px không tràn ngang, desktop 1280 px.
  Không seed/xoá/sửa dữ liệu origin preview 5184 hoặc GitHub Pages. Harness nằm
  ngoài repo trong `/tmp`, không build/commit vào ứng dụng.

## Giới hạn

Mock decoder kiểm lifecycle/scheduling, không chứng minh đọc được barcode thật
trong điều kiện camera/ánh sáng cụ thể. Cần kiểm mã không nhận trên thiết bị báo
lỗi; phân biệt camera preview, nhận chuỗi barcode và kỳ vọng lookup sản phẩm.
Không reset dữ liệu hoặc đổi DB version, API, backend, dependency hay Pages config.
Ảnh của toàn bộ lịch sử vẫn hydrate vào bộ nhớ; giảm DOM và lazy thumbnail chưa
giải quyết toàn bộ áp lực bộ nhớ khi lịch sử có rất nhiều ảnh. Bước kiểm tiếp theo:
thử mã thực bị báo lỗi trên điện thoại đó và đo phiên thêm/quét liên tục với ảnh.
Hai round ban đầu chỉ commit local. Ngày 13/10/2026 người dùng cho phép ship
cùng [round 3 kiểm ảnh](PILOT_PHOTO_PERFORMANCE_ROUND3.md) sau khi verification pass.
