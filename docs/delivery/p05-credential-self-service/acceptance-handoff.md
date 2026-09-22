# P05 — Owner acceptance handoff

Trạng thái: **pending owner decision**  
Technical candidate: `39c0cff`  
Record checkpoint: `63aed66`

## Cách nghiệm thu

Dùng hai preview loopback đang chạy:

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
ngay trước submit. Bước submit cuối cần owner thực hiện trực tiếp.

## Quyết định owner

Chưa có sign-off. Khi nghiệm thu xong, ghi trong message thực tế của owner:

- `acceptedBy`: tên/role owner;
- `decisionRef`: tham chiếu message sign-off;
- kết luận pass hoặc danh sách thay đổi cụ thể.

Không đánh dấu P05 `CLOSED` hoặc tích hợp vào `main` khi thiếu sign-off này.
