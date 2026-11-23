# REPORTON01 · Báo cáo kỳ từ lô DATE

Base NOTIFON01 `0db4e36`. Store chọn báo cáo tổng hợp, cần chú ý hoặc đã xử lý, chọn lô qua các trang và tìm kiếm, rồi lưu bản tuần hoặc tháng đang mở. Ngày chốt do server xác định theo Asia/Ho_Chi_Minh. Kỳ chứa ngày chốt. Lịch sử giữ nguyên tên, kỳ, người tạo, cửa hàng, số lượng và trạng thái của từng lô khi lưu. Tổng còn theo dõi tách EA và kg và giữ độ chính xác thập phân của DATE.

Backend cấp capability REPORT cho cửa hàng trưởng đúng cửa hàng, quản lý vùng có assignment active đúng vùng và quản lý chuỗi. Mỗi lần truy cập đều kiểm quyền. Source và lịch sử có phân trang. POST nhận ID và version của 1–1000 lô, đọc cùng một snapshot PostgreSQL và từ chối toàn bộ nếu lô khác store hoặc version đã đổi. Header, dòng, idempotency và audit cùng transaction. Retry đã commit trả bản cũ kể cả sau khi kỳ kết thúc. V13 nối tiếp V12.

Hợp đồng gồm các route date-reports/source, date-reports, date-reports/{reportId} và date-reports/{reportId}/rows trong [OpenAPI](../../contracts/openapi/kph.openapi.yaml). Đây là báo cáo các lô đang theo dõi DATE. Báo cáo tồn kho, xuất Excel/In online và mẫu cá nhân chưa thuộc phạm vi triển khai. [Hợp đồng DATE](../product/DATE_DURABLE_CONTRACT.md) · [Thiết kế báo cáo](../product/STORE_REPORTS_DESIGN.md).

## Kiểm trên candidate ngày 23/11/2026

- Lõi `b23b8a3`. PostgreSQL 17 sạch áp V1–V13. `DateLotHttpIntegrationTest` đạt 7/7, ca báo cáo chạy lại đạt sau khi thêm kiểm CSRF và tìm nguồn. Bao phủ kỳ cũ, version cũ, giữ lượng chính xác, replay, một audit, chặn nhân viên và chặn truy cập chéo cửa hàng/vùng sau khi đổi assignment.
- `npm run check:contracts` đạt 46 tài nguyên, 38 fixture API. Generated client sinh từ OpenAPI. Store TypeScript, build PWA online và 17 test mục tiêu đạt.
- Vòng giao diện gom tên hàng, SKU/lô, nhãn DATE, NSX/HSD và lượng theo dõi trong một dòng hàng có checkbox. Người dùng chọn tuần/tháng, thấy khoảng ngày, chọn trang hoặc bỏ chọn và chốt từ thanh hành động. Lịch sử hiển thị người chốt, kỳ và tổng còn theo dõi theo đơn vị.
- `E2E_REPORTON01=true E2E_APP_URL=http://127.0.0.1:4788 npm --prefix e2e test -- reporton01-date-reports.spec.ts` đạt 2/2 ở 390×844 và 1440×1024 trên backend thật. Mở đúng lô từ Thông báo, lưu báo cáo tuần, sửa nguồn từ 1,2345 kg thành 2,5 kg rồi tải lại lịch sử vẫn thấy 1,2345 kg. Desktop bỏ phản hồi sau khi commit rồi gửi lại, lịch sử có đúng một bản. Đã xem ảnh chụp hai viewport.

[Store online dùng thử](http://127.0.0.1:4788/) chạy với backend 8878 và PostgreSQL fixture riêng 55468. Dùng tài khoản mẫu `chain.admin03`, cửa hàng 001, mở Báo cáo và Lịch sử để xem bản đã chốt. [Tài khoản fixture](admin03-store-membership/handoff.md).

## Tiến độ và khoảng cách tới target

DATE lõi đạt 3/3 mốc kỹ thuật. Thông báo và báo cáo kỳ đạt 2/2. Bước tiếp theo là một lượt nghiệm thu chung Alpha, Delta và Beta trên cùng candidate. Thiết bị thật, restore và rollout còn chờ.
