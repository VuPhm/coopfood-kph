# KPHON01 evidence

09/11/2026, revision1. Candidate `751df44f207a8d6ff76068cbe2bcbdbce00d1cd4`; implementation `81744fe`.
Chỉ ADR/contract prose khác giữa hai SHA, không runtime/schema/test code changes.
Branch `store-app/kphon01-effective-context`; worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/kphon01-effective-context`.
Sole writer root; base ADMIN03 accepted/CLOSED b6bd19a. Không merge/push/deploy.

## Implementation

GET /api/v1/kph/stores trả effective active stores + capabilities từ hợp P01,
dedup, C-collation/code/id và no-store. SQL/access predicates dùng chung với KPH
mutation/query guard. Session/GET /stores không đổi, không synthetic role.
OpenAPI/example/manifest/generated client đồng bộ; catalog mô tả sửa theo policy
hiện hành, không sửa CatalogService hay thêm quyền catalog-admin.

Fresh online session/chọn store dùng StoreLogin/Frame/header/password dialog có
sẵn. Revalidate navigation/focus/visibility/reconnect/trước chọn; đang pending
hoặc lỗi che scope cũ. Revoke không tự đổi store; downgrade cập nhật quyền còn
lại. Logout/password change reset query, không giữ account cũ. Selection ticket
chặn callback cũ ghi selected store sau navigation. Không persist authority.
Route chưa nối hiển thị module chưa kết nối, không mock operational data;
capability summary KPH chỉ trên Home. Mock và legacy online entry còn cấu hình
riêng. Một password dialog, không duplicate từ account actions.

BE02/BE03 cũ reusable có chọn lọc, không merge lịch sử/contract/path/acceptance
cũ. [Assessment](assessment.md), [contract](../../product/STORE_KPH_CONTEXT_CONTRACT.md),
[ADR0007 proposed](../../adr/0007-kph-effective-store-context.md).

## Targeted backend

```sh
env JAVA_HOME=/Users/vup/Library/Java/JavaVirtualMachines/temurin-21.0.11/Contents/Home \
 DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
 ./backend/mvnw -q -f backend/pom.xml \
 -Dtest=KphStoreDiscoveryHttpIntegrationTest,KphStoreAccessPolicyTest,CatalogLookupHttpIntegrationTest,ArchitectureTest test
```

PASS19 tests. Sau khi bổ sung test lookup region đúng/sai vùng/revoke, chạy lại
`-Dtest=CatalogLookupHttpIntegrationTest test`: PASS6 tests. Final Surefire matrix
**20 unique tests, 0 failures/errors/skipped**, không gọi đây là full verify mới:

| Suite | Tests |
| --- | ---: |
| Discovery HTTP/PostgreSQL | 9 |
| KPH access policy | 4 |
| Catalog lookup HTTP/PostgreSQL | 6 |
| Architecture | 1 |

Discovery matrix: employee/manager, region không membership, chain không synthetic
membership, union/dedup/order/string codes, inactive/move region, revoke/downgrade
và scope còn lại; no-scope/catalog-only[], anonymous/credential/user invalid401.
Discovery và business guards deny store mất/sai scope. Catalog test mới dùng
active region assignment không membership: đúng store200, valid ID khác vùng403,
revoke403 rồi membership còn lại200 trong cùng phiên.

JDK21.0.11, PostgreSQL17 Testcontainers; fresh Flyway V1–V9, không migration mới.
`./backend/mvnw -q -f backend/pom.xml -DskipTests package`: PASS để chạy jar cùng
source main đã kiểm. Source main backend không đổi sau package; chỉ thêm test.

## Frontend/contracts/build

- `npm run check:contracts`: PASS30 resources,22 API fixtures. Negative cases
  cấm synthetic role/ADMIN capability/numeric code/duplicate capabilities.
- `npm run check:api`: PASS — generation không diff sau source checkpoint.
- API TypeScript và4 client tests: PASS.
- Store TypeScript và3 file session/legacy tests: PASS18 tests.
- Sau chỉnh trạng thái route, chạy lại2 file context/client: PASS9 tests;
  legacy online9 tests không bị ảnh hưởng vì source legacy không đổi.
  Tổng **22 unique frontend tests** (9 mới +9 legacy +4 API).
- Fresh online build/PWA: PASS với VITE_STORE_APP_MOCK=false và VITE_STORE_APP_ONLINE=true;
  mock Fresh build/PWA: PASS với VITE_STORE_APP_MOCK=true và outDir local riêng.
- `npm run check:docs`, `git diff --check`: PASS.

Lệnh frontend targeted:

```sh
npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=1 src/store-online-app.test.tsx src/store-session-api.test.ts src/app.online.test.tsx
npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=1 src/store-online-app.test.tsx src/store-session-api.test.ts
VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build
VITE_STORE_APP_MOCK=true npm exec --workspace @coopfood-kph/store-pwa -- vite build --outDir /Users/vup/Documents/coopfood-kph/.local/worktrees/kphon01-effective-context/.local/verification/fresh-mock-build
```

Vitest4.1.10/Vite8.2.1. Không rerun358 frontend/80 backend toàn baseline trong
slice này; không coi kiểm tổ hợp cuối đã chạy. Giữ yêu cầu owner kiểm tổ hợp rộng
sau cùng, không tắt hoặc bỏ guard/security checks liên quan.

## Playwright real backend

`node e2e/scripts/check-kphon01-context.cjs`: PASS trên source cuối,0 mock routes.
Chromium headless390×844/1440×1024, vi-VN/Asia_Ho_Chi_Minh/reduced motion.

```text
PASS mobile 390×844: grant/upgrade/downgrade/revoke, expiry, inherited scope, store switch, offline/retry, no mock, single password dialog
PASS desktop 1440×1024: grant/upgrade/downgrade/revoke, expiry, inherited scope, store switch, offline/retry, no mock, single password dialog
PASS catalog-only/no KPH scope returns empty stores
```

Admin API cấp/nâng/hạ/thu hồi employee trong DB thử hiện có; Fresh cập nhật đúng
trong cùng phiên sau focus refresh, mất store về selector không chọn store khác;
business KPH403 sau revoke. Logout session từ server rồi refresh về login. Region
session.stores[] nhưng discovery cho đúng store/quyền; chain chọn được cả2store,
đổi store không còn code cũ. Offline che context, retry khi offline giữ lỗi,
reconnect về selector; reload không persist lựa chọn. Catalog-only empty state.
DATE route hiện rõ chưa nối, không create/mock dataset. Một password dialog.
No pageerror và no horizontal overflow ở cả2viewport; một main/screen.

Artifacts local `.local/verification/kphon01-context/results.json`,
mobile/desktop-region.png và mobile/desktop-password.png. Đã xem screenshot
mobile/desktop; trạng thái chưa kết nối tách khỏi capability KPH Home.
Lượt chỉnh presentation có lỗi JSX đã sửa; unit/build/browser cuối đều PASS.
Một retry test được chỉnh cho cơ chế auto reconnect đã có, không nới assertion
privacy/scope hoặc mock network API để vượt test.

## Runtime/giới hạn

Fresh4173 trỏ đúng worktree này, backend8082 nâng bằng jar KPHON01 và dùng cùng
DB55434/media thử ADMIN03, không reseed/mất dữ liệu. Admin4175 giữ source/port,
proxy8082 nên chạy cùng backend. Jobs admin03.backend/store đã dừng sau khi kiểm
đúng arguments; thay bằng kphon01.backend/store. P03 cũ8081/55433 giữ nguyên.
Post-check: backend health200, Admin4175 HTTP200, module StoreOnlineApp4173 đúng
source; job arguments đã xác minh.

Đây là nền context, chưa wiring UI lookup/history/create/review/export. D01 giữ
page-local/reset. DATE/report/notification persistence, thiết bị thật và tổ hợp
cuối vẫn còn. Owner chỉ accepted ADMIN03; KPHON01/ADR0007 chưa tự gán accepted.
