# P04 revision 3 — bản tích hợp P05

Ngày 23/09/2026 (Asia/Ho_Chi_Minh). Review round 2/2.
Code checkpoint: `b4a73fb1647a86e803a6ffd0e254ebc25e475ba5`.
Delivery checkpoint: `e502886e2466b748f976f3686e62e1f9afb62a3d` (chỉ state/NEXT).
Branch: `codex/p04-user-deactivation`; baseline main/P05 `2d32ffd`.

## Technical gates — PASS

- `npm run verify`: PASS tại `0a88bc4`, Contract Lock 22 resources / 14 API
  fixtures, generated-client không drift, TypeScript/build thành công; 161 tests
  (Admin 14, Store 119, API 2, rules 19, UI 7).
- `env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./backend/mvnw
  -f backend/pom.xml -q verify`: PASS, exit 0, chạy lại sau lần ngắt tại `edeb99e`.
  PostgreSQL 17/Testcontainers, 64 tests, 0 failure/error/skip, migrations tới V9.
  Log local: `.local/verification/p04-identity/backend-verify.log`.
- `npm --workspace @coopfood-kph/admin-web test`: PASS 14 tests sau chỉnh copy;
  `npm --workspace @coopfood-kph/admin-web run build` PASS trong preview harness.
- `node e2e/scripts/verify-p04-identity.cjs`: PASS, backend/DB thật, dữ liệu tổng
  hợp P03/P04, không mock API. Desktop 1440×1000, tablet 768×1024, mobile 375×812,
  landscape 667×375; không tràn ngang, focus vào lý do; nút xác nhận nằm đầy đủ
  trong viewport sau khi cuộn dialog. Chromium với reduced motion.
- `npm run check:docs`, `git diff --check`: PASS ở closeout.

## Coverage và thay đổi sau baseline

- Giải quyết conflict Admin navigation để giữ cả Tài khoản và Đổi mật khẩu;
  dùng chung một khai báo password dialog tại App, thêm action tại IdentityWorkspace.
- Giữ cả hai loại identity problem, credential version và P04 locking/audit;
  giữ fixtures và sinh lại API client. Không thêm schema migration ngoài V9 của P05.
- Component test xác nhận đổi mật khẩu từ lifecycle, catalog và identity.
- Backend test mới xác nhận đổi mật khẩu loại phiên admin cũ: POST bị chặn 403
  `CSRF_VALIDATION_FAILED`, GET trả 401; không có mutation/audit deactivation.
  Admin đăng nhập mới có thể khóa target, target mất session; audit đúng mỗi action.
- Browser chạy self non-action, lý do trống, last-manager 409, region directory
  403, khóa region user, reload vẫn inactive, session/login target đều bị từ chối.
- Nút xác nhận ở landscape có thể cần cuộn dialog; đã kiểm ratio=1 và ảnh trực quan.

Full frontend verification ở `0a88bc4` vẫn áp dụng cho backend/API/Store/packages
vì các commit sau chỉ thêm browser test, sửa kỳ vọng backend test và copy Admin.
Backend verify ở `edeb99e` vẫn áp dụng vì không đổi backend sau đó. Copy và tương
tác Admin cuối được kiểm lại bằng component test/build/browser tại `e7b0c1a` và
`b4a73fb`; `b4a73fb` chỉ đồng bộ expectation copy trong test. Delivery checkpoint
chỉ đổi tài liệu. Không dùng evidence revision 2 để thay gate revision 3.

## Preview và giới hạn

Preview đã được reset sau browser mutation bằng stop/start-p03-acceptance.sh;
chỉ database tổng hợp do task tạo bị bỏ/tạo lại. Runtime code `b4a73fb`, URL
http://localhost:4174, backend 8081 và PostgreSQL riêng 55433, tất cả bind loopback.
Seed ban đầu có đủ ba tài khoản active. Owner có thể thử từ trạng thái sạch.

Chưa có owner sign-off P04, remote CI cho revision 3 hoặc kiểm thử thiết bị thật;
không merge/deploy. Directory chưa phân trang, create/reactivate/reset/revoke
vẫn ngoài scope. Warning chunk lớn/PWA precache là baseline không bị ẩn.
Ảnh QA/log tổng hợp giữ local tại `.local/verification/p04-identity/`, không commit.

## Lịch sử revision 2 — không phải evidence cho candidate hiện tại

# P04 technical evidence

Ngày 21/09/2026 (Asia/Ho_Chi_Minh). Revision 2, review round 1/2.
Integrated candidate: `4f7c2cb166ade696f327c31188a2cee0c92f3483`.
Các commit sau candidate chỉ thay hồ sơ trong thư mục cycle này; không đổi code,
contract hoặc runtime đã kiểm tra.

Runtime: macOS ARM64, Node v26.0.0, OpenJDK 21.0.12, OrbStack Docker và
PostgreSQL `17-alpine`. Không tắt test, CSRF, authorization hoặc kiểm tra bảo mật.

## Kết quả kỹ thuật

Từ repository root:

```sh
npm run verify
```

Exit 0. Docs/fixtures hợp lệ; Contract Lock **21 resources / 13 API fixtures**;
generated OpenAPI client không drift; toàn bộ TypeScript checks và production
build đạt; **157 frontend/package tests pass** (Admin 11, Store 118, API 2,
rules 19, UI 7). Admin bundle 347.01 kB JS / 26.25 kB CSS. Store PWA vẫn có
cảnh báo chunk lớn/precache khoảng 2825.71 KiB từ baseline; cảnh báo không bị ẩn
và không phải bằng chứng performance thiết bị thật.

Từ `backend/`:

```sh
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q test
```

Exit 0. **57 tests**, không failure/error, chạy trên PostgreSQL 17 Testcontainers;
clean/upgrade migrations qua V8 và ArchUnit đều đạt. Riêng
`IdentityAdminHttpIntegrationTest` có 4 test bao phủ directory/deactivate/audit,
CHAIN_ADMIN-only, self/blank/unknown/CSRF, request-next session invalidation,
login bị từ chối, concurrent cross-deactivation luôn giữ một active CHAIN_ADMIN,
và last active STORE_MANAGER guard. Báo cáo tại
`backend/target/surefire-reports/`.

Các lượt chẩn đoán tuần tự riêng cũng đạt:

```sh
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  ./mvnw -q -Dtest=IdentityAdminHttpIntegrationTest test
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  ./mvnw -q -Dtest=ArchitectureTest test
```

Một lượt trước đó chạy hai Maven process đồng thời trong cùng `backend/target`
đã gây compile interference. Đây không phải lỗi candidate; các lượt tuần tự và
full suite cuối cùng đều exit 0.

## Preview và visual QA

Preview dùng lại harness P03 đã có nhưng build **current P04 code**, với database
PostgreSQL riêng, backend thật và dữ liệu tổng hợp:

```sh
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  bash e2e/scripts/start-p03-acceptance.sh
```

Exit 0; backend health `UP`, Admin production build phục vụ tại
`http://localhost:4174`. Runtime HEAD chỉ hơn candidate bằng commit record-only
`a20621f`; product tree đúng candidate. Seed P03 phù hợp cho P04 vì có current
CHAIN_ADMIN, một user có thể deactivate và một last STORE_MANAGER để kiểm guard.

Kiểm tra trực quan bằng browser automation trên UI thật:

- Directory có current-account non-action, trạng thái/role rõ và dialog xác nhận
  nêu ngay hiệu lực request kế tiếp, giữ role/assignment và cảnh báo không nhập
  secret/PII vào reason.
- Desktop/tablet, 375×812 và landscape 667×375 không có horizontal overflow;
  tại 667px, `documentElement.scrollWidth === innerWidth === 667`.
- Tất cả button nhìn thấy tại landscape cao 44px; dialog mobile xếp CTA thành
  một cột, không bị cắt/che và textarea focus được.
- Không có browser console error/warning trong luồng login → workspace tài khoản
  → mở/đóng dialog. Không submit deactivate thay owner; preview giữ nguyên state
  để nghiệm thu.

## Điều kết quả này không chứng minh

- Chưa phải owner acceptance, remote CI, merged/main, production deployment hoặc
  kiểm thử thiết bị vật lý.
- Directory chưa phân trang; create/update/reactivate, credential reset/change,
  role/assignment/membership revoke và bootstrap/recovery nằm ngoài P04.
- Deactivate thành công cố ý không có nút reactivate trong slice này. Chỉ dùng
  target tổng hợp; reset preview sẽ xóa database tổng hợp và tạo lại từ seed.
- Visual QA trên browser viewport không được coi là đo performance/accessibility
  đầy đủ trên thiết bị thật.
