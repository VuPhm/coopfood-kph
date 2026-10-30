# BE02 — Effective store discovery

Revision 1, 31/10/2026. Owner yêu cầu bắt đầu triển khai sau BE01.
Nhánh `store-app/be01-backend-transition`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/be01-backend-transition`.
Root sole writer; không có agent hay writer song song. Base `04f7c4a`.
Candidate SHA và kết quả cuối nằm trong plan.json/evidence.md cùng thư mục.

## Kết quả

Thêm `GET /api/v1/me/store-access`: danh sách active stores trong active regions,
quyền KPH theo membership hoặc assignment vùng hoặc chain. Mỗi store một item,
code string giữ leading zero, sắp theo code C collation/UUID, response no-store.
Quyền được đọc lại mỗi request. Shared access snapshot dùng cùng rule với KPH
guard để tránh hai implementation quyền khác nhau.

Giữ nguyên session và API membership cũ, không synthetic role/membership. Không
migration, UI/wiring, dependency/lockfile, provisioning, catalog publish hoặc
Pages. Contract: [BE02](../../product/STORE_ACCESS_DISCOVERY_CONTRACT.md).

## Phạm vi file

- `backend/.../store`: controller/response mới; repository/resolver discovery;
  KPH policy dùng chung capability predicates; 9 HTTP integration tests mới.
- `backend/.../foundation/security/SecurityConfiguration.java`: cho phép đúng GET
  endpoint mới với authenticated session, giữ deny-all cho đường dẫn khác.
- OpenAPI, fixture tổng hợp, manifest, fixture-schema map và generated API types.
- Backend README, contract index, CURRENT_STATE/NEXT, BE01 assessment và hồ sơ BE02.

## Kịch bản nghiệm thu API

1. EMPLOYEE membership: thấy đúng store, view/create true, review/export false.
2. STORE_MANAGER, region assignment hoặc CHAIN_ADMIN: true cả bốn quyền trong
   scope tương ứng; quản lý vùng không thấy store khác vùng.
3. Thu hồi membership/assignment/chain role rồi gọi lại trong cùng phiên: quyền
   biến mất hoặc giảm về scope còn lại. KPH endpoint cũng deny store mất scope.
4. Scope trùng: một item/store; inactive store/region không xuất hiện, user bị
   khóa hoặc đổi credential version nhận 401; catalog-only nhận array rỗng.
5. `/api/v1/stores` và session vẫn membership-only, không bị thêm store kế thừa.

Chạy tái tạo bằng `cd backend && ./mvnw -Dtest=StoreAccessHttpIntegrationTest test`
trên Java21 + Docker (PostgreSQL17 Testcontainers). Dùng duy nhất database/container
và seed tổng hợp do test tự tạo/thu hồi. Không cần dữ liệu vận hành thật.
Chưa có UI mới để owner xem; đây là acceptance API, không phải acceptance online
StoreApp. Các test HTTP chạy server thật/database thật, không thay thế kiểm
browser khi BE03 wiring.

## Giới hạn và bước nhỏ tiếp

Owner acceptance chưa có, chưa merge/push/deploy. Danh sách chưa phân trang;
cần đo scale thực trước tối ưu. KPH capabilities không hứa quyền catalog lookup
kế thừa vì contract lookup hiện còn membership-only. BE03 nối session/chọn store
vào StoreApp sẽ phải giữ boundary này, không tự mở quyền tra cứu.

Bước nhỏ tiếp: dùng discovery này làm nguồn cửa hàng/quyền cho StoreApp, bắt đầu
session và chọn store, kèm hết phiên/đổi scope; chưa gộp DATE/report persistence.
