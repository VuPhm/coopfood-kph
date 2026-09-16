# Provisioning policy

Trạng thái: **Proposed — P01 owner acceptance**  
Cập nhật: 2026-09-17

## Mục tiêu và ranh giới

Tài liệu này khóa policy tối thiểu cho P02 quản trị tài khoản, cửa hàng,
global role, store membership và credential. Đây là business/security contract,
chưa phải OpenAPI hay quyền triển khai feature.

- Backend tiếp tục là authority; Admin Web không tự suy diễn quyền từ UI.
- Không self-service signup, hard delete user/store/membership hoặc default admin.
- Không cấp quyền đọc/duyệt/xuất KPH xuyên cửa hàng cho global role.
- SSO/MFA, email/SMS reset, production secret delivery và audit retention được
  hoãn sang outcome riêng.

## Role matrix

Role có tính cộng dồn, nhưng mỗi capability vẫn kiểm đúng scope. Một
`CHAIN_ADMIN` muốn thao tác KPH tại cửa hàng vẫn cần active membership tương ứng.

| Capability | EMPLOYEE | STORE_MANAGER | CATALOG_ADMIN | CHAIN_ADMIN | Bootstrap operator |
| --- | --- | --- | --- | --- | --- |
| Xem/tạo KPH trong store membership | Có | Có | Không bypass | Không bypass | Không |
| Duyệt/xuất KPH trong store membership | Không | Có | Không bypass | Chỉ khi có `STORE_MANAGER` membership | Không |
| Đổi password của chính mình | Có | Có | Có | Có | Không |
| Đọc admin directory user/store/membership/audit | Không | Không | Không | Có | Không |
| Tạo/cập nhật/khóa user hoặc store | Không | Không | Không | Có | Chỉ bootstrap/recovery |
| Gán/thu hồi global role hoặc membership | Không | Không | Không | Có | Chỉ tạo/recover first admin |
| Reset credential người khác | Không | Không | Không | Có | Chỉ recovery khi không còn active admin |
| Staging/publish catalog | Không | Không | Có theo contract catalog tương lai | Không mặc định | Không |

`STORE_MANAGER` là quyền nghiệp vụ trong một store, không phải quản trị tài khoản.
`CATALOG_ADMIN` không được provision identity. `CHAIN_ADMIN` không tự có quyền
catalog và không bypass `StoreAccessService`.

## User lifecycle

- Username canonical là lowercase ASCII, 3–64 ký tự, pattern
  `[a-z0-9][a-z0-9._-]{2,63}`; trim trước validation và immutable sau create.
- Display name là Unicode đã trim, 1–120 ký tự và có thể sửa. Không đưa display
  name đầy đủ vào audit metadata khi target ID đã đủ.
- User không hard delete. `active=false` chặn login và làm session hiện có bị
  vô hiệu ở request kế tiếp; global roles/memberships được giữ để explicit
  reactivation khôi phục đúng assignment trước đó.
- User có thể tồn tại không membership/global role; đăng nhập chỉ được đổi
  credential/xem trạng thái tài khoản, không có quyền dữ liệu nghiệp vụ.
- Không được deactivate chính mình qua Admin capability hoặc remove
  `CHAIN_ADMIN` của chính mình. Thay đổi đó phải do một active `CHAIN_ADMIN` khác.
- Transaction phải chặn deactivate/revoke nếu kết quả làm hệ thống không còn
  active `CHAIN_ADMIN`.

## Store và membership lifecycle

- Store code là identifier string đã trim, 1–32 ký tự, giữ leading zero và
  immutable sau create. Store name là Unicode đã trim, 1–160 ký tự và có thể sửa.
- Store mới được tạo inactive. Chỉ activate khi có ít nhất một active user với
  active `STORE_MANAGER` membership trong store đó.
- Store không hard delete. Deactivate làm mọi membership của store mất hiệu lực
  ở request kế tiếp nhưng giữ assignment; reactivate khôi phục assignment cũ.
- Mỗi user/store có tối đa một membership, role `EMPLOYEE` hoặc `STORE_MANAGER`.
  Upsert có thể create/reactivate/đổi role; revoke đặt `active=false`.
- Không được revoke/downgrade/deactivate user cuối cùng đang là active
  `STORE_MANAGER` của một active store. Có thể chuẩn bị thay thế trong cùng một
  transaction rồi mới thu hồi manager cũ.

## Credential policy

Trong topology hiện tại password là single factor. P02 phải áp dụng các điều sau:

- Password mới có ít nhất 15 Unicode code point; UI/API phải cho phép ít nhất 64
  code point, space, paste và password manager. Không đặt composition rule và
  không bắt rotation định kỳ; force change khi reset hoặc có bằng chứng compromise.
- Kiểm toàn bộ password với blocklist common/compromised/context-specific và
  rate-limit login. Không trim, normalize hoặc silently truncate password.
- Existing BCrypt có giới hạn đầu vào 72 byte. P02 phải có quyết định encoder
  hỗ trợ full input và migration/verification hash cũ trước khi mở reset/create
  credential; không pre-hash tùy tiện để lách giới hạn.
- Create/reset nhận temporary password trong request bảo mật, không echo lại,
  không log và không ghi audit/hash/raw value vào metadata. UI có thể generate
  client-side nhưng delivery cho người dùng là quy trình ngoài P01.
- Credential mới/reset có state `RESET_REQUIRED`. Login chỉ tạo restricted
  session cho phép đọc session, change password và logout; store/catalog/admin
  APIs bị chặn cho đến khi đổi password thành công.
- Self change yêu cầu current password. `CHAIN_ADMIN` reset người khác nhưng
  không dùng admin reset cho chính mình.
- Reset/change tăng credential/session version; mọi session cũ bị invalid ở
  request kế tiếp. Reset không tự đăng nhập user.

Policy length/blocklist/no-periodic-rotation dựa trên
[NIST SP 800-63B rev. 4](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/).
Giới hạn BCrypt và ưu tiên password hash memory-hard dựa trên
[OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html);
session sau reset theo
[OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## Bootstrap và recovery

- Không có admin seed/default credential trong migration, repository, image hay
  environment mặc định. Bootstrap là command/runbook local không mở HTTP route.
- Bootstrap chỉ được chạy khi chưa từng có `CHAIN_ADMIN`; tạo một active admin
  `RESET_REQUIRED`, không store membership, và ghi audit `ADMIN_BOOTSTRAPPED`
  với actor null/source operator. Secret đọc từ TTY/stdin hoặc secret source,
  không qua command-line argument hay log.
- Nếu đã từng có admin nhưng không còn active admin, bootstrap phải từ chối.
  Recovery là command/runbook riêng, chỉ cho phép khi database xác nhận zero
  active `CHAIN_ADMIN`, ghi `ADMIN_RECOVERED` và làm mọi session cũ của target
  mất hiệu lực.
- Khi còn bất kỳ active `CHAIN_ADMIN`, recovery operator phải từ chối; quản trị
  thực hiện qua Admin capability và audit bình thường.

## Hiệu lực session và concurrency

- Principal tiếp tục refresh từ database mỗi request. User/store/membership/global
  role deactivate hoặc thay đổi role có hiệu lực ở request kế tiếp.
- Session principal phải mang credential/session version; mismatch sau reset/change
  làm session bị invalidate ở request kế tiếp.
- Guard last-admin và last-manager phải khóa/kiểm trong cùng transaction với
  mutation. Unique username/store code và membership user+store trả conflict rõ,
  không dùng last-write-wins để vượt guard.

## Audit tối thiểu

Mọi mutation ghi append-only `audit_events`: actor (hoặc null cho bootstrap),
action, target type/ID, optional store ID, thời điểm server và metadata tối thiểu.

Actions tối thiểu: `USER_CREATED`, `USER_UPDATED`, `USER_DEACTIVATED`,
`USER_REACTIVATED`, `GLOBAL_ROLE_GRANTED`, `GLOBAL_ROLE_REVOKED`,
`STORE_CREATED`, `STORE_UPDATED`, `STORE_DEACTIVATED`, `STORE_REACTIVATED`,
`MEMBERSHIP_UPSERTED`, `MEMBERSHIP_REVOKED`, `CREDENTIAL_RESET`,
`CREDENTIAL_CHANGED`, `ADMIN_BOOTSTRAPPED`, `ADMIN_RECOVERED`.

Metadata chỉ ghi field names, role/status trước-sau và source phù hợp; không ghi
password, hash, reset token, session, full PII hoặc request body.

## Quyết định còn hoãn

- Cách phát temporary password cho người dùng thật; email/SMS/self-service reset.
- MFA/SSO, re-authentication cho action nhạy cảm và production recovery custody.
- Encoder/parameters cụ thể sau benchmark P02 và ADR nếu đổi dependency nền.
- Audit retention/export và hai-person approval cho quản trị privileged account.

Các mục hoãn không cho phép P02 bỏ session revocation, audit hoặc guard last-admin.
