# REPORTON01 · Báo cáo kỳ từ lô DATE

Base NOTIFON01 `0db4e36`. Store chọn báo cáo tổng hợp, cần chú ý hoặc đã xử lý, chọn lô qua các trang và tìm kiếm, rồi lưu bản tuần hoặc tháng đang mở. Ngày chốt do server xác định theo Asia/Ho_Chi_Minh. Kỳ chứa ngày chốt. Lịch sử giữ nguyên tên, kỳ, người tạo, cửa hàng, số lượng và trạng thái của từng lô khi lưu. Tổng còn theo dõi tách EA và kg và giữ độ chính xác thập phân của DATE.

Backend cấp capability REPORT cho cửa hàng trưởng đúng cửa hàng, quản lý vùng có assignment active đúng vùng và quản lý chuỗi. Mỗi lần truy cập đều kiểm quyền. Source và lịch sử có phân trang. POST nhận ID và version của 1–1000 lô, đọc cùng một snapshot PostgreSQL và từ chối toàn bộ nếu lô khác store hoặc version đã đổi. Header, dòng, idempotency và audit cùng transaction. Retry đã commit trả bản cũ kể cả sau khi kỳ kết thúc. V13 nối tiếp V12.

Hợp đồng gồm các route date-reports/source, date-reports, date-reports/{reportId} và date-reports/{reportId}/rows trong [OpenAPI](../../contracts/openapi/kph.openapi.yaml). Đây là báo cáo các lô đang theo dõi DATE. Báo cáo tồn kho, xuất Excel/In online và mẫu cá nhân chưa thuộc phạm vi triển khai. [Hợp đồng DATE](../product/DATE_DURABLE_CONTRACT.md) · [Thiết kế báo cáo](../product/STORE_REPORTS_DESIGN.md).
