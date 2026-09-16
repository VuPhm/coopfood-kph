# Acceptance handoff — P01 provisioning policy

Candidate: `88b12e457237b32518e067d86bd20831625ff545`.
Mode: product/security policy và fixture synthetic; chưa triển khai P02.

## Quyết định cần owner chấp nhận hoặc sửa

1. Chỉ `CHAIN_ADMIN` quản trị user/store/role/membership/credential; role này
   không tự có quyền KPH hoặc catalog. KPH vẫn bắt buộc membership đúng store.
2. User, store và membership không hard delete. Hệ thống chặn self-lockout,
   admin active cuối cùng và manager active cuối của cửa hàng đang hoạt động.
3. Store mới inactive và chỉ activate khi có active `STORE_MANAGER`.
4. Password-only baseline là tối thiểu 15 Unicode code point, hỗ trợ ít nhất 64,
   không composition/rotation định kỳ; reset buộc đổi và vô hiệu access cũ.
5. Không seed/default admin. Bootstrap local chỉ chạy khi chưa từng có admin;
   recovery local là luồng riêng khi active admin bằng 0 và luôn audit.

## Cách kiểm

- Đọc policy tại `docs/product/PROVISIONING_POLICY.md`.
- Đọc 25 allow/deny cases tại
  `contracts/fixtures/golden/identity/provisioning-policy-cases.json`.
- Chạy `npm run check:contracts`; thay outcome/role guard quan trọng mà không cập
  nhật validator có chủ đích sẽ làm Contract Lock fail.

## Trạng thái quyết định

Technical gate revision 1 đã pass. Owner gate đang chờ; câu “tạm cho pass, tiếp”
ngày 17/09/2026 đã được dùng để đóng S04 và cho phép bắt đầu P01, không được suy
diễn là đã chấp nhận nội dung policy P01 được tạo sau đó.
