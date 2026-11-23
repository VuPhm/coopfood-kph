# DATEON02 · Lô DATE bền vững theo cửa hàng

Base `4d671a6` thuộc nhánh `store-app/ui09-restored-baseline`.
[Contract và quyết định nghiệp vụ](../product/DATE_DURABLE_CONTRACT.md).

Nhân viên nhập SKU dạng chuỗi, tên, HSD, lượng theo dõi và đơn vị. NSX có
thể bỏ trống. Sau khi lưu và tải lại, phiếu lô vẫn thuộc cửa hàng ban đầu.
Lần nhập sau ở cùng cửa hàng, gợi ý lấy từ các lần lưu thành công. Bản ghi
cửa hàng khác không xuất hiện trong kết quả tìm hoặc gợi ý.

Người quản lý sửa trong phạm vi với lý do và phiên bản đã đọc. Nếu có người
sửa trước thì tải lại bản mới, tránh ghi đè. Đổi vai hoặc cửa hàng phải kiểm
lại quyền ở backend. UI dùng danh sách compact, chi tiết và mốc DATE của UI09.
Lọc, đếm và sắp xếp trên tập đúng cửa hàng trước phân trang.

Luna API giữ backend và migration nối tiếp. Luna wire giữ OpenAPI, examples
và generated client. Luna Store nối workspace online. Điều phối kiểm bằng một
lượt nhập → tải lại → gợi ý → sửa trên PostgreSQL fixture nâng cấp từ V9.
Xử lý DATE → KPH và lịch nhắc chung thuộc các slice sau.

## Kiểm trên candidate ngày 23/11/2026

- OpenAPI và generated client đạt `npm run check:contracts` và
  `npm run check:api`. Có 31 API fixtures trong 39 mục manifest.
- `DateLotHttpIntegrationTest` đạt với PostgreSQL 17 sạch. Kiểm tạo và retry,
  phiên bản cũ trả 409, scope của nhân viên/cửa hàng trưởng/vùng/chuỗi,
  thu hồi quyền và audit. Fixture preview nâng từ Flyway V9 lên V10.
- Store TypeScript đạt. Vitest hai file online session/create đạt 15 ca.
  Playwright ở 390×844 và 1440×1024 kiểm thêm lô với NSX trống, giữ chính xác
  `0.37525 kg` sau tải lại, chọn gợi ý SKU giữ số 0 đầu, cửa hàng trưởng
  sửa thành `1.12505 kg` với lý do và cửa hàng khác nhận danh sách gợi ý rỗng.
  API thật cũng xác minh snapshot catalog FOUND và barcode NOT_FOUND.
- [Store online](http://127.0.0.1:4783/) dùng backend và dữ liệu tổng hợp.
  [Tài khoản thử](admin03-store-membership/handoff.md).
  Camera và thao tác trên iPhone thật còn chờ owner.
