# Provisioning policy

Trạng thái: **Accepted — P01 owner decision 2026-09-17; lifecycle addendum 2026-09-21**
Cập nhật: 2026-09-21

## Mục tiêu và ranh giới

Tài liệu này khóa policy tối thiểu cho P02 quản trị tài khoản, vùng, cửa hàng,
role/assignment/membership và credential. Đây là business/security contract,
chưa phải OpenAPI hay quyền triển khai feature.

- Backend tiếp tục là authority; Admin Web không tự suy diễn quyền từ UI.
- Không self-service signup, hard delete user/store/membership hoặc default admin.
- Quyền KPH kế thừa explicit theo hierarchy: toàn chuỗi, đúng vùng hoặc đúng
  store; client không được tự khai effective region/store.
- SSO/MFA, email/SMS reset, production secret delivery và audit retention được
  hoãn sang outcome riêng.

## Role matrix

Role có tính cộng dồn, nhưng mỗi capability vẫn kiểm đúng effective scope từ
database. `REGION_MANAGER` là region assignment; các role còn lại giữ topology
global role hoặc store membership hiện có.

| Capability | EMPLOYEE | STORE_MANAGER | REGION_MANAGER | CATALOG_ADMIN | CHAIN_ADMIN | Bootstrap operator |
| --- | --- | --- | --- | --- | --- | --- |
| Xem/tạo KPH | Đúng store | Đúng store | Mọi store đúng region | Không | Mọi store | Không |
| Duyệt/xuất KPH | Không | Đúng store | Mọi store đúng region | Không | Mọi store | Không |
| Đổi password của chính mình | Có | Có | Có | Có | Có | Không |
| Đọc admin directory/audit | Không | Không | Đúng region, tối thiểu cần thiết | Không | Toàn chuỗi | Không |
| Quản lý store profile/lifecycle | Không | Không | Đúng region | Không | Toàn chuỗi | Không |
| Gán/thu hồi store membership | Không | Không | Đúng region | Không | Toàn chuỗi | Không |
| Tạo/khóa user; quản lý global/region role | Không | Không | Không | Không | Có | Chỉ bootstrap/recovery |
| Reset credential người khác | Không | Không | Không | Không | Có | Chỉ recovery khi không còn active admin |
| Staging/publish catalog | Không | Không | Không | Có theo contract catalog tương lai | Không mặc định | Không |

`STORE_MANAGER` là quyền nghiệp vụ trong một store. `REGION_MANAGER` được đi
xuống các store của active region assignment nhưng không được cấp global role,
region assignment, tạo/khóa global user hay reset credential. `CHAIN_ADMIN` là
admin tổng và được đi xuống mọi store; quyền này là contract explicit, không tạo
synthetic membership. `CATALOG_ADMIN` không được provision identity và
`CHAIN_ADMIN` không tự có quyền catalog.

## User lifecycle

- Username canonical là lowercase ASCII, 3–64 ký tự, pattern
  `[a-z0-9][a-z0-9._-]{2,63}`; trim trước validation và immutable sau create.
- Display name là Unicode đã trim, 1–120 ký tự và có thể sửa. Không đưa display
  name đầy đủ vào audit metadata khi target ID đã đủ.
- User không hard delete. `active=false` chặn login và làm session hiện có bị
  vô hiệu ở request kế tiếp; global roles, region assignments và store
  memberships được giữ để explicit reactivation khôi phục đúng scope trước đó.
- User có thể tồn tại không role/assignment/membership; đăng nhập chỉ được đổi
  credential/xem trạng thái tài khoản, không có quyền dữ liệu nghiệp vụ.
- Không được deactivate chính mình qua Admin capability hoặc remove
  `CHAIN_ADMIN` của chính mình. Thay đổi đó phải do một active `CHAIN_ADMIN` khác.
- Transaction phải chặn deactivate/revoke nếu kết quả làm hệ thống không còn
  active `CHAIN_ADMIN`.

## Region, store và membership lifecycle

- Region code là identifier string đã trim, 1–32 ký tự, giữ leading zero và
  immutable; name là Unicode đã trim, 1–160 ký tự. Region không hard delete.
- Một active store thuộc đúng một active region. Chuyển store giữa region là
  mutation của `CHAIN_ADMIN`, audit đầy đủ và có hiệu lực ở request kế tiếp;
  không cho client gửi region ID để quyết định authorization.
- `REGION_MANAGER` là unique active assignment theo user+region. Một user có thể
  có nhiều region assignment; revoke một assignment không ảnh hưởng assignment
  khác. Chỉ `CHAIN_ADMIN` được grant/revoke assignment này.
- Store code là identifier string đã trim, 1–32 ký tự, giữ leading zero và
  immutable sau create. Store name là Unicode đã trim, 1–160 ký tự và có thể sửa.
- Store mới được tạo inactive. Chỉ activate khi region của store đang active và
  có ít nhất một active user với active `STORE_MANAGER` membership trong store.
- Store không hard delete. Deactivate làm mọi membership của store mất hiệu lực
  ở request kế tiếp nhưng giữ assignment; reactivate khôi phục assignment cũ.
- Mỗi user/store có tối đa một membership, role `EMPLOYEE` hoặc `STORE_MANAGER`.
  Upsert có thể create/reactivate/đổi role; revoke đặt `active=false`.
- `REGION_MANAGER` chỉ được update store profile/lifecycle và upsert/revoke store
  membership khi store hiện thuộc một active region mà actor có active assignment.
  Không được tạo/move region hoặc store, grant region/global role hay thao tác
  ngoài vùng; các create/move này thuộc `CHAIN_ADMIN`.
- Không được revoke/downgrade/deactivate user cuối cùng đang là active
  `STORE_MANAGER` của một active store. Có thể chuẩn bị thay thế trong cùng một
  transaction rồi mới thu hồi manager cũ.

### Đặt lịch thao tác lifecycle quan trọng

- Deactivate store hoặc region không có hiệu lực ngay. Người thao tác chọn ngày
  hiệu lực cách thời điểm server tiếp nhận ít nhất 30 ngày lịch; có thể chọn lâu
  hơn 30 ngày.
- Trước ngày hiệu lực, store/region vẫn active. Khi lịch được thực thi thành
  công, trạng thái mới có hiệu lực ở request kế tiếp và mọi inherited scope,
  kể cả `CHAIN_ADMIN`, bị deny theo policy authorization hiện hành.
- Tạo lịch, đổi lịch, hủy lịch và thực thi lịch đều phải audit. Guard active
  store → active region và last-manager phải được kiểm lại trong transaction tại
  thời điểm thực thi, không chỉ lúc tạo lịch.
- Mặc định tối thiểu, lịch 30 ngày chỉ áp dụng cho deactivate store và region.
  User deactivation, global-role revoke, region-assignment revoke,
  store-membership revoke, credential reset và session invalidation có hiệu lực
  ngay ở request kế tiếp để không kéo dài quyền truy cập khi có rủi ro bảo mật;
  vẫn phải có lý do, audit và guard last-admin/last-manager tương ứng.
- “Xóa” được hiểu là deactivate/revoke có thể phục hồi; policy không mở hard
  delete. Chỉ mở rộng lịch 30 ngày sang loại target khác khi có requirement vận
  hành cụ thể, không xây generic scheduler trước.

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

- Principal tiếp tục refresh từ database mỗi request. User/region/store,
  global role, region assignment hoặc store membership đổi trạng thái/scope có
  hiệu lực ở request kế tiếp.
- Session principal phải mang credential/session version; mismatch sau reset/change
  làm session bị invalidate ở request kế tiếp.
- Guard last-admin và last-manager phải khóa/kiểm trong cùng transaction với
  mutation. Unique username/store code và membership user+store trả conflict rõ,
  không dùng last-write-wins để vượt guard.
- Mọi authorization store-scoped resolve active store → active region ở server.
  Test phải có ID hợp lệ nhưng sai store/sai region để chứng minh deny; selector
  hoặc payload từ UI không phải security boundary.

## Audit tối thiểu

Mọi mutation ghi append-only `audit_events`: actor (hoặc null cho bootstrap),
action, target type/ID, optional region/store ID, thời điểm server và metadata
tối thiểu.

Actions tối thiểu: `USER_CREATED`, `USER_UPDATED`, `USER_DEACTIVATED`,
`USER_REACTIVATED`, `GLOBAL_ROLE_GRANTED`, `GLOBAL_ROLE_REVOKED`,
`REGION_CREATED`, `REGION_UPDATED`, `REGION_DEACTIVATED`, `REGION_REACTIVATED`,
`REGION_MANAGER_GRANTED`, `REGION_MANAGER_REVOKED`, `STORE_REGION_CHANGED`,
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
- Delegated global identity/credential administration cho `REGION_MANAGER`.

Các mục hoãn không cho phép P02 bỏ session revocation, audit hoặc guard last-admin.
