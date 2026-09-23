# Công việc kế tiếp

Cập nhật: 2026-09-24

## D01 history paging — đã đóng revision 2

Owner chọn D01 ngày 23/09/2026 sau khi xác nhận “pass p04”. Backend, Store PWA
và E2E do GPT-6 Luna triển khai đã tích hợp trên baseline P04/P05 ở
`codex/d01-p04-integration`. Candidate code/browser `7fc9b8d`; technical PASS:
162 frontend/package tests, 65 backend tests và browser 8 PASS / 4 skip theo viewport.

Owner xác nhận “pass” ngày 24/09/2026 sau
[handoff](delivery/d01-history-paging/acceptance-handoff.md). Cycle CLOSED;
close checker PASS tại `8144b7c`. [Evidence revision 2](delivery/d01-history-paging/technical-evidence-r2.md)
giữ nguyên kết quả kỹ thuật; lượt đóng chỉ ghi quyết định, không sửa code.
P04 + D01 đã merge vào `main` qua
[PR #8](https://github.com/VuPhm/coopfood-kph/pull/8), commit `1a339f3`, ngày
24/09/2026. CI frontend, backend và browser đều PASS. Chưa deploy; không tự mở
cycle mới.

## P04 user deactivation — đã đóng

Owner chấp nhận revision 3 ngày 23/09/2026 bằng “pass p04”. Candidate
`e502886` đã pass 161 frontend/package tests, 64 backend tests và browser
real-backend 4 viewport. Close checker PASS; đã tích hợp vào `main` cùng D01
qua PR #8; chưa deploy.

## P05 credential self-service — đã đóng và tích hợp

Implementation candidate trên `codex/p05-credential-self-service` đã có contract,
migration V9, backend, Store PWA, Admin Web và test source cho đổi mật khẩu của
chính user. Hash mới dùng PBKDF2 có prefix, BCrypt cũ vẫn được xác minh và
`credential_version` làm mọi session cũ mất hiệu lực ở request kế tiếp.

Technical verification đã pass trên candidate `39c0cff` với evidence tại
[technical evidence](delivery/p05-credential-self-service/technical-evidence.md).
Owner đã xác nhận “pass” ngày 23/09/2026 và yêu cầu làm tiếp.
[Owner decision](delivery/p05-credential-self-service/acceptance-handoff.md) đóng
cycle P05. [PR #7](https://github.com/VuPhm/coopfood-kph/pull/7) đã merge vào
`main` tại `2d32ffd` ngày 23/09/2026; CI frontend/backend/browser PASS. Chưa deploy.

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

## P03 scheduled lifecycle — đã đóng

P03 trên `codex/p03-scheduled-lifecycle` đã được owner chấp nhận ngày 21/09/2026.
Backend,
OpenAPI, fixtures, generated client và Admin Web đã có create/reschedule/cancel/
manual execute cho store/region; lịch tối thiểu 30 ngày và recheck guard/scope.
Thực thi là thao tác thủ công khi đến hạn, không có tiến trình tự chạy.

Technical evidence, owner decision và close gate nằm tại
[P03 plan](delivery/p03-scheduled-lifecycle/plan.json).

## C01 catalog staging/validation — đã đóng

C01 được owner chấp nhận ngày 21/09/2026. Slice nhận UTF-8 CSV tổng hợp,
giữ identifier dạng string/leading zero, trả lỗi theo dòng và chặn duplicate
barcode. Chỉ `CATALOG_ADMIN` có quyền; upload cùng checksum idempotent. Batch
staging không được tạo published catalog hoặc xuất hiện trong lookup.

Contract accepted: [CATALOG_STAGING_CONTRACT](product/CATALOG_STAGING_CONTRACT.md).
Plan: [c01-catalog-staging](delivery/c01-catalog-staging/plan.json). C02 publish,
primary supplier và mọi dữ liệu vận hành thật vẫn ngoài scope.

## Điểm tích hợp hiện tại — PR #5 đã merge

PR #5 đã merge các cycle S04, P01, P02, P03 và C01 vào `main` ngày 21/09/2026,
với head `048a7ff` và merge commit `3ffc774`. Remote CI PASS cả frontend, backend
và browser. Provenance và evidence của từng cycle tiếp tục được giữ trong
`docs/delivery/**`.

P05 đã đóng và tích hợp. P04 đã được owner chấp nhận. D01 revision 2 đã đóng;
C02 vẫn bị chặn bởi primary supplier, O01/O02 tiếp tục hoãn.

## Policy lifecycle đã khóa

Owner đã yêu cầu deactivate store/region phải đặt lịch với ngày hiệu lực tùy
chọn nhưng cách thời điểm tạo lịch tối thiểu 30 ngày. Trước ngày hiệu lực entity
vẫn active; sau khi thực thi, authorization deny từ request kế tiếp. Không hard
delete; schedule/reschedule/cancel/execute đều phải audit và guard phải được kiểm
lại lúc thực thi.

Để giữ scope nhỏ, lịch 30 ngày trước mắt chỉ áp dụng cho store và region. Khóa
user, thu hồi global role/region assignment/store membership, reset credential
và invalid session có hiệu lực ngay ở request kế tiếp, kèm lý do, audit và guard
last-admin/last-manager. Không xây generic scheduler hoặc mở rộng thêm target khi
chưa có requirement vận hành cụ thể. P03 chỉ triển khai phần lịch deactivate
store/region; các lifecycle identity/credential khác chưa triển khai trong slice này.

## Sau khi P02 slice đầu được chấp nhận — provisioning API/Admin UI

P01 đã được owner duyệt ngày 17/09/2026 với hierarchy explicit:
`CHAIN_ADMIN` toàn chuỗi, `REGION_MANAGER` đúng vùng và `STORE_MANAGER` đúng
store. Schema/authorization slice đã đóng; P03 mở endpoint/Admin UI cho lịch
deactivate, các capability provisioning còn lại chờ cycle riêng.

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
  chấp nhận có điều kiện ngày 2026-09-17; giới hạn real-backend E2E của candidate
  đã được khép lại trong preflight PR #5 ngày 2026-09-21 (PASS 6, skip 4 theo
  viewport trên PostgreSQL 17/backend thật).
- P01: [p01-provisioning-policy](delivery/p01-provisioning-policy/plan.json),
  owner chấp nhận hierarchy và security policy ngày 2026-09-17.

## Ưu tiên chưa mở cycle

1. Chốt primary supplier và semantics lookup current trước khi mở C02 publish.
2. Chọn một outcome độc lập: lifecycle identity/credential, O01 backup/restore, O02 profile triển khai hoặc A01 nghiệm thu online trên
   thiết bị mục tiêu.

Chi tiết dependency/finding nằm tại
[REVIEW_AND_ROADMAP_2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
