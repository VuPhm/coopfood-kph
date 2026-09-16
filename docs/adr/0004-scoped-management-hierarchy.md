# ADR 0004 — Scoped management hierarchy

Status: Accepted — 2026-09-17

## Bối cảnh

Foundation-02 chỉ có `STORE_MANAGER` theo store membership. P01 cần thêm một
cấp quản lý vùng gồm nhiều store và một cấp admin toàn chuỗi, đồng thời không
được biến role name hoặc UI visibility thành quyền truy cập ngầm.

Project owner quyết định ngày 17/09/2026: quản lý vùng chỉ đi xuống store thuộc
đúng vùng được giao; admin tổng phía trên đi xuống mọi store. Các policy còn lại
theo security standard của P01.

## Quyết định

- `CHAIN_ADMIN` là global role cấp toàn chuỗi. Role này có thể quản trị
  identity/region/store/assignment và thực hiện KPH trong mọi active store.
- `REGION_MANAGER` là active user-region assignment, không phải global role.
  Một user có thể có nhiều assignment; mỗi assignment được kiểm độc lập.
- Một active store thuộc đúng một active region. Backend resolve quan hệ
  store → region từ database khi authorize; client không truyền region để tự
  nâng scope.
- `REGION_MANAGER` được xem/tạo/duyệt/xuất KPH và quản lý store membership/profile
  trong các store thuộc active region assignment. Không được cấp global role,
  cấp region assignment, reset credential hay tác động store ngoài vùng.
- `STORE_MANAGER` và `EMPLOYEE` tiếp tục dùng active store membership. Quyền
  hiệu lực là hợp của các scope explicit; `CHAIN_ADMIN` không cần synthetic
  membership và `REGION_MANAGER` không cần tạo membership giả ở từng store.
- Mọi mutation privileged ghi audit với actor, effective scope và target. Backend
  bắt buộc có deny tests cross-store/cross-region, kể cả ID hợp lệ đoán được.

## Trade-off và hệ quả

Hierarchy giảm thao tác gán lặp cho quản lý vùng và đáp ứng vận hành toàn chuỗi,
nhưng mở rộng blast radius của account đặc quyền. P02 cần bảng region và
user-region assignment, authorization policy tập trung, session invalidation khi
scope đổi và audit đầy đủ. UI store selector chỉ là navigation, không phải guard.

`REGION_MANAGER` chưa được quản trị global identity/credential; đây là lựa chọn
least privilege. Nếu vận hành cần delegated identity administration, phải chốt
target eligibility và cross-region effects bằng một policy/fixture riêng.

## Xem xét lại khi

- Một store cần thuộc nhiều vùng đồng thời hoặc lịch sử chuyển vùng có hiệu lực
  theo thời gian.
- Cần cấp quyền chi tiết hơn xem/tạo/duyệt/xuất thay vì bundle quản lý hiện tại.
- Cần delegated credential/global identity administration cho quản lý vùng.
