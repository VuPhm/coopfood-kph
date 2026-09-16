# Acceptance handoff — P01 provisioning policy

Candidate: `bc86d4c81c43102028c4f519d101de02aa3f580c`.
Mode: product/security policy, ADR và fixture synthetic; chưa triển khai P02.

## Quyết định owner đã chấp nhận

1. Có ba scope quản lý: `STORE_MANAGER` đúng store, `REGION_MANAGER` đúng vùng
   gồm nhiều store và `CHAIN_ADMIN` toàn chuỗi. Cả quản lý vùng và admin tổng
   được đi xuống store trong scope tương ứng.
2. User/region/store/assignment/membership dùng lifecycle an toàn, audit và guard
   chống self-lockout/last-admin/last-manager; không hard delete.
3. Store mới inactive; chỉ activate khi region active và có active
   `STORE_MANAGER` trong store.
4. Password/reset/session theo NIST/OWASP baseline đã ghi trong policy.
5. Không seed/default admin; bootstrap/recovery local, điều kiện chặt và audit.

## Ranh giới least privilege đã áp dụng

- `REGION_MANAGER` thao tác KPH và quản lý store profile/membership trong vùng,
  nhưng không cấp global/region role, tạo/khóa global user hoặc reset credential.
- `CHAIN_ADMIN` quản trị identity/region/store toàn chuỗi và thao tác KPH tại mọi
  active store; không tự có quyền catalog.
- Store → region luôn do backend resolve. Fixture có allow đúng vùng và deny với
  store hợp lệ nhưng ngoài vùng.

## Cách kiểm

- Policy: `docs/product/PROVISIONING_POLICY.md`.
- ADR: `docs/adr/0004-scoped-management-hierarchy.md`.
- 36 allow/deny cases:
  `contracts/fixtures/golden/identity/provisioning-policy-cases.json`.
- Chạy `npm run check:contracts` hoặc toàn bộ `npm run verify`.

## Trạng thái quyết định

Owner message ngày 17/09/2026 bắt đầu bằng “1. có 1 cấp quản lý vùng gồm nhiều
store” đã sửa điểm 1 và duyệt/căn theo tiêu chuẩn an toàn các điểm 2–5. Revision
2 triển khai đúng quyết định đó; technical gate đã pass trên candidate nêu trên.
