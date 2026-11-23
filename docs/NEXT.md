# Công việc kế tiếp

DATE online lõi đã đạt kiểm kỹ thuật tới DATEON04 trên nhánh
`store-app/dateon04-shared-reminders`.
[Trạng thái](CURRENT_STATE.md) · [Evidence DATEON04](delivery/dateon04-shared-reminders.md).

1. Owner thử trên [Store local](http://127.0.0.1:4785/). Cửa hàng trưởng mở lô
   đang theo dõi và xác nhận hẹn 1/7 ngày. Nhân viên cùng cửa hàng mở lại lô
   để xem ngày hẹn chung. Kiểm nhịp thao tác DATE → KPH và bố cục iPhone thật.
2. Nối Thông báo với lô DATE thật, dùng mốc hạn và lịch đã hẹn. Sau đó làm
   báo cáo snapshot kỳ. C02 catalog publish là slice riêng.
   [Contract DATE](product/DATE_DURABLE_CONTRACT.md) · [ADR0008 Proposed](adr/0008-durable-date-partial-processing.md).
3. Owner xem cùng một phiếu đã duyệt ở Store và Admin theo vai CHAIN01. Trên iPhone thật kiểm camera, bàn phím, safe area và quay lại form sau khi đổi ứng dụng. Còn kiểm độ dễ đọc/in của Excel thực và các gate restore/deployment trước rollout. [Quyết định bốn vai](product/KPH_APPROVAL_SCOPE.md) · [Bàn giao KPH](delivery/kphon04-review-export/handoff.md).
