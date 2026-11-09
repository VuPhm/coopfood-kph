# ADR0007 — KPH effective store context

Status: Proposed — KPHON01 implementation candidate09/11/2026, owner acceptance pending.

## Bối cảnh

Session và GET /api/v1/stores trả membership, trong khi P01/ADR0004 đã cho
quản lý vùng/chuỗi quyền KPH kế thừa. Dùng membership để chọn store sẽ bỏ sót
quyền hợp lệ; gán role giả ở client sẽ trộn navigation với authority. BE02/BE03
cũ có candidate /me/store-access chưa accepted; scope mới đề xuất /kph/stores.

## Quyết định cho candidate

Thêm read-only GET /api/v1/kph/stores, giữ session/GET /stores cũ. Mỗi active store
trong active region xuất hiện một lần từ hợp scope P01, response id/code/name và
capabilities VIEW/CREATE/REVIEW/EXPORT; no-store, code là string, sắp C collation/id.
Dùng cùng access snapshot/predicates với business guards, không tạo role hay
membership giả; mọi mutation/query nghiệp vụ vẫn authorize riêng ở backend.
Fresh online entry riêng dùng discovery, không nhận mock data làm authority.
Route chưa nối có trạng thái rõ; giữ D01 cho history khi wiring ở slice kế.

## Trade-off và xem xét lại

Endpoint riêng giữ compatibility và ranh giới KPH, đổi lại thêm một read khi
xác minh session/context. Array chưa phân trang giúp explicit chọn store ở quy
mô thử; không silently truncate. Cần đo số store/payload trước rollout; nếu cần
pagination hoặc capability khác, mở contract rõ cùng examples/client/tests.
Nhiều HTTP request không hứa cùng transaction snapshot; quyền luôn recheck tại
business request. Không cấp DATE/report/catalog-admin capability từ KPH discovery.

Không thay business policy, topology, schema migration, session security hoặc
Pages. Owner context acceptance chưa có; không coi candidate này là ADR accepted.
