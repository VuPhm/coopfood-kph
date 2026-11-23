# Công việc kế tiếp

DATEON02 đã có candidate trên `store-app/dateon02-durable-lots` từ UI09
`4d671a6`. [Trạng thái](CURRENT_STATE.md) · [Evidence DATEON02](delivery/dateon02-durable-lots.md).

1. Owner thử nhập lô, tải lại và chọn SKU đã ghi nhớ tại cửa hàng ở [Store local](http://127.0.0.1:4783/).
2. DATEON03 bổ sung xử lý từng phần DATE → KPH theo contract. DATEON04 nối lịch nhắc chung. Báo cáo snapshot kỳ và C02 catalog publish ở các slice sau. [Contract DATE](product/DATE_DURABLE_CONTRACT.md) · [ADR0008 Proposed](adr/0008-durable-date-partial-processing.md).
3. Owner xem cùng một phiếu đã duyệt ở Store và Admin theo vai CHAIN01. Trên iPhone thật kiểm camera, bàn phím, safe area và quay lại form sau khi đổi ứng dụng. Còn kiểm độ dễ đọc/in của Excel thực và các gate restore/deployment trước rollout. [Quyết định bốn vai](product/KPH_APPROVAL_SCOPE.md) · [Bàn giao KPH](delivery/kphon04-review-export/handoff.md).
