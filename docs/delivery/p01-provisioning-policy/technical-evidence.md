# Technical evidence — P01 provisioning policy

Ngày: 17/09/2026. Revision: 2. Candidate:
`bc86d4c81c43102028c4f519d101de02aa3f580c`.

## Phạm vi đã kiểm

- Authorization hierarchy explicit: `CHAIN_ADMIN` toàn chuỗi,
  `REGION_MANAGER` theo active user-region assignment và `STORE_MANAGER` theo
  active user-store membership.
- Backend contract phải resolve store → region từ database; region do client gửi
  không phải authority. Quyền hợp lệ được kế thừa xuống store, ngoài vùng/store
  bị deny dù target ID có tồn tại.
- `REGION_MANAGER` được thao tác KPH và quản lý store profile/membership trong
  vùng; không được cấp global/region role, tạo/khóa global user hoặc reset
  credential. `CHAIN_ADMIN` giữ các capability toàn chuỗi này.
- Lifecycle chỉ soft deactivate/revoke; guard chống self-lockout, mất
  `CHAIN_ADMIN` cuối và mất manager cuối của active store vẫn được giữ.
- Bootstrap/recovery, password policy và session invalidation giữ security
  baseline revision 1. Không có default credential hay HTTP bootstrap.
- 36 fixture synthetic khóa allow/deny hierarchy, cross-region/cross-store,
  lifecycle, credential và bootstrap; Contract Lock kiểm invariant quan trọng.

## Tự review security/contract

- Product contract, UI DNA, behavior inventory, AGENTS và ADR-0004 đã đồng bộ;
  không còn current contract nói `CHAIN_ADMIN` không được đi xuống store.
- Region manager ngoài vùng, store manager ngoài store, regional grant global
  role/reset credential và store activation với inactive region đều có deny case.
- Không phát hiện hard delete, seed/default admin, credential/PII thật hoặc dữ
  liệu vận hành trong fixture.
- P01 không sửa OpenAPI, generated client, schema hay runtime; P02 vẫn cần
  migration/API/backend/Admin tests và không được coi policy là implementation.
- Password baseline tiếp tục đối chiếu NIST SP 800-63B rev. 4; storage/reset
  guardrail đối chiếu OWASP Password Storage và Forgot Password Cheat Sheets.

## Lệnh và kết quả

| Lệnh / gate | Kết quả |
| --- | --- |
| `npm run check:contracts` | PASS, 15 manifest resources / 7 API fixtures / 36 P01 cases |
| `npm run check:docs` | PASS |
| `npm run verify` | PASS docs, Contract Lock, generated API drift, TypeScript, 147 tests và build hai frontend |
| `git diff --check` trước candidate | PASS |

## Giới hạn

- Đây là policy/fixture/ADR đã duyệt, chưa phải runnable Admin UI/API.
- Chưa chọn encoder/parameters, cơ chế delivery temporary credential, MFA/SSO,
  audit retention hoặc production recovery custody; các mục này được hoãn rõ.
- Delegated global identity/credential administration cho `REGION_MANAGER`
  không nằm trong P01; hiện chỉ `CHAIN_ADMIN` có quyền đó.
- Build vẫn cảnh báo chunk Store PWA lớn sẵn có. Chưa có CI/remote run; bằng
  chứng là local candidate trên branch `codex/p01-provisioning-policy`.
