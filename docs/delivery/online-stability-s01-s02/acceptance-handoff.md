# Acceptance handoff — online stability S01–S02

Candidate: `6836bc51cdf693626e7c608e23d3132f7d40c775`. Mode: Store PWA online.
Draft PR: <https://github.com/VuPhm/coopfood-kph/pull/3>.

## Chạy/dừng nhanh trên macOS

Từ repository root, bảo đảm OrbStack/Docker Desktop đang chạy:

```bash
./e2e/scripts/start-online-acceptance.sh
```

Mở `http://127.0.0.1:4173`, dùng một trong hai tài khoản fixture:

- CHT: `manager.e2e` / `manager-e2e-password`
- Nhân viên: `employee.e2e` / `employee-e2e-password`

Dừng và thu hồi database/media tổng hợp:

```bash
./e2e/scripts/stop-online-acceptance.sh
```

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

Quick runtime đã được kiểm start, đăng nhập same-origin, start lặp và stop lặp với
database/media tổng hợp; không dùng dữ liệu thật. Log/build được giữ dưới
`/tmp/coopfood-kph-online-acceptance` để hỗ trợ chẩn đoán.

## Quyết định owner

Project owner xác nhận **“pass, làm tiếp”** trong Codex ngày 16/09/2026 cho
candidate `6836bc5`. Owner acceptance đạt; cycle S01–S02 được đóng ở revision 3.

Quyết định này không tự mở rộng sang merge `main`, deploy hoặc S03. PR #3 có thể
chuyển từ draft sang ready-for-review; hành động tiếp theo cần yêu cầu riêng.
