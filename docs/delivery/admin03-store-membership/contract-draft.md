# ADMIN03 — cấp và thu hồi quyền cửa hàng

Draft ngày09/11/2026, bắt đầu từ quyết định owner trong chat: quản lý vùng được tra cứu chính xác username, kể cả người chưa thuộc vùng. P01/ADR0004 tiếp tục quyết định authorization và guard. Không thay policy identity, credential, catalog hay KPH.

## API đề xuất cho slice

| Method/path | Request | Response |
| --- | --- | --- |
| GET `/api/v1/admin/membership-stores` | Không | Array `{id,code,name,regionId,regionCode,regionName}` các active store thuộc active region và scope actor |
| GET `/api/v1/admin/stores/{storeId}/memberships` | storeId | Array `{userId,username,displayName,userActive,role,active}`; chỉ membership đúng store được authorize |
| POST `/api/v1/admin/stores/{storeId}/membership-user-lookup` | `{username}` | `{id,username,displayName}` của một active user chính xác, hoặc404 |
| PUT `/api/v1/admin/stores/{storeId}/memberships/{userId}` | `{role,reason}` | Membership sau create/reactivate/đổi role |
| POST `/api/v1/admin/stores/{storeId}/memberships/{userId}/revoke` | `{reason}` | Membership với active=false |

Lookup dùng POST để không đưa username vào URL/access log; vẫn là thao tác đọc, yêu cầu CSRF theo cơ chế hiện hành. Trim/lowercase ASCII theo canonical username P01; pattern3–64 ký tự. Không hỗ trợ prefix, substring, suggestions hoặc trả nhiều kết quả. Authorize store trước lookup để không dùng API như directory khi không có store quản lý. Không trả roles/assignments, trạng thái hay thông tin ngoài username/displayName/id. Inactive và không tồn tại cùng404.

Actor chain hoặc active region assignment đúng region chứa store. Employee/store manager/catalog-only bị403. Store ID không thuộc scope bị403 mà không lộ membership/lookup. Directory GET `/admin/users` giữ nguyên chain-only. Không gửi actorId/regionId từ body làm authority. Store/region inactive từ chối mutation. Request reason trim1–500, role chỉEMPLOYEE/STORE_MANAGER; field validation422. Grant user inactive404. Revoke membership không có404; đã revoke409 thay vì audit lần hai. Upsert cùng trạng thái/role có thể trả200 không mutation/audit mới; audit chỉ ghi thay đổi thật. Không dùng DELETE.

Transaction lock/recheck active store, target user, scope và last-manager. Membership và user deactivation cùng cạnh tranh trên store lock để không để active store mất manager. Cần kiểm deadlock/order với IdentityAdminService hiện có, không chỉ kiểm luồng tuần tự. Không migration nếu schema unique(user_id,store_id) hiện tại đủ. Audit action MEMBERSHIP_UPSERTED/MEMBERSHIP_REVOKED, actor/target/store/region và reason/status/role trước-sau; không username/displayName/fullPII/password/session.

## UI Fresh và kiểm chứng

“Quyền cửa hàng” cùng nhóm Quản lý vận hành, không ghép vào directory chain-only. Danh sách store thuộc scope → bảng membership; dialog tìm username chính xác → chọn role/lý do → xác nhận. Không optimistic authority; thành công đọc lại backend. Thu hồi có lý do và mô tả ảnh hưởng truy cập ngay request kế tiếp; không yêu cầu login lại để thấy quyền hiệu lực. Backend lỗi last-manager hiển thị trong dialog, giữ dữ liệu để sửa. Bảng hiển thị active membership và trạng thái tài khoản riêng; không diễn giải account inactive thành đã revoke.

Tests bắt buộc trước demo:

- Region cấp người chưa thuộc vùng vào store đúng scope; lookup không trả role/assignment ngoài vùng. Prefix không tìm ra người.
- Chain tất cả store; region sai store/region hợp lệ403 cho cảlist/lookup/grant/revoke; employee/catalog403; CSRF.
- Create, reactivate, role change, reason invalid, inactive user, repeated revoke; audit đúng và không PII.
- Revoke/downgrade last-manager409; hai request cạnh tranh và cạnh tranh user-deactivation vẫn còn manager, không partial audit/state.
- Hai phiên Admin/Store backend thật: user chỉ có membership này được KPH saugrant, request kế tiếp deny saurevoke. Quyền chain/region kế thừa còn hiệu lực không bị thu hồi ngầm.
- Playwright1440×1024 và390×844 với thao tác bàn phím/dialog/error. Screenshot bổ sung1280/tablet khi ghép shell.

## Trạng thái thực tế

OpenAPI, 6 fixture API và generated client đã được bổ sung trong bước contract-first ngày 09/11/2026. Backend đã có implementation cho 5 operation, đánh dấu `x-implementation-status: implemented`; UI membership chưa triển khai. Bảng trên là wire contract dùng triển khai; backend test không phải nghiệm thu toàn luồng UI. ADMIN01 vẫn029b0e7, không bị sửa. ADMIN02 source preview4175 được ghi nhận ở checkpoint trước, lượt này không kiểm lại process và UI acceptance vẫn thuộc owner. Khi chuyển demo sang ADMIN03 cần ghi source rõ, giữ cùng canonical port4175 và dừng đúng process sở hữu; không mở thêm port ngầm.


## Wire contract đã cụ thể hóa

Nguồn wire hiện tại là `contracts/openapi/kph.openapi.yaml`, nhóm Admin membership.
Schema lookup cho phép input uppercase/whitespace rồi canonicalize; response
username luôn canonical. Reason wire dài 1–500 ký tự, có ít nhất một ký tự không
phải whitespace; trim trước lưu. Unknown property bị từ chối ở mọi request và
response. Store/region code giữ string và leading zero.

List memberships trả cả active/revoked, tách `userActive` khỏi `active`, xếp theo
username/userId. Scope kiểm trước target: store không tồn tại, inactive hoặc
ngoài scope đều 403. Lookup/grant user inactive hoặc không tồn tại cùng 404.
Revoke membership được giữ lại của user inactive vẫn được phép, nhưng không
revoke lại membership đã inactive (409). GET stores xếp regionCode/code/id;
actor có capability nhưng không còn store active nhận mảng rỗng.

Fixture tổng hợp được link từ operation và kiểm qua `npm run check:contracts`.
Guard schema/client không thay cho HTTP scope tests, audit/concurrency hoặc
Playwright; gate backend được ghi riêng, browser và owner vẫn pending trong plan.


## Khóa transaction trong backend

Membership mutation kiểm scope trước target, khóa target user bằng
`FOR NO KEY UPDATE`, rồi khóa store; recheck actor/store scope sau khi chờ khóa.
User deactivation giữ thứ tự khóa chain admins (UUID order), target user, rồi
các store đang quản lý (UUID order). Tập store của target ổn định do grant/revoke
cùng giữ target-user lock. Manager count được đọc bằng statement mới sau khi
đã giữ store lock, không khóa thêm user quản lý khác. Lifecycle execution cũng
đã giữ store lock trước manager count và không khóa ngược user rows.

`NO KEY UPDATE` vẫn tuần tự hóa thay đổi user nhưng tương thích với khóa
`KEY SHARE` của FK khi audit tham chiếu actor/target. Mọi mutation tương lai làm
đổi active-manager count phải giữ cùng store lock trước khi commit; thêm luồng
activate/reactivate/move cần kiểm lại protocol này. Không cần schema migration.
