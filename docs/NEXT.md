# Công việc kế tiếp

Bắt đầu nhánh backend từ `store-app/ui09-restored-baseline` để kế thừa giao diện Store/Admin và quy tắc CHAIN01. [Trạng thái và nguồn tích hợp](CURRENT_STATE.md) · [Evidence UI09](delivery/ui09-restored-baseline.md).

1. DATEON02 bổ sung lưu, đọc, tạo và sửa lô theo cửa hàng, có quyền, version và audit. Đưa OpenAPI, examples, generated client và migration nối tiếp vào cùng slice. Nối kết quả backend vào workspace hiện có. Ưu tiên nhu cầu ghi nhớ mã và tên hàng đã nhập thành công theo cửa hàng để tuần sau còn gợi ý. [Contract DATE](product/DATE_DURABLE_CONTRACT.md) · [ADR0008 Proposed](adr/0008-durable-date-partial-processing.md).
2. Triển khai xử lý từng phần DATE → KPH và lịch nhắc chung theo contract. Quantity là lượng đang theo dõi. Chỉ quản lý trong scope được sửa lịch. Báo cáo snapshot kỳ và C02 catalog publish ở các slice sau.
3. Owner xem cùng một phiếu đã duyệt ở Store và Admin theo vai CHAIN01. Trên iPhone thật kiểm camera, bàn phím, safe area và quay lại form sau khi đổi ứng dụng. Còn kiểm độ dễ đọc/in của Excel thực và các gate restore/deployment trước rollout. [Quyết định bốn vai](product/KPH_APPROVAL_SCOPE.md) · [Bàn giao KPH](delivery/kphon04-review-export/handoff.md).
