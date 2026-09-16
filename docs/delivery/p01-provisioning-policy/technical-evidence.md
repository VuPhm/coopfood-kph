# Technical evidence — P01 provisioning policy

Ngày: 17/09/2026. Revision: 1. Candidate:
`88b12e457237b32518e067d86bd20831625ff545`.

## Phạm vi đã kiểm

- Policy phân tách global role khỏi store membership: `CHAIN_ADMIN` quản trị
  identity nhưng không bypass scope KPH; chỉ active `STORE_MANAGER` membership
  đúng store mới được duyệt/xuất.
- Lifecycle chỉ soft deactivate/revoke, có guard chống tự khóa, mất
  `CHAIN_ADMIN` cuối cùng và mất manager cuối của active store.
- Bootstrap chỉ dùng một lần khi chưa từng có admin; recovery là đường riêng chỉ
  khi không còn active admin. Không có default credential hay HTTP bootstrap.
- Credential reset tạo trạng thái `RESET_REQUIRED`, vô hiệu access cũ và không
  ghi credential material vào fixture/audit. Policy ghi rõ giới hạn BCrypt 72
  byte phải được xử lý bằng quyết định encoder/migration trong P02.
- 25 fixture synthetic khóa các ca allow/deny chính; Contract Lock kiểm ID duy
  nhất, outcome/reason bắt buộc, không chứa key nhạy cảm và các invariant quyền.

## Tự review security/contract

- Không phát hiện đường cấp quyền KPH ngầm cho global role.
- Không phát hiện hard delete hoặc seed/default admin.
- Không phát hiện credential, PII thật hoặc operational data trong fixture.
- P01 không sửa OpenAPI, generated client, schema hay runtime; mọi implementation
  vẫn cần contract/migration/test riêng trong P02.
- Password baseline đối chiếu NIST SP 800-63B rev. 4; storage/reset guardrail đối
  chiếu OWASP Password Storage và Forgot Password Cheat Sheets.

## Lệnh và kết quả

| Lệnh / gate | Kết quả |
| --- | --- |
| `node --check scripts/check-contracts.mjs` | PASS |
| `npm run check:contracts` | PASS, 15 manifest resources / 7 API fixtures |
| `npm run check:docs` | PASS |
| `npm run verify` | PASS docs, Contract Lock, generated API drift, TypeScript, 147 tests và build hai frontend |
| `git diff --check` trước candidate | PASS |

## Giới hạn

- Đây là policy/fixture proposal, chưa phải runnable Admin UI/API.
- Chưa chọn encoder/parameters, cơ chế delivery temporary credential, MFA/SSO,
  audit retention hoặc production recovery custody; các mục này được hoãn rõ.
- Build vẫn cảnh báo chunk Store PWA lớn sẵn có; P01 không sửa frontend bundle.
- Chưa có CI/remote run; bằng chứng là local candidate trên branch
  `codex/p01-provisioning-policy`.
