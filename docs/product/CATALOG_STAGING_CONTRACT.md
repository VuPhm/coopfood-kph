# Catalog staging contract — C01

Trạng thái: **Candidate — chờ owner nghiệm thu C01**  
Cập nhật: 2026-09-21

## Mục tiêu và quyền

C01 nhận catalog tổng hợp vào vùng staging để kiểm tra trước khi publish. Chỉ
active user có global role `CATALOG_ADMIN` được upload và đọc batch. `CHAIN_ADMIN`
không ngầm có quyền catalog. Backend là authority; ẩn/hiện UI không thay guard.

C01 không tạo `catalog_versions`, `suppliers`, `products`, `product_suppliers`
hoặc `product_barcodes`, vì vậy dữ liệu staging không thể xuất hiện trong lookup
cửa hàng. Publish và lựa chọn NCC chính thuộc C02 sau quyết định nghiệp vụ riêng.

## File CSV

- File UTF-8, cho phép UTF-8 BOM và quoted field theo CSV thông thường.
- Header bắt buộc, đúng thứ tự: `NCC,Tên NCC,UPC,SKU,Tên sản phẩm`.
- Giới hạn vận hành C01: tối đa 5 MiB và 50.000 dòng dữ liệu; file rỗng bị từ chối.
- `NCC`, `UPC`, `SKU` luôn là string: trim khoảng trắng ngoài nhưng không parse
  số, không bỏ leading zero và không normalize nội dung khác.
- Tên NCC và tên sản phẩm được trim; cả năm field đều bắt buộc khác rỗng.

## Validation và trạng thái

- Cùng mã NCC trong một batch phải có cùng tên NCC.
- Cùng SKU trong một batch phải có cùng tên sản phẩm.
- Một UPC chỉ được xuất hiện một lần trong batch; lặp y hệt hoặc trỏ SKU khác
  đều là lỗi ở các dòng liên quan. Một SKU vẫn được có nhiều UPC khác nhau.
- Mỗi dòng giữ raw values, normalized values và message có `code`, `field`,
  `message`; UI không cần suy diễn lại rule backend.
- Batch không lỗi có trạng thái `VALIDATED`; có ít nhất một lỗi là `REJECTED`.
  Dòng không lỗi là `VALID`, dòng có lỗi là `ERROR`. C01 chưa sinh warning.
- Batch và row immutable sau khi kết thúc request; không có sửa/xóa/hard delete.

## Upload lại và audit

SHA-256 tính trên bytes file gốc. Upload lại đúng bytes bởi người có quyền trả
batch đã có và đánh dấu `replayed=true`; không tạo row hay audit trùng. File khác
tạo batch độc lập, không thay thế batch trước và không làm thay đổi lookup.

Mỗi batch mới ghi một audit event kết quả `CATALOG_IMPORT_VALIDATED` hoặc
`CATALOG_IMPORT_REJECTED` với batch ID, checksum, số dòng/số lỗi và tên field
metadata tối thiểu. Không ghi file bytes, raw row, session, password hoặc PII đầy đủ.
