# ADMIN03 — backend evidence

Ngày 09/11/2026, revision 1; source `a768bd75f0821fb14e8383a3565c2cbfd1269dc7`.
Nhánh `store-app/admin03-store-membership`, sole writer Codex /root;
worktree `/Users/vup/Documents/coopfood-kph/.local/worktrees/admin03-store-membership`.
Tiếp tục checkpoint `cf13735`, không mở cycle mới. Inventory local đã kiểm;
không fetch hoặc xác nhận remote freshness. Backend source không đổi từ lúc
chạy verify tới source commit; thay đổi sau verify chỉ là docs.

## Kết quả

```sh
env JAVA_HOME=/Users/vup/Library/Java/JavaVirtualMachines/temurin-21.0.11/Contents/Home \
  DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  ./backend/mvnw -q -f backend/pom.xml verify
```

PASS, exit 0; 15 suites, **80 tests, 0 failures, 0 errors, 0 skipped**.
JDK 21.0.11, Maven Wrapper của repo, PostgreSQL Testcontainers 17-alpine
(log runtime 17.10). Không dùng DB vận hành/seed thật. Tổng hợp từ Surefire XML:

| Suite | Tests | Failures | Errors | Skipped |
| --- | ---: | ---: | ---: | ---: |
| ArchitectureTest | 1 | 0 | 0 | 0 |
| CatalogCsvParserTest | 3 | 0 | 0 | 0 |
| CatalogImportHttpIntegrationTest | 3 | 0 | 0 | 0 |
| CatalogLookupHttpIntegrationTest | 5 | 0 | 0 | 0 |
| DatabaseSmokeTest | 7 | 0 | 0 | 0 |
| IdentityAdminHttpIntegrationTest | 5 | 0 | 0 | 0 |
| IdentityHttpIntegrationTest | 2 | 0 | 0 | 0 |
| IdentitySecurityHttpTest | 8 | 0 | 0 | 0 |
| IdentityServiceTest | 6 | 0 | 0 | 0 |
| MembershipAdminHttpIntegrationTest | 15 | 0 | 0 | 0 |
| PasswordPolicyTest | 2 | 0 | 0 | 0 |
| KphHttpIntegrationTest | 8 | 0 | 0 | 0 |
| LocalPrivateMediaStorageTest | 5 | 0 | 0 | 0 |
| LifecycleHttpIntegrationTest | 6 | 0 | 0 | 0 |
| KphStoreAccessPolicyTest | 4 | 0 | 0 | 0 |

Lượt verify đầy đủ bao gồm 15 test membership cuối cùng và hồi quy identity,
credential, lifecycle, KPH/media, catalog, clean migrations và architecture.
Trước đó chạy targeted đã phát hiện route mới bị cấu hình default-deny chặn;
đã thêm đúng method/path vào authenticated matchers, giữ CSRF và scope enforcement
ở service. Lượt targeted tiếp theo đạt 12/12; lượt đầy đủ cuối cùng đạt 15/15.
Không bỏ test hoặc nới quyền để vượt gate.

## Chứng minh membership

- Chain list mọi active store; region chỉ đúng active assignment. Store inactive,
  region inactive, ID không tồn tại hoặc valid ID sai region không trả membership.
  Employee/store-manager/catalog-only bị từ chối; directory users giữ chain-only.
- Exact username lookup được phép cho user chưa thuộc vùng; canonicalize sau
  kiểm ASCII, không prefix search; inactive/missing cùng 404; chỉ 3 field trả về.
- Create, no-op không audit thêm, đổi role, revoke, reactivate; unique user/store;
  revoke lại 409. Account inactive và membership revoked là hai trạng thái riêng.
- Role/username/reason sai, unknown property và thiếu CSRF bị từ chối không mutation.
  Strict JSON scalar giới hạn tại DTO mới, không thay global mapper. Reason 500
  Unicode code point được nhận, 501 bị từ chối; không ép number/bool thành string.
- Audit đúng actor/user/store/region, lý do trim và trước/sau; không chép username,
  displayName, credential/session hoặc cả request body vào metadata.
- Hai phiên HTTP cùng backend: target login trước khi grant, KPH 403 → 200 sau
  grant → 403 sau revoke, không login lại. Store khác vẫn 403. Quyền kế thừa
  region/chain vẫn cho KPH sau khi membership trực tiếp bị revoke.
- Actor đổi credential version/deactivate hoặc region assignment bị revoke mất
  quyền ở request tiếp theo.
- Last-manager revoke/downgrade bị 409 và không audit. Test giữ store row bằng
  JDBC transaction, khởi chạy hai HTTP request rồi xác nhận cả hai đang chờ khóa
  store trong pg_stat_activity trước khi nhả. Hai revoke, hai downgrade, và
  revoke vs user-deactivation đều trả đúng một 200 + một 409, còn một manager,
  chỉ một audit. Lifecycle execute vs revoke cũng chồng lấn qua cùng store lock,
  hoàn tất không deadlock/500; audit/state tương ứng outcome.

## Protocol khóa và phạm vi code

Membership kiểm scope → target-user NO KEY UPDATE → store FOR UPDATE → recheck
actor/scope → manager count bằng statement mới → mutation + audit một transaction.
User deactivation giữ chain-admin locks theo UUID trước target/store locks; các
store theo UUID. Target lock ổn định tập store được grant/revoke cho user đó.
Manager-count reader trong Identity/Lifecycle không khóa thêm các user khác,
tránh store → user đảo ngược. NO KEY UPDATE tương thích FK KEY SHARE cho audit.

Files mới: MembershipAdminController/Service/Repository, MembershipRequests và
ba response record, MembershipAdminHttpIntegrationTest. Các file hiện có sửa:
SecurityConfiguration, IdentityAdminService/Repository, LifecycleRepository.
OpenAPI đánh dấu backend implemented; generated schema không có thay đổi shape.
Không migration, dependency mới, frontend hoặc runtime preview process.

## Kiểm tra contract/client

- `npm run check:docs`: PASS.
- `npm run check:contracts`: PASS — 29 manifest resources, 21 API fixtures.
- `npm run generate:api`: PASS, generated schema không đổi.
- `npm --workspace @coopfood-kph/api run check`: PASS.
- `npm --workspace @coopfood-kph/api test`: PASS — 4 tests.
- `git diff --check`: PASS.

Contract shape/fixture/client từ `664e2f0` giữ nguyên; chỉ đổi implementation
status trong OpenAPI. Các lệnh trên được chạy lại trong lượt backend, nên không
chỉ dùng evidence của checkpoint contract-first.

## Giới hạn và bước tiếp theo

Đây là backend/HTTP PASS. Chưa có workspace Quyền cửa hàng, chưa chạy Playwright
membership và chưa có owner acceptance; gate two-session-browser vẫn pending.
Không kiểm thiết bị thật, không merge/push/deploy hoặc đổi preview4175.
Bước nhỏ tiếp: nối workspace Admin Fresh vào 5 API, rồi kiểm browser hai phiên
390×844 và 1440×1024. Các mutation provisioning tương lai phải tuân thủ store-lock
protocol; activate/reactivate/move cần kiểm concurrency riêng khi được mở scope.
