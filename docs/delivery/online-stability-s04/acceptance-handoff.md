# Acceptance handoff — online stability S04

Candidate: `ebc9cdc84cc29bdde8f226ef71054a9eca5e4c32`.
Mode: Store PWA online; UI/contract không đổi.

## Kịch bản nghiệm thu

1. Đăng nhập và chuyển giữa hai cửa hàng: history cửa hàng cũ phải biến mất ngay;
   response create chậm từ cửa hàng/phiên cũ không được chèn record hay selection.
2. Đổi khoảng ngày: danh sách/count/selection phải theo query của khoảng hiện tại.
   Tạo record nằm ngoài khoảng đang lọc vẫn báo lưu thành công nhưng không chèn
   record ẩn hoặc tự chọn; xóa filter sẽ tải lại dữ liệu authoritative.
3. Duyệt một phiếu rồi đổi date filter: trạng thái duyệt không quay về cache cũ.
   Duyệt lô có lỗi một phần vẫn đợi toàn bộ request, refetch cuối cùng và chỉ giữ
   các phiếu lỗi được chọn để thử lại.
4. Login/create/review/export desktop/mobile giữ nguyên giao diện và quyền;
   EMPLOYEE không thấy thao tác manager, online không có delete/trash.
5. Pilot local-only tiếp tục hydrate/create/review/trash/export bằng IndexedDB và
   local state; không gọi gateway online.

## Trạng thái quyết định

Technical gate revision 1 đã pass với giới hạn real-backend E2E nêu trong
`technical-evidence.md`. Ngày 17/09/2026, project owner xác nhận “tạm cho pass,
tiếp”. Quyết định này chấp nhận candidate S04 để tiếp tục roadmap, đồng thời giữ
real-backend E2E chưa rerun là giới hạn được hoãn chứ không coi là đã pass.
