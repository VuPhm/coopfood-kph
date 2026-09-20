# Acceptance handoff — P02 scoped authorization

Trạng thái: **AWAITING_ACCEPTANCE**

Candidate: `4fe070d417194a9d39a0316fda5ca093047539e8`

## Outcome cần xác nhận

- Active `STORE_MANAGER` đúng membership vẫn duyệt/xuất được.
- Active `REGION_MANAGER` được xem/tạo/duyệt/xuất KPH tại store
  thuộc active region assignment, nhưng bị deny với store có ID hợp lệ
  ở region khác.
- `CHAIN_ADMIN` được thao tác KPH tại mọi active store mà không
  cần synthetic store membership.
- Grant/revoke assignment hoặc global role có hiệu lực ở request kế
  tiếp; backend tự resolve store → region từ PostgreSQL.
- Store hoặc region inactive bị deny kể cả khi actor còn active region
  assignment hoặc `CHAIN_ADMIN`.

## Cách test sau

Slice này chưa có provisioning UI/API, nên acceptance tạm dùng fixture
tổng hợp trong integration test:

```sh
cd backend
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  ./mvnw -q -Dtest=KphHttpIntegrationTest,CatalogLookupHttpIntegrationTest test
```

Kết quả mong đợi: lệnh exit 0. Test KPH chứng minh employee bị deny
manager action, region manager đúng vùng được duyệt/xuất,
cross-region bị deny, revoke có hiệu lực ngay request sau và chain admin
tiếp tục có scope toàn chuỗi; inactive store/region luôn bị deny.

## Giới hạn cố ý

- `/api/v1/auth/session` và `/api/v1/stores` vẫn chỉ trả store membership
  thật; không giả inherited scope thành `STORE_MANAGER`. Store selector cho
  region/chain manager sẽ đi cùng OpenAPI/frontend slice sau.
- Chưa có CRUD provisioning, lifecycle mutation/audit, last-admin/last-manager
  guard hoặc credential/bootstrap implementation.
- Migration upgrade tạo một vùng chuyển tiếp riêng cho mỗi store cũ,
  giữ scope hẹp thay vì tự gom các store vào một vùng rộng.
