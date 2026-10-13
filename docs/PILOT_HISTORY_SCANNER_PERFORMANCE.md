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

## Giới hạn

Mock decoder kiểm lifecycle/scheduling, không chứng minh đọc được barcode thật
trong điều kiện camera/ánh sáng cụ thể. Cần kiểm mã không nhận trên thiết bị báo
lỗi; phân biệt camera preview, nhận chuỗi barcode và kỳ vọng lookup sản phẩm.
Không reset dữ liệu hoặc đổi DB version, API, backend, dependency hay Pages config.
