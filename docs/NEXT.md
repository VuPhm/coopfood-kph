# Công việc kế tiếp

Cập nhật: 2026-09-17

## Active next — P01 provisioning policy

Project owner đã cho phép tiếp tục sau khi “tạm cho pass” S04. P01 chỉ chốt
contract nghiệp vụ và fixture cho quản trị tài khoản/cửa hàng; chưa triển khai
Admin UI, endpoint, migration hoặc cơ chế bootstrap thật.

### Outcome

- Chốt ai được tạo/khóa user và store, gán/thu hồi membership/global role,
  reset credential và đọc audit provisioning.
- Chốt bootstrap first admin/recovery không có tài khoản hoặc mật khẩu mặc định.
- Chốt hiệu lực của deactivate/role/membership/credential reset lên session hiện
  tại và các guardrail last-admin/self-lockout.
- Có role matrix và fixture tổng hợp đủ ca allow/deny để P02 dùng chung qua
  OpenAPI/backend/Admin tests sau khi owner chấp nhận.

### Ràng buộc đề xuất để review

- `CHAIN_ADMIN` chỉ quản trị identity/store/membership qua Admin capability;
  không bypass store membership cho KPH. `CATALOG_ADMIN` chỉ quản trị catalog.
- `STORE_MANAGER` tiếp tục chỉ duyệt/xuất trong đúng store membership; không tự
  cấp user hoặc membership. Không self-service signup.
- User/store/membership dùng deactivate/revoke có audit, không hard delete.
- Credential reset không echo/log secret và phải làm session cũ mất hiệu lực;
  không áp dụng password rotation định kỳ hoặc câu hỏi bảo mật.

### Ngoài phạm vi

- P02 implementation, OpenAPI endpoint, generated client, migration và Admin UI.
- Email/SMS reset, SSO/MFA, production secret delivery hoặc hosting policy.
- Catalog staging/publish, paging, backup/restore và production rollout.

### Acceptance P01

- Owner chấp nhận role matrix, bootstrap/recovery, lifecycle và credential policy.
- Fixture không cho `CHAIN_ADMIN` đọc/duyệt/xuất KPH nếu thiếu store membership;
  không cho `CATALOG_ADMIN`, `STORE_MANAGER` hoặc `EMPLOYEE` provision identity.
- Contract nêu rõ các quyết định còn hoãn và không chứa credential/PII vận hành.
- `npm run check:docs`, Contract Lock và validation fixture pass.

## Các mốc đã đóng

- Pilot-00, Foundation-01, Foundation-02 và S01–S03: xem evidence/cycle tương ứng.
- S04: [online-stability-s04](delivery/online-stability-s04/plan.json), owner
  chấp nhận có điều kiện ngày 2026-09-17; real-backend E2E vẫn hoãn.

## Sau P01

Chỉ mở P02 sau owner acceptance P01. Sau provisioning, thứ tự đề xuất còn lại:

1. C01 catalog staging/validation → C02 publish sau khi chốt primary supplier.
2. D01 paging theo số đo; O01 backup/restore; O02 profile triển khai; A01 nghiệm
   thu online trên thiết bị mục tiêu.

Chi tiết dependency/finding nằm tại
[REVIEW_AND_ROADMAP_2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
