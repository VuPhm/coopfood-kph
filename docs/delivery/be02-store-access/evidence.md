# BE02 — technical evidence revision 1

Ngày 31/10/2026. Source checkpoint được ghi ở `plan.json.candidateSha`.
Không sửa source sau khi chạy kiểm tra; các cập nhật SHA/evidence sau checkpoint
chỉ nằm trong thư mục hồ sơ BE02. Root review một vòng, không blocker còn mở.
Remote heads/CI chưa kiểm; mọi kết quả dưới đây là local.

## Runtime và commands

Java21.0.12, Maven wrapper, OrbStack Docker, PostgreSQL17-alpine disposable qua
Testcontainers/ServiceConnection; HTTP Spring Boot thật, seed tổng hợp.
OrbStack được khởi động trong lượt này; hạn chế Docker của BE01 đã được giải quyết.

```sh
cd backend
./mvnw -B verify
```

Kết quả cuối: exit0,74tests, không failures/errors/skipped. Full run bao gồm
clean Flyway V1–V9, KPH/private media, identity/security, lifecycle, catalog,
architecture và 9test discovery mới. Tóm tắt stdout được lọc chỉ giữ kết quả:

```text
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.042 s -- in vn.coopfood.kph.identity.IdentitySecurityHttpTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.409 s -- in vn.coopfood.kph.identity.IdentityServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.009 s -- in vn.coopfood.kph.identity.PasswordPolicyTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 14.49 s -- in vn.coopfood.kph.identity.IdentityHttpIntegrationTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 22.72 s -- in vn.coopfood.kph.identity.IdentityAdminHttpIntegrationTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.020 s -- in vn.coopfood.kph.catalog.CatalogCsvParserTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 11.73 s -- in vn.coopfood.kph.catalog.CatalogImportHttpIntegrationTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 11.86 s -- in vn.coopfood.kph.catalog.CatalogLookupHttpIntegrationTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 19.71 s -- in vn.coopfood.kph.lifecycle.LifecycleHttpIntegrationTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 6.589 s -- in vn.coopfood.kph.foundation.DatabaseSmokeTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.756 s -- in vn.coopfood.kph.kph.LocalPrivateMediaStorageTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 17.35 s -- in vn.coopfood.kph.kph.KphHttpIntegrationTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.007 s -- in vn.coopfood.kph.store.KphStoreAccessPolicyTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 7.823 s -- in vn.coopfood.kph.store.StoreAccessHttpIntegrationTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.457 s -- in vn.coopfood.kph.architecture.ArchitectureTest
[INFO] Tests run: 74, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Lượt đầu full verify có65test cũ pass và9test mới lỗi ở seed region code36ký tự,
vượt giới hạn32. Đã sửa code tổng hợp về32ký tự, giữ nguyên constraint; kết quả
trên là full rerun sau sửa, không bỏ/skip test.

Từ repository root:

```sh
npm ci --ignore-scripts --cache /tmp/coopfood-be02-npm-cache
npm run check:docs
npm run check:contracts
npm run generate:api
npm run check
npm test
npm run build
git diff --check
```

Tất cả PASS ở lượt cuối. Cài deps theo lockfile trong worktree riêng, không đổi
package/lockfile. Lượt frontend đầu thiếu plugin-react vì worktree chưa có deps;
cài lại rồi chạy check/test/build từ đầu thành công.

- Contract Lock:24manifest resources,16API fixtures.
- Regeneration SHA256 trước/sau giống nhau; generated client không drift.
- TypeScript: toàn workspace PASS.
- Tests: Admin16 + Store294 + API2 + rules19 + UI16 =347 PASS.
- Build: Admin/Store PASS, PWA generateSW92precache entries.
- Docs/fixtures foundation và whitespace diff PASS.
- Cảnh báo sẵn có: schema formats password/int64, frontend chunk >500kB,
  deprecated Java APIs; không sửa config/tắt gate để bỏ cảnh báo.

## Review scope và giới hạn

Đọc diff của SQL scope, predicates dùng chung, controller/security matcher,
OpenAPI/example/schema generation và test allow/deny/revoke. Query parameterized;
không có mutation, migration hoặc private media exposure. Một store xuất hiện
một lần theo unique membership/EXISTS assignments; code được giữ string.

Không UI changes nên không chạy Playwright ở BE02. Chưa real-device, remote CI,
production scale hay online StoreApp acceptance. Discovery unpaginated, chỉ là
navigation hint; các mutation vẫn authorize độc lập. Chưa owner acceptance.

Raw logs ở `/tmp/coopfood-be02-*` là transient local; không commit raw application
logs hoặc dữ liệu vận hành. Handoff nêu kịch bản tái tạo API bằng fixture tổng hợp.
