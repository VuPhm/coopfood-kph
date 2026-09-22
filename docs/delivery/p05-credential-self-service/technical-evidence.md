# P05 — Technical evidence

Ngày kiểm chứng: 2026-09-22, Asia/Ho_Chi_Minh  
Code candidate tested: `39c0cff23f0565a42166f0c41c06f3f7ff450612`  
Record checkpoint: `63aed66` (docs-only after the code candidate; no code,
contract or generated artifact changed)  
Branch: `codex/p05-credential-self-service`

## Technical gates

### Frontend/contracts

Command:

```bash
npm run verify
```

Result: PASS trên candidate. Contract Lock pass với 21 manifest resources và 13
API fixtures; generated API không drift; Admin Web/Store PWA/API/rules/UI
TypeScript check pass; 155 frontend/package tests pass (Admin 10, Store 119,
API 2, rules 19, UI 7); Admin Web và Store PWA production build pass.

Known non-blocking output: validator bỏ qua format `password`/`int64` đã có
trong contract hiện hành; Store PWA giữ warning chunk lớn hơn 500 kB.

### Backend

Command:

```bash
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  ./backend/mvnw -f backend/pom.xml -q clean test
```

Result: PASS trên PostgreSQL 17/Testcontainers qua OrbStack. 59 tests pass,
0 failure, 0 error, 0 skipped; Flyway clean/upgrade chạy tới V9.

P05-relevant coverage:

- `IdentityHttpIntegrationTest`: 2 pass — CSRF, wrong current password,
  BCrypt legacy login, PBKDF2-prefixed new hash, `credential_version`, audit
  không chứa secret và invalidation của hai session.
- `IdentitySecurityHttpTest`: 8 pass — security/session contract.
- `IdentityServiceTest`: 6 pass và `PasswordPolicyTest`: 2 pass — policy,
  reuse, Unicode code point và account-specific blocklist.
- `ArchitectureTest`: 1 pass — không còn cycle `foundation ↔ identity`.

### Browser preview readiness

Disposable Store PWA acceptance stack đã chạy trên PostgreSQL/backend thật;
Admin Web preview dùng backend/migration hiện tại và seed P03 tổng hợp cục bộ.

Đã kiểm tra bằng browser đến ngay trước mutation cuối ở cả hai entry point:

- Store PWA: action “Đổi mật khẩu”, ba label/autocomplete, helper 15–64
  Unicode, show/hide accessible, nút submit disabled khi form chưa đủ.
- Admin Web: login synthetic thành công, workspace tải được, action và dialog
  tương ứng với các field/accessibility như trên.

Không tự bấm submit đổi mật khẩu trong browser vì đó là thao tác thay đổi
credential cần owner thực hiện trực tiếp. Automated HTTP integration đã xác
nhận mutation end-to-end; owner acceptance vẫn pending.

## Findings fixed during verification

- Sửa kiểu trả về trong assertion jOOQ của integration test để test compile với
  API hiện tại.
- Cập nhật fixture policy: 15 emoji code point và blocklist đủ dài; không đổi
  policy runtime.
- Sửa selector test Admin để tính dấu `*` aria-hidden trong visible label.
- Tách `IdentityProblemException` khỏi `foundation.web` và map tại advice để
  giữ dependency direction, vượt ArchitectureTest.

## Limitations

- Tại thời điểm verification 22/09 chưa có owner acceptance. Owner đã xác nhận
  pass ngày 23/09; xem acceptance-handoff.md. Không có browser rerun trong closeout.
- Browser là Chromium in-app trên loopback; chưa phải thiết bị iPhone thật.
- Mockito/JDK dynamic-agent và chunk-size là warning hiện hữu, không làm fail
  gate.

## Closeout 23/09/2026 — tái sử dụng evidence

Checkpoint đóng vòng: `052017d670f4d584c8f2c769f9a252ef5e9b96c4`; revision 2 giữ nguyên scope.
So với code đã test `39c0cff`, checkpoint chỉ đổi tài liệu state/NEXT, contract
status, ADR status và hồ sơ delivery; không đổi runtime, test, OpenAPI, fixture,
generated client hoặc migration. Vì vậy tái sử dụng 155 frontend tests và 59
backend tests ngày 22/09; không trình bày chúng là test chạy lại hôm nay.

Closeout đã chạy `npm run check:docs` và `git diff --check`: PASS.
Owner sign-off ở acceptance-handoff.md áp dụng cho cùng implementation.
Remote main được kiểm tra ngày 23/09: `f308e0e`; chưa có PR P05 khi bắt đầu.
