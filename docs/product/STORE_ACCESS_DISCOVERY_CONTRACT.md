# Effective store access discovery — BE02

Trạng thái: implementation candidate, owner acceptance pending (31/10/2026).
Quyền nghiệp vụ kế thừa P01/ADR-0004; đây là API discovery mới, không mở quyền mới.

## API

`GET /api/v1/me/store-access` yêu cầu session hợp lệ; anonymous/phiên bị
vô hiệu nhận 401. Response 200 là array đầy đủ, chưa phân trang; không scope
KPH trả `[]`. `Cache-Control: no-store`. Không nhận user/store/region từ client.
Mỗi item gồm `id`, `code`, `name`, `kph: {view, create, review, export}`.
Identifier là string giữ leading zero. Không trả role giả hoặc synthetic membership.

Danh sách chỉ chứa active store trong active region thuộc hợp scope hiệu lực:

| Scope | view/create | review/export |
| --- | --- | --- |
| Active EMPLOYEE membership đúng store | true | false |
| Active STORE_MANAGER membership đúng store | true | true |
| Active region assignment chứa store | true | true |
| CHAIN_ADMIN | true | true |
| CATALOG_ADMIN đơn độc hoặc không scope | Không có item | Không có item |

Một store xuất hiện đúng một lần dù nhiều scope trùng nhau. Sắp theo store code
với PostgreSQL C collation rồi UUID; không đổi code sang số. Danh sách không
suy quyền catalog, DATE, báo cáo hay admin. Endpoint lookup catalog hiện vẫn có
guard membership riêng; discovery KPH không hứa lookup cho scope kế thừa.

Mỗi request tính lại từ DB; revoke/downgrade/role/assignment/store chuyển vùng
và inactive có hiệu lực ở request kế tiếp. Session refresh hiện hành chặn user
inactive và credential version thay đổi. Capabilities là gợi ý hiển thị, không
phải token cấp quyền: mọi nghiệp vụ phải kiểm lại scope ở request thực thi.
Không giả định nhiều request nhìn cùng một snapshot khi quyền vừa thay đổi.

## Compatibility và giới hạn

Giữ nguyên session, `/api/v1/stores` và mọi consumer cũ. Không migration,
không đổi KPH create/history/review/export semantics. Không nối UI trong BE02.
Danh sách chưa phân trang phù hợp bước đầu; cần đo quy mô thực trước khi mở
pagination bằng contract rõ ràng, không silently truncate kết quả.

Nguồn máy đọc: [OpenAPI](../../contracts/openapi/kph.openapi.yaml),
[example tổng hợp](../../contracts/fixtures/api/store-access.json).
Test HTTP: `backend/src/test/java/vn/coopfood/kph/store/StoreAccessHttpIntegrationTest.java`.

## Acceptance

- Đủ matrix role/scope, scope hợp deduplicate và thứ tự/string identifier.
- Không lộ store ngoài scope hoặc inactive; revoke được phản ánh ngay.
- Discovery và KPH guard cùng deny store ngoài vùng/sau thu hồi/chuyển vùng.
- Session và store-list cũ không có synthetic membership.
- OpenAPI/example/generated client đồng bộ, full backend PostgreSQL verification.

Owner chưa nghiệm thu; technical evidence nằm trong BE02 handoff.
