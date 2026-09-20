# Công việc kế tiếp

Cập nhật: 2026-09-21

## P02 scoped authorization — đã đóng

Candidate P02 sau repair round 2 đã triển khai schema region/store mapping,
user-region assignment và KPH authorization kế thừa. Scope resolver và KPH
capability policy đã tách lớp; invariant active store → active region được giữ
bằng relational constraint an toàn khi concurrent. Technical gate đã pass và
owner chấp nhận ngày 2026-09-21.

Các outcome đã được chấp nhận:

1. `REGION_MANAGER` thao tác KPH trong đúng region và bị deny ở region khác.
2. Grant/revoke region assignment có hiệu lực ở request kế tiếp.
3. `CHAIN_ADMIN` truy cập active store toàn chuỗi mà không cần synthetic
   store membership.
4. Store hoặc region inactive bị deny kể cả khi user còn region/chain scope.

Handoff chi tiết: [p02-scoped-authorization](delivery/p02-scoped-authorization/acceptance-handoff.md).

## Quyết định trước slice lifecycle/provisioning kế tiếp

Owner đã yêu cầu deactivate store/region phải đặt lịch với ngày hiệu lực tùy
chọn nhưng cách thời điểm tạo lịch tối thiểu 30 ngày. Trước ngày hiệu lực entity
vẫn active; sau khi thực thi, authorization deny từ request kế tiếp. Không hard
delete; schedule/reschedule/cancel/execute đều phải audit và guard phải được kiểm
lại lúc thực thi.

Trước implementation chỉ còn phải khóa:

1. Danh sách cụ thể các thao tác deactivate/revoke khác được xếp là “xóa quan
   trọng” và cũng chịu thời hạn tối thiểu 30 ngày.
2. Có cho phép emergency suspend/revoke ngay khi xảy ra sự cố bảo mật hay không,
   và ai có quyền thực hiện ngoại lệ đó.

## Sau khi P02 slice đầu được chấp nhận — provisioning API/Admin UI

P01 đã được owner duyệt ngày 17/09/2026 với hierarchy explicit:
`CHAIN_ADMIN` toàn chuỗi, `REGION_MANAGER` đúng vùng và `STORE_MANAGER` đúng
store. Schema/authorization slice đã đóng; endpoint và Admin UI vẫn chưa mở
trong cycle implementation riêng.

### Outcome

- Chia P02 thành vertical slices nhỏ, bắt đầu từ schema/authorization cho region,
  store mapping và user-region assignment; chỉ một migration active.
- Cập nhật OpenAPI, examples, generated client, backend và Admin UI trong cùng
  slice khi public API thực sự được mở.
- Dùng fixture P01 làm nguồn test allow/deny cho toàn chuỗi, đúng vùng, đúng
  store và cross-region/cross-store.
- Giữ bootstrap/recovery và credential encoder migration thành slice riêng có
  verification bảo mật tương ứng.

### Contract đã khóa

- `CHAIN_ADMIN` quản trị toàn chuỗi và thực hiện KPH tại mọi active store.
- `REGION_MANAGER` thực hiện KPH và quản lý store profile/membership chỉ tại các
  store thuộc active region assignment; không quản lý global identity/credential.
- `STORE_MANAGER` tiếp tục duyệt/xuất trong đúng store membership.
- `CATALOG_ADMIN` chỉ quản trị catalog; không self-service signup.
- User/store/membership dùng deactivate/revoke có audit, không hard delete.
- Credential reset không echo/log secret và phải làm session cũ mất hiệu lực;
  không áp dụng password rotation định kỳ hoặc câu hỏi bảo mật.

### Ngoài phạm vi

- Email/SMS reset, SSO/MFA, production secret delivery hoặc hosting policy.
- Catalog staging/publish, paging, backup/restore và production rollout.
- Delegated global identity/credential administration cho `REGION_MANAGER`.

### Acceptance P02 tối thiểu

- Backend resolve store → region từ database; không tin region do client gửi.
- Test cho ID hợp lệ nhưng sai region/store phải deny ở backend.
- Thay đổi role/assignment/membership/reset có hiệu lực ở request kế tiếp và audit.
- Clean migration, backend integration, generated-client drift, frontend tests và
  browser flow của slice phải pass trước nghiệm thu.

## Các mốc đã đóng

- Pilot-00, Foundation-01, Foundation-02 và S01–S03: xem evidence/cycle tương ứng.
- S04: [online-stability-s04](delivery/online-stability-s04/plan.json), owner
  chấp nhận có điều kiện ngày 2026-09-17; real-backend E2E vẫn hoãn.
- P01: [p01-provisioning-policy](delivery/p01-provisioning-policy/plan.json),
  owner chấp nhận hierarchy và security policy ngày 2026-09-17.

## Sau P02

Sau provisioning, thứ tự đề xuất còn lại:

1. C01 catalog staging/validation → C02 publish sau khi chốt primary supplier.
2. D01 paging theo số đo; O01 backup/restore; O02 profile triển khai; A01 nghiệm
   thu online trên thiết bị mục tiêu.

Chi tiết dependency/finding nằm tại
[REVIEW_AND_ROADMAP_2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
