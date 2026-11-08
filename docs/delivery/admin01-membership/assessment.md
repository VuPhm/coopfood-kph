# ADMIN01 — khởi động 09/11/2026

Yêu cầu: “bắt đầu lộ trình”. Ưu tiên theo NEXT: Admin Web theo vai trò và gán/thu hồi membership. Một writer, không dispatch subagent.

- Base main sạch: `59c7caa240119bdc3bca33084caffad9bc09d8ed`; local main ahead origin/main 3 commits. Không fetch; remote freshness chưa kiểm, không cần để chạy preview local.
- Branch: `store-app/admin01-membership`; worktree `/private/tmp/coopfood-kph-admin01`.
- Các nhánh BE/visual cũ chỉ là provenance, không nhập vào baseline. Không thấy cycle mới active theo CURRENT_STATE/NEXT.
- Đã đọc CURRENT_STATE, NEXT, ENGINEERING_PRINCIPLES, baseline, contract index, P01 và ADR accepted liên quan.
- Reuse Admin hiện có: lifecycle, identity deactivation, self password change, catalog staging. Không có membership write endpoint/UI. `GET /admin/users` hiện chain-only; không dùng endpoint này để mở toàn bộ directory cho region manager.
- Cần chốt target eligibility/directory tối thiểu cho quản lý vùng khi thiết kế API; P01 cho phép gán membership nhưng không cấp quyền quản trị global identity. Không tự cho region xem toàn bộ user directory.
- Mô tả KPH trong OpenAPI vẫn nói membership-only ở lookup/review/export, trái P01/ADR-0004 và access policy implementation. Policy/ADR được ưu tiên; cần sửa mô tả/examples/client trong slice contract, không thu hẹp quyền backend.
- Kiểm tra code trước đổi: app.tsx, lifecycle-admin.ts, IdentityAdminService, IdentityRepository, KphStoreAccessPolicy, StoreAccessRepository, OpenAPI và tests/scripts hiện có.

## Các bước

1. Dựng preview Admin hiện có bằng seed tổng hợp P03, kiểm tra role navigation tại 390×844 và 1440×1024. Owner xác nhận tìm được màn/vị trí phù hợp.
2. Chốt một màn quyền cửa hàng riêng dùng cho chain và region; contract directory scoped, upsert/revoke, reason và conflict last manager.
3. Triển khai contract/examples/client và backend/frontend; test ID hợp lệ ngoài scope, concurrency và audit.
4. Real-backend hai phiên: user chỉ có membership được phép sau grant, deny request kế tiếp sau revoke; quyền vùng/chuỗi độc lập vẫn tồn tại.
5. Owner thử luồng, ghi quyết định riêng; chỉ CLOSED khi đủ gates. Không tự chuyển sang Fresh.

## Môi trường

Dependencies được nối từ workspace hiện có; không sửa lockfile. Lần check đầu thiếu nested workspace dependency do chỉ nối root node_modules; đã sửa setup local bằng symlink nested node_modules, không thay code.
Backend `./backend/mvnw -q -f backend/pom.xml -DskipTests package` PASS (build, không phải test).
