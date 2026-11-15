# Cách làm và bàn giao gọn

Áp dụng từ QA01, base `1ad0907`, theo yêu cầu owner15/11/2026. Thay quy trình
`delivery-cycle` trước đây; không cần skill điều phối hoặc plan JSON cho việc mới.
Hồ sơ cũ trong `docs/delivery/` là provenance, giữ nguyên trạng thái nghiệm thu.

- Bắt đầu bằng outcome, base SHA, scope sửa và rủi ro chính. Task branch/worktree
  riêng, một writer; chỉ chia agent khi có yêu cầu và scope thực sự độc lập.
- Giữ kế hoạch đang có khi resume; chỉ cập nhật điều thay đổi. Chọn test theo
  [TEST_STRATEGY](TEST_STRATEGY.md), không mở review vòng mới chỉ vì đã hết lượt.
- Ghi một kết quả ngắn: candidate/source, lệnh và kết quả, giới hạn và bước tiếp.
  Evidence chi tiết chỉ thêm khi giúp tái hiện lỗi hoặc đưa ra quyết định.
- Nếu cần owner thử, đưa đúng URL/mode/source đã xác minh, dữ liệu tổng hợp,
  thao tác ngắn và kết quả mong đợi. Chỉ giao phần cần phán đoán con người hoặc
  thiết bị thật; không bắt owner lặp ma trận authorization mà máy đã kiểm.
- Technical PASS không thay owner acceptance. Phản hồi chỉ mở lại phần bị ảnh
  hưởng; không tự merge main, push, deploy hoặc mở feature tiếp.

CURRENT_STATE/NEXT giữ trạng thái active. Chỉ cập nhật khi trạng thái hay bước
kế tiếp thay đổi; không tạo thêm bộ tài liệu quản lý để xác nhận cùng một việc.
Dừng khi outcome được bàn giao rõ, hoặc ghi đúng blocker cần owner giải quyết.
