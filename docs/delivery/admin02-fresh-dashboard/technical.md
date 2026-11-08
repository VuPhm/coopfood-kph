# ADMIN02 — technical evidence, revision 1

Candidate: `3617ef79e660a7cf28368a7340a3f823c0a8bd3e`. Các lệnh dưới chạy trên đúng working tree của candidate trước commit; commit không thay file sau test. Node `v26.0.0`, macOS, Chromium headless qua Playwright hiện có. Backend P03 tổng hợp ở 8081/PostgreSQL 17, source từ worktree ADMIN01; không thay backend.

## Lệnh và kết quả

- `npm --workspace @coopfood-kph/admin-web run check`: PASS trong triển khai; TypeScript cũng chạy lại trong build cuối.
- `npm --workspace @coopfood-kph/admin-web test`: PASS cuối, 2 test files / 19 tests. Bao gồm logout/cache isolation, expired-session, đổi mật khẩu từ ba workspace, lifecycle create/cancel/date/reason, catalog upload/error focus và identity self/last-admin guard errors. Thêm overview mock filtering và navigation theo server scope/role.
- `npm --workspace @coopfood-kph/admin-web run build`: PASS, `tsc --noEmit` + Vite, 1714 modules; JS 423.85 kB / gzip 131.31 kB, CSS 54.02 kB / gzip 11.61 kB. Không thêm dependency.
- `node e2e/scripts/check-admin02-fresh.cjs`: PASS cuối. Output:

```text
PASS real backend chain 1440x1024: overview filters/detail, identity reason guard, lifecycle/read, reload, account, logout, no overflow/errors
PASS real backend chain 1280x1024: overview filters/detail, identity reason guard, lifecycle/read, reload, account, logout, no overflow/errors
PASS real backend chain 834x1112: overview filters/detail, identity reason guard, lifecycle/read, reload, account, logout, no overflow/errors
PASS real backend chain 390x844: overview filters/detail, identity reason guard, lifecycle/read, reload, account, logout, no overflow/errors
PASS real backend region scope and chain-only directory deny
PASS Catalog fixture 1440x1024
PASS Catalog fixture 1280x1024
PASS Catalog fixture 834x1112
PASS Catalog fixture 390x844
```

Script kiểm thêm back/forward/hash reload, keyboard skip link và account menu, aria-pressed selected batch, modal Escape, mobile drawer, icon rail accessible names. Dùng reduced-motion. Không thực thi mutation backend: identity submit reason rỗng bị validation; password dialog chỉ mở/đóng. Login/logout dùng backend thật; region GET admin/users trả 403 và chỉ một store target trong scope. Catalog fixture contexts intercept API riêng, không ghi DB. Browser không có pageerror hoặc page overflow; bảng có vùng cuộn ngang riêng.

- `npm run check:docs`: PASS; `git diff --check`: PASS.
- Đọc diff: chỉ `apps/admin-web/src/**`, script E2E mới và hồ sơ cycle ADMIN02. Không thay backend/OpenAPI/generated client/database/shared UI/dependencies/Store/deployment/Pages. ADMIN01 worktree không bị sửa.

## Visual review và sửa trong scope

Ảnh local (synthetic, không commit): `.local/verification/admin02-fresh/`, 17 ảnh kết quả cuối (overview/identity/lifecycle ×4, region ×1, Catalog ×4). Đã xem desktop overview/identity, mobile overview, Catalog desktop/1280 và đối chiếu bố cục.

Vòng đầu phát hiện overflow 390 do absolute sr-only table header thiếu containing block; sửa position relative trên scroll region. Cỡ chữ phụ tăng, Identity chuyển thành hàng compact, SVG tính viewBox theo chiều rộng container, mobile table có hint cuộn. Hai lượt visual review; không pixel snapshot diện rộng.

Trong quá trình viết test đã sửa locator text gồm mã cửa hàng và khởi tạo workspace theo hash; các lần fail setup/locator trước không được coi là evidence PASS. Suite cuối chạy đủ sau các sửa. Catalog route fixture kiểm riêng, không suy thành online backend acceptance.

## Giới hạn và trạng thái

Technical ready cho candidate UI. Owner acceptance: PENDING, không có sign-off. Không chạy lại full backend/Store suites vì không đổi phần đó; không chứng minh production, thiết bị thật, push notification hoặc realtime/analytics backend. Tổng quan hoàn toàn mock, snapshot cố định và không là scope authority. API workspace vẫn có auth/CSRF/authorization/error handling hiện có.

Preview http://127.0.0.1:4175/#overview, account/runbook tại [handoff](design-and-handoff.md). Không push/merge/deploy. Khi tiếp tục refinement dùng nhánh/worktree này và plan revision hiện hành; chỉ đổi revision nếu scope/observable gate thay đổi theo feedback.
