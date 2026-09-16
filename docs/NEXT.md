# Công việc kế tiếp

Cập nhật: 2026-09-17

## Active next — Online stability S04

Project owner đã chấp nhận S03 và cho phép tiếp tục ngày 2026-09-17. Outcome S04:
online history có một nguồn authority rõ ràng trong TanStack Query, tách khỏi
state/persistence Pilot, trong khi login/create/review/export và UI desktop/mobile
giữ nguyên behavior đã accepted.

### Trong phạm vi

- Online render trực tiếp từ query data/cache; không sao chép history online sang
  state `records` dùng cho Pilot.
- Invalidation/update đúng user + store + khoảng ngày; create không chèn record
  vào cache không thỏa filter và review không để cache approval cũ trong scope.
- Pilot tiếp tục dùng IndexedDB/local state riêng, không đổi migration hay dữ liệu.
- Chuyển online test mocks sang gateway contract đầy đủ ở vùng được chạm; thêm
  regression cho đổi filter/scope, create/review và refetch.
- Chạy Store PWA tests/check, root `npm run verify`, và browser gate phù hợp nếu
  runtime online thực bị ảnh hưởng.

### Acceptance

- Online history chỉ có một nguồn dữ liệu; background refetch không bị state copy
  ghi đè hoặc làm sai count/selection.
- Cache không rò record/approval giữa user, store hoặc date filter; S01 scope guard
  và S02 partial batch behavior vẫn pass.
- Pilot reload/create/trash/export giữ nguyên; giao diện và nghiệp vụ không đổi.
- Không có thay đổi OpenAPI, backend, migration, `packages/ui` hoặc root dependency.

### Ngoài phạm vi

- Paging/server-side sort/filter/selection, giới hạn backend mới hoặc benchmark tải.
- Admin provisioning/catalog, backup/restore, hosting/deploy và production rollout.
- Refactor toàn bộ `app.tsx`, đổi design system hoặc thêm global state manager.

## Các mốc đã đóng

- Pilot-00, Foundation-01 và Foundation-02: xem provenance/evidence trong
  `docs/pilot/`, `docs/evidence/foundation-01/` và
  `docs/delivery/foundation-02-online-review-export/`.
- S01–S02: cycle [online-stability-s01-s02](delivery/online-stability-s01-s02/plan.json),
  đã merge qua PR #3.
- S03: cycle [online-stability-s03](delivery/online-stability-s03/plan.json),
  owner accepted ngày 2026-09-17.

## Sau S04

Không tự mở gói tiếp theo khi S04 chưa được owner nghiệm thu. Thứ tự đề xuất vẫn là:

1. P01 chốt policy provisioning → P02 vertical slice tài khoản/cửa hàng/membership.
2. C01 catalog staging/validation → C02 publish sau khi chốt primary supplier.
3. D01 paging theo số đo; O01 backup/restore; O02 profile triển khai; A01 nghiệm
   thu online trên thiết bị mục tiêu.

Chi tiết dependency, finding và acceptance của từng gói nằm tại
[REVIEW_AND_ROADMAP_2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
