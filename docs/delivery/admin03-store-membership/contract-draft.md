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

Chưa đổi OpenAPI/client/backend/UI ở ADMIN03. Đây là draft để làm slice contract/examples trước implementation, không phải API đã tồn tại hoặc technical acceptance. ADMIN01 vẫn029b0e7, không bị sửa. ADMIN02 source preview4175 đang chạy riêng và UI acceptance vẫn thuộc owner. Khi chuyển demo sang ADMIN03 cần ghi source rõ, giữ cùng canonical port4175 và dừng đúng process sở hữu; không mở thêm port ngầm.
