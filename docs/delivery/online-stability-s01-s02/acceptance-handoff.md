# Acceptance handoff — online stability S01–S02

Candidate: `ac90677da6c92f0511ae3f6133cb90cd6e347c33`. Mode: Store PWA online.

## Kịch bản nghiệm thu

1. Bắt đầu tạo phiếu ở cửa hàng A khi response chậm, đóng form và chuyển sang B.
   Khi response A về, lịch sử/selection/thông báo ở B không đổi.
2. Bắt đầu tạo phiếu, đăng xuất rồi đăng nhập lại trước khi response cũ về. Phiên
   mới không nhận record, selection hoặc thông báo của generation cũ.
3. Chọn nhiều phiếu để duyệt; nếu một request lỗi sớm trong khi request khác còn
   chạy, nút vẫn ở trạng thái `Đang duyệt…` tới khi cả lô hoàn tất.
4. Sau partial failure, thông báo nêu đúng số thành công/thất bại; chỉ phiếu lỗi
   còn được chọn. Bấm duyệt lại chỉ gửi các phiếu lỗi.
5. Lô từ năm phiếu trở lên không có quá bốn request approval chạy đồng thời.

Online preview kỹ thuật đã chạy tại `http://127.0.0.1:4173` với database/media
tổng hợp và được dừng sau browser gate. Có thể khởi động lại cùng runbook E2E nếu
owner muốn thao tác trực tiếp; không dùng dữ liệu thật.

Trạng thái quyết định: **pending owner acceptance**. Việc test kỹ thuật đạt không
tự suy diễn thành merge, push, deploy hoặc quyền mở S03.
