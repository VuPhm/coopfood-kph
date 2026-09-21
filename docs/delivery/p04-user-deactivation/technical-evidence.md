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

