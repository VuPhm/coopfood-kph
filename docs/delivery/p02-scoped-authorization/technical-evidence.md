# Technical evidence — P02 scoped authorization

Revision: 1  
Candidate: `17da6cac4bca735916dd210a70ea2812fb9d742c`  
Date: 2026-09-17

## Implemented outcome

- Flyway V6 thêm `regions`, `stores.region_id` và
  `user_region_assignments`; active store bắt buộc thuộc active region.
- Upgrade có store cũ tạo một region chuyển tiếp riêng cho từng
  store, không gom scope cũ thành một region rộng.
- `StoreAccessRepository` resolve active store → active region và ba scope
  membership/region/chain trực tiếp từ PostgreSQL theo actor ID; request
  không nhận region từ client.
- KPH create/list/photo cho phép member, region manager đúng vùng hoặc
  chain admin; review/export yêu cầu manager đúng store/vùng/chuỗi.
- Integration test bao phủ cross-region deny, region grant/revoke có hiệu
  lực request sau và chain-wide access không cần synthetic membership.

## Verification

| Command | Runtime | Result |
| --- | --- | --- |
| `npm run check:contracts` | Node 24 | PASS; 15 manifest resources, 7 API fixtures |
| `npm run verify` | Node 24 | PASS; docs, contracts, generated API drift, TypeScript, 147 frontend/package tests và production builds |
| `./mvnw -q -Dtest=StoreAccessServiceTest,IdentityServiceTest,IdentitySecurityHttpTest,ArchitectureTest test` | JDK 21 | PASS |
| `env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q test` | JDK 21, OrbStack, PostgreSQL 17.10 | PASS; 9 suites / 39 tests, 0 failure/error/skip; clean V1→V6 migration và HTTP integration included |
| `env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q -Dtest=DatabaseSmokeTest test` | JDK 21, OrbStack, PostgreSQL 17.10 | PASS after deterministic legacy-region backfill refinement |

`npm run verify` giữ warning chunk Store PWA trên 500 kB đã có trong
baseline; slice này không đổi frontend bundle.

## Review notes and limits

- Review round 1 không phát hiện blocker authorization/data integrity.
- OpenAPI không đổi: session/store list vẫn biểu diễn membership thật,
  không gán role giả cho inherited scope.
- UI selector cho region/chain manager, provisioning CRUD, privileged mutation
  audit/guards và credential/bootstrap là các slice sau, không phải blocker
  của outcome authorization backend này.
- Owner acceptance chưa có; technical PASS không được coi là nghiệm thu.
