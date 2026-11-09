# KPH effective context — KPHON01

Implementation candidate09/11/2026; quyền nghiệp vụ theo P01/ADR-0004.
Đây là bước đầu KPH online, không tự nghiệm thu toàn luồng KPH.

`GET /api/v1/kph/stores` trả array đầy đủ `{id,code,name,capabilities}` theo
đề xuất hiện hành trong STORE_KPH_ONLINE_NEXT_SCOPE. Code giữ string/leading zero;
sắp code theo PostgreSQL C collation, rồi id. Active store trong active region,
hợp các scope và mỗi store một lần. No-store; không nhận actor/region từ client.
Session hợp lệ không scope nhận200[], hết/thu hồi phiên401. Giữ `/api/v1/stores`
và session.user.stores membership-only; không role hoặc membership giả.

- EMPLOYEE membership: VIEW, CREATE.
- STORE_MANAGER membership, active REGION_MANAGER assignment đúng region,
  CHAIN_ADMIN: thêm REVIEW, EXPORT trong scope tương ứng.
- Catalog-only không có store. Không suy capability DATE/report/notification,
  catalog administration hoặc Admin. Lookup sản phẩm vẫn dùng P01 VIEW/CREATE
  theo CatalogService; sửa mô tả OpenAPI lệch membership-only, không đổi policy.

Discovery dùng cùng access snapshot/predicates với KPH guard. Mọi business
request kiểm lại DB; UI capabilities không phải token cấp quyền. Revoke,
downgrade, chuyển region hoặc inactive có hiệu lực ở request tiếp theo.

Fresh entry dùng `VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true`;
entry mock và online/Pilot cũ giữ riêng. Login/session/CSRF/logout/password tái
sử dụng client chuẩn. Chọn store explicit, không persist session/token/store
selection vào browser storage. Refresh navigation/focus/reconnect/visibility và
trước chọn store; đang xác minh/error không render scope cũ. Scope mất không
chọn store khác tự động; giảm quyền nhưng còn VIEW cập nhật capabilities.

KPH/history/lookup/create/review/export UI nối ở slice sau, giữ D01 page-local
selection/reset. DATE/report/notification và mọi route chưa nối hiện rõ chưa
kết nối, không render mock operational data trong phiên thật. Khi gắn form/draft
ở slice sau cần giữ dữ liệu form an toàn khi revalidate và clear đúng khi scope
thay đổi, không lấy selector làm authority.

Provenance chọn lọc: BE02/BE03 cũ2b42c94/4a65334 cung cấp SQL/tests và session
skeleton, chưa được coi accepted. Path/response hiện tại theo đề xuất mới, không
nhập `/me/store-access` hay tài liệu catalog sai từ nhánh cũ. Không migration.

Rationale public contract: [ADR0007 proposed](../adr/0007-kph-effective-store-context.md).
