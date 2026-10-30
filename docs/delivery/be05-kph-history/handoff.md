# BE05a

31/10/2026. Root writer; branch/worktree `store-app/be05-kph-history` /
`.local/worktrees/be05-kph-history`; base `eebe010`.

Scope: rút copy thừa, sửa revalidation làm mất màn/form, nối KPH list/detail theo
D01. Không tạo/duyệt/xuất/xóa KPH, migration, API mới, merge/push/deploy. UI còn tạm.
Dùng delivery-cycle và UI/UX skill đã đọc; giữ workflow/contracts và component sẵn có.

Repro4382: delay session700ms rồi focus. `.store-app` biến mất, barcode từ
`0000000000000` thành rỗng, form nhập tay mất, document requests vẫn1.
Nguyên nhân: StoreOnlineSession trả màn chờ mỗi `scope.isFetching` và có nhiều
listener focus/visibility. Sửa giữ DOM khi refresh nền, gom sự kiện/inflight;
401/revoke/lỗi xác minh vẫn đóng scope. Không giảm backend authorization.

KPH đọc page API hiện có (item có full snapshot/ảnh), không tự tạo detail endpoint.
Giữ D01 paging25, filter/sort server, reset page/detail khi đổi context/filter.
Bằng chứng và kết quả kiểm sẽ cập nhật tại đây.
