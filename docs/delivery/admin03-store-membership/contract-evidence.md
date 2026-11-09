# ADMIN03 — contract-first evidence

Ngày 09/11/2026, revision 1. Source checkpoint `664e2f0fb0a02d382247be892ba104de46fe1340`.
Nhánh `store-app/admin03-store-membership`; worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/admin03-store-membership`.
Sole writer Codex /root. Local refs inspected; không fetch/claim remote freshness.

## Phạm vi đã làm

- OpenAPI: list scoped stores, list memberships, exact username lookup, upsert,
  revoke; strict request/response schemas, CSRF, lỗi và semantics scope/audit.
- 6 fixture tổng hợp, gồm tài khoản inactive và membership revoked độc lập;
  store/region code giữ leading zero. Fixture list có active manager.
- Client sinh lại; kiểm HTTP verb/path/body/cookie/CSRF và giữ problem 409.
- Contract validator chặn role ngoài EMPLOYEE/STORE_MANAGER, actor/store/region
  authority trong body, lookup response lộ quyền/credential, username sai,
  reason rỗng/blank/quá dài, UUID/code/state sai kiểu.
- CURRENT_STATE/NEXT trong worktree phản ánh ADMIN03; main chưa tích hợp.

## Lệnh và kết quả trên source checkpoint

| Lệnh | Kết quả |
| --- | --- |
| `npm run check:docs` | PASS — Docs/fixtures foundation hợp lệ |
| `npm run check:contracts` | PASS — 29 manifest resources, 21 API fixtures |
| `npm run check:api` | PASS — sinh lại không có diff schema |
| `npm --workspace @coopfood-kph/api run check` | PASS — TypeScript |
| `npm --workspace @coopfood-kph/api test` | PASS — 1 file, 4 tests |
| `git diff --check` | PASS |

Node/npm runtime hiện có; generator openapi-typescript 7.13.0, Vitest 4.1.10.
Validator còn warning có sẵn về format password/int64; UUID/date vẫn được kiểm.
Không dùng kết quả này để chứng minh backend, tenant isolation, audit hoặc UI.
Không sửa backend/UI/schema migration và không chạy backend/browser/full verify
cho bước contract-only này. API được đánh dấu `x-implementation-status: planned`.

## Rủi ro cần xử lý ở implementation

`IdentityAdminService.deactivate` đang khóa active chain admins → target user →
stores → manager rows/users. Membership mutation phải dùng protocol nhất quán
với luồng này. Chỉ thêm store lock và giữ việc khóa các manager user khác có
thể gây vòng chờ khi hai target khác nhau cùng bị đổi quyền/deactivate.
Lifecycle cũng khóa store/region rồi đọc manager với FOR SHARE. Cần thiết kế
thứ tự khóa dựa trên cả ba luồng, test concurrency có kiểm timeout, state và
số audit; không thể coi mô tả OpenAPI là bằng chứng concurrency đã đúng.

Backend tests bắt buộc: chain/region allow; valid ID cross-region deny; no-op,
reactivation, invalid reason/role, inactive target, repeated revoke; last-manager
races và user deactivation; hai phiên Store request kế tiếp grant/revoke; quyền
kế thừa vẫn có hiệu lực. UI sau đó kiểm Playwright 390×844, 1440×1024 và owner.
Không đóng cycle; các gate runtime và owner vẫn pending.
