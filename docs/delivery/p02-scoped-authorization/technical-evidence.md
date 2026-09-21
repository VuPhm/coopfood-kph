# Technical evidence — P02 scoped authorization

Revision: 2

Candidate: `f091016e3a0caae4e4e87198b2741c8c958a1f0f`

Verified implementation: `4fe070d417194a9d39a0316fda5ca093047539e8`

Date: 2026-09-21

## Implemented outcome

- Flyway V6 thêm `regions`, `stores.region_id` và
  `user_region_assignments`; generated conditional key và composite foreign key
  giữ invariant active store → active region dưới concurrent lifecycle updates.
- Upgrade có store cũ tạo một region chuyển tiếp riêng cho từng
  store, không gom scope cũ thành một region rộng.
- `StoreAccessResolver` chỉ resolve active store/region và actor scope từ
  PostgreSQL mỗi request; `KphStoreAccessPolicy` quyết định capability
  view/create và review/export; service/media chỉ nhận `StoreRef` hoặc scalar.
- KPH create/list/photo cho phép active member, region manager đúng vùng hoặc
  chain admin; review/export yêu cầu manager đúng store/vùng/chuỗi.
- Integration test bao phủ inactive store/region, cross-region deny, region
  grant/revoke có hiệu lực request sau và chain-wide access không cần synthetic
  membership. Database test bao phủ activate/deactivate ở cả hai chiều.

## Verification

| Command | Runtime | Result |
| --- | --- | --- |
| `env JAVA_TOOL_OPTIONS=-Djava.awt.headless=true ./mvnw -q -Dtest=KphStoreAccessPolicyTest,IdentityServiceTest,IdentitySecurityHttpTest,LocalPrivateMediaStorageTest,ArchitectureTest test` | JDK 21 | PASS |
| `env JAVA_TOOL_OPTIONS=-Djava.awt.headless=true DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q -Dtest=DatabaseSmokeTest,KphHttpIntegrationTest,CatalogLookupHttpIntegrationTest,IdentityHttpIntegrationTest test` | JDK 21, OrbStack, PostgreSQL 17.10 | PASS; targeted migration and HTTP integration |
| `env JAVA_TOOL_OPTIONS=-Djava.awt.headless=true DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q clean test` | JDK 21, OrbStack, PostgreSQL 17.10 | PASS; 9 suites / 41 tests, 0 failure/error/skip; clean and upgrade V1→V6 included |
| `npm run verify` | Node 24 | PASS; docs, contracts, generated API drift, TypeScript, frontend/package tests and production builds |
| `node --test tooling/skills/delivery-cycle/scripts/cycle.test.mjs` | Node 24 | PASS; 9/9 delivery-cycle tests |
| `git diff --check` and `python3 -m json.tool docs/delivery/p02-scoped-authorization/plan.json` | Git / Python 3 | PASS |
| `npm run check:docs && npm run check:contracts` | Node 24 | PASS on the docs-only lifecycle addendum; 15 manifest resources, 7 API fixtures |

`npm run verify` giữ warning chunk Store PWA trên 500 kB đã có trong
baseline; slice này không đổi frontend bundle.

## Review notes and limits

- Review round 3 không còn blocker trong scope sau khi sửa ba finding round 2:
  policy layering, inactive inherited-scope coverage và race của V6 trigger.
- OpenAPI không đổi: session/store list vẫn biểu diễn membership thật,
  không gán role giả cho inherited scope.
- UI selector cho region/chain manager, provisioning CRUD, privileged mutation
  audit/guards và credential/bootstrap là các slice sau, không phải blocker
  của outcome authorization backend này.
- Owner đã acceptance riêng ngày 2026-09-21; technical PASS tự nó không được coi
  là nghiệm thu.
- Backend/full-workspace evidence was produced at implementation commit `4fe070d`.
  Candidate `f091016` only adds accepted policy/current-state documentation, so
  that evidence is carried forward; docs and Contract Lock were rerun on the
  exact content committed as `f091016`.
