# ADR 0007 — Effective scope cho tra barcode

Status: Accepted — owner xác nhận31/10/2026 trong BE04.

## Bối cảnh

BE04 phát hiện OpenAPI lookup ghi membership-only, nhưng CatalogService thực tế
đã gọi KphStoreAccessPolicy.requireViewCreate và HTTP test chấp nhận CHAIN_ADMIN
không membership. BE02/handoff tiếp tục mô tả ranh giới membership-only nên không
thể tự suy quyền từ tài liệu hoặc implementation. Đã hỏi owner trước khi chốt.

## Quyết định

Owner chọn: “Theo backend: quyền KPH vùng/chuỗi được tra”. Tra barcode published/
current dùng active membership đúng store, active assignment vùng đang chứa store,
hoặc CHAIN_ADMIN, trong active store/active region. Không cần membership giả.
Scope được kiểm lại ở request thực thi, revoke có hiệu lực request kế tiếp.

Đồng bộ OpenAPI/examples/generated client/tài liệu và bổ sung HTTP allow/deny.
Không đổi schema response hoặc implementation quyền đang chạy. Không cấp quyền
staging/publish cho manager/CHAIN_ADMIN; quyền đó vẫn thuộc CATALOG_ADMIN theo
contract riêng. Không mở quyền DATE/report/admin từ việc được tra barcode.

## Trade-off và xem xét lại

Quản lý dùng được cùng luồng tra hàng trong phạm vi KPH; contract không còn mâu
thuẫn với behavior đã có. Read access của quản lý vùng/chuỗi rộng hơn câu chữ
OpenAPI cũ, nên phải giữ deny cross-store/region/inactive và test sau thu hồi.
Xem xét lại khi có yêu cầu tách catalog read permission khỏi KPH; cần contract
và migration quyền explicit, không dựa UI visibility hoặc role giả.
