# Hợp đồng nghiệp vụ

Mọi thay đổi trong file này cần acceptance test và xác nhận nghiệp vụ. Không thay
đổi chỉ để làm code đơn giản hơn.

## Ngày và hạn lùi

- Hiển thị/nhập: `dd/mm/yyyy`.
- Timezone nghiệp vụ: `Asia/Ho_Chi_Minh`.
- Backend sử dụng `LocalDate`/database `date` cho ngày nghiệp vụ.
- `HSD` phải sau `NSX`; `HSD == NSX` và `HSD < NSX` là validation error.
- `shelfLife = HSD - NSX + 1`.
- Nếu `shelfLife < 10`: hạn lùi bằng HSD.
- Nếu `shelfLife >= 10`:
  - hạn lùi là `round(20% × shelfLife)`;
  - khoảng cảnh báo là `round(40% × shelfLife) - round(20% × shelfLife)`.
- Sau HSD luôn là hết hạn.
- Cần cố định chính xác cách làm tròn hiện tại bằng golden tests trước khi viết
  lại implementation.

## Phiếu KPH

- Hai loại: Thực phẩm khô & khác (`TPCN`) và Thực phẩm tươi sống (`TPTS`).
- Tối đa ba ảnh minh chứng.
- TPCN có tình trạng `Cận date`, `Hết HSD`, `Rách bao bì`, `Xì chân không`,
  `Khác`; mặc định `Cận date`. TPTS có `Dập úng`, `Thối mốc`, `Cận date`,
  `Hết HSD`, `Khác`; mặc định `Dập úng`.
- Ngày phát hiện là ngày nghiệp vụ hiện tại theo `Asia/Ho_Chi_Minh`; Store PWA
  hiển thị read-only và không cho người dùng sửa.
- Phiếu lưu người/cửa hàng/thời điểm tạo và catalog snapshot.
- Condition hoặc biện pháp `Khác` có nội dung chi tiết optional; khi trống giữ nhãn
  `Khác`/`KHÁC` tương ứng thay vì báo lỗi.
- Không xóa cứng phiếu đã đồng bộ; vô hiệu hóa phải có lý do và audit.
- Ngoại lệ pilot local-only theo ADR-0002: phiếu chưa đồng bộ được chuyển vào
  thùng rác và khôi phục trên cùng thiết bị; Store PWA không có xóa vĩnh viễn.
- Ngoài ngoại lệ pilot, `STORE_MANAGER` (CHT) có membership đúng cửa hàng chỉ
  thao tác duyệt trong UI lịch sử; không được xóa hoặc vô hiệu hóa phiếu. Quyền
  vô hiệu hóa cho cấp quản trị tương lai chưa chốt và không được suy diễn cho
  `CHAIN_ADMIN`.
- Cửa sổ thời gian sửa/duyệt chưa chốt; implementation không được tự đặt giới hạn.
- Ảnh gốc upload và bản stamped dẫn xuất đều private, giữ theo vòng đời phiếu;
  stamped không thay thế evidence gốc. Ngoại lệ pilot local-only theo ADR-0002
  chỉ persist JPEG stamped đã nén để kiểm soát dung lượng thiết bị; không được
  coi là policy của online MVP. Baseline tem: JPEG output, resize giữ tỷ
  lệ không upscale trong `1280×720`, stamp góc dưới trái gồm giờ/thứ/ngày và
  store code/name; timestamp hiển thị ưu tiên EXIF rồi `lastModified` rồi
  controlled/server clock theo `Asia/Ho_Chi_Minh`. Audit timestamp là server time
  riêng.

## Catalog và quét

- `barcode`, `sku_code`, `supplier_code` là chuỗi.
- Một SKU có thể có nhiều barcode.
- Một barcode active chỉ thuộc một product active trong catalog published.
- Quét barcode trả không quá một kết quả.
- Kết quả quét tối thiểu gồm barcode, SKU, tên sản phẩm, mã và tên NCC chính.
- Dữ liệu staging không được xuất hiện trong lookup cửa hàng.
- Barcode không tìm thấy hiển thị lựa chọn quét lại hoặc nhập tay. Fallback manual
  phải lưu barcode đã quét (nếu có) cùng trạng thái `NOT_FOUND`, không suy diễn
  product hoặc hiển thị danh sách để người dùng chọn.
- Một NCC có thể cung cấp nhiều sản phẩm. Chính sách nhiều NCC cho một SKU/product
  và chọn NCC chính vẫn phải được chốt riêng trước publish.

## Excel

- Giữ layout generated baseline từ legacy: một loại phiếu mỗi lần xuất, landscape,
  fit width 1, title hàng 5, header hai tầng hàng 7–8, 16 cột logic; ảnh mở rộng
  thành O:Q, người duyệt ở R, tối đa ba ảnh stamped giữ tỷ lệ/thứ tự.
- Giữ thông tin Co.op Food/Store, footer `BM-331.CF`/lần ban hành/trang, Times
  New Roman và sheet protection theo outcome legacy.
- Mẫu Excel và logo approved dùng repository legacy read-only làm provenance;
  chỉ canonical fixture tổng hợp hoặc asset đã được duyệt mới được đưa vào repo mới.
- Hệ thống mới chỉ được coi là tương thích khi vượt qua golden
  structural/render test với dữ liệu tổng hợp. Baseline generated legacy đã
  được chọn cho delivery: chỉ xuất record `SUBMITTED` cùng store/type do
  `STORE_MANAGER` đúng membership thực hiện, ghi audit, để trống approver R
  và không chèn logo. Full approval workflow vẫn chưa được mở.
