# P05 — Hợp đồng đổi mật khẩu của chính user

Trạng thái: **Implementation candidate — chờ technical verification và owner acceptance**  
Cập nhật: 2026-09-22

## Outcome

Mọi active user đang đăng nhập có thể đổi mật khẩu của chính mình từ Store PWA
hoặc Admin Web. Backend xác minh mật khẩu hiện tại, áp dụng policy cho mật khẩu
mới, ghi audit và làm toàn bộ session đã tạo trước thay đổi mất hiệu lực.

## Contract

- Endpoint `POST /api/v1/auth/password/change` yêu cầu session hợp lệ, CSRF,
  `currentPassword` và `newPassword`; không nhận username/user ID từ client.
- Password mới dài 15–64 Unicode code point. Không trim, normalize, silently
  truncate, chặn paste hay áp composition rule.
- Password mới không được trùng mật khẩu hiện tại, nằm trong blocklist local hoặc
  chứa username/tên sản phẩm `coopfood`/`kph` theo cách dễ đoán.
- Sai mật khẩu hiện tại và vi phạm policy trả problem code riêng nhưng không echo
  password, hash hoặc chi tiết blocklist.
- Thành công trả `204`, cập nhật hash và tăng `credential_version` trong cùng
  transaction, ghi `CREDENTIAL_CHANGED`, rồi vô hiệu session hiện tại. Session
  khác bị loại ở request kế tiếp khi principal refresh thấy version không khớp.
- Hash mới có prefix thuật toán. BCrypt cũ không prefix và `{bcrypt}` vẫn được
  verify; đổi mật khẩu là điểm chuyển sang encoder mới, không reset hàng loạt.
- Audit chỉ chứa credential version mới; không chứa password, hash, session ID,
  request body hoặc display name.

## UX

- Cả hai entry point có hành động “Đổi mật khẩu” cạnh thông tin tài khoản.
- Form có label hiển thị, `autocomplete=current-password/new-password`, cho paste
  và password manager, nút hiện/ẩn có accessible name, xác nhận mật khẩu mới,
  helper text policy và lỗi gần form.
- Khi thành công, UI xóa cache/session local và đưa về màn hình đăng nhập với
  thông báo phải đăng nhập lại bằng mật khẩu mới.

## Ngoài phạm vi

- Admin reset người khác, forgot-password, temporary password, `RESET_REQUIRED`,
  bootstrap/recovery, SSO/MFA/passkey và delivery secret.
- Password rotation định kỳ, composition rule, email/SMS hoặc production rate
  limit tuning.

