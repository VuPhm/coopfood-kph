# P05 — Owner acceptance handoff

Trạng thái: **ACCEPTED — 23/09/2026**
Technical candidate: `39c0cff`
Record checkpoint: `63aed66`

## Cách nghiệm thu

Preview loopback đã dùng ở đợt verification 22/09/2026 (không khẳng định còn chạy):

- Store PWA: `http://localhost:4173`
- Admin Web: `http://localhost:4175`

Đăng nhập bằng fixture tổng hợp local được script acceptance hiển thị. Trên
mỗi entry point, mở “Đổi mật khẩu” và xác nhận:

1. Sai mật khẩu hiện tại bị từ chối với thông báo gần form.
2. Mật khẩu ngắn, blocklist và reuse bị từ chối; không echo secret.
3. Mật khẩu hợp lệ làm UI quay về login và yêu cầu đăng nhập lại.
4. Mật khẩu cũ không đăng nhập được; mật khẩu mới đăng nhập được.
5. Một session thứ hai đã mở trước thay đổi nhận `401` ở request kế tiếp.
6. Audit chỉ có credential version, không có password/hash/session.

Automated backend đã xác nhận các outcome mutation/session/audit ở
`IdentityHttpIntegrationTest`; browser review đã xác nhận form/accessibility đến
ngay trước submit. Đây là phạm vi bằng chứng tự động/browser ngày 22/09; quyết định owner bên dưới
được ghi riêng, không suy diễn thành một lần chạy browser mới.

## Quyết định owner

- `acceptedBy`: project owner (người dùng).
- `decisionRef`: task `01a0ca34-2ef9-7992-9aaa-5c64d21587a1`, message ngày
  23/09/2026: “chuyển về p05, pass, làm tiếp”.
- Kết luận: **PASS P05**; không yêu cầu sửa bổ sung. Cycle đóng và tiếp tục
  chuẩn bị PR tích hợp riêng P05.
- Code được nghiệm thu: `39c0cff`; branch checkpoint khi nhận sign-off:
  `cabc300`. Diff giữa hai commit chỉ là tài liệu, không thay behavior.

Owner không cung cấp log thao tác từng scenario/thiết bị. Sign-off này là quyết
định nghiệm thu thực, không được ghi thành bằng chứng iPhone hoặc production.
P04/D01/O01 và primary supplier/C02 tiếp tục ngoài scope; pass không đồng nghĩa
đã merge hoặc deploy.
