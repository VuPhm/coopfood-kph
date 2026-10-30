# BE03 — Session và cửa hàng thật

31/10/2026. Root sole writer. Branch `store-app/be03-store-session`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/be03-store-session`.
Base `2b42c94` từ checkpoint BE02; không merge main, push backend hoặc deploy.
Owner yêu cầu tiếp BE03 sau khi push UI; chỉ candidate Fresh được phép push.
Remote Fresh đã xác minh `157a22f850117496c121449cae462134a7611fae`.

## Outcome và cách chạy

`VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true` chọn StoreOnlineApp mới;
mock dev và online/Pilot entry cũ giữ cấu hình riêng. Reuse StoreLogin,
StoreAppFrame, page canvas và ChangePasswordDialog; gateway session/CSRF hiện có.
Effective stores/capabilities lấy riêng từ BE02, không membership/role giả.

Đăng nhập → chọn cửa hàng explicit → xem identity/capabilities; đổi store reset
context. Refresh khi điều hướng, browser focus/reconnect/visibility và thao tác
chọn store. Trong khi xác minh/error, không render scope cũ; 401 về login;
network error có retry; scope mất không tự chuyển cửa hàng. Không persist
session/token/store selection vào browser storage. Server vẫn authorize request.

Các màn KPH/catalog/DATE/report chưa nối trong slice này: chỉ hiện trạng thái
chưa kết nối, không dùng records/lots/profile mock trong phiên thật. Không mở
quyền catalog cho quản lý vùng/chain. BE04 lookup và BE05 KPH là slice tiếp.

## Acceptance

Dùng fixture tổng hợp: login employee → chọn 0001, chỉ view/create; region manager
không membership vẫn chọn 0001/0002; chain thấy ba stores. Chuyển store không
còn identity cũ. Revoke membership/assignment rồi điều hướng/refresh phải mất
store; credential reset/session expiry trở về login. Offline che scope và retry.
Đăng xuất CSRF; đổi mật khẩu thành công yêu cầu login lại. Kiểm 390×844/1440×1024.

Technical:354frontend/package tests và6browser API thật PASS;
contract/generated client/TypeScript/build/PWA đạt.
Owner acceptance pending. Không coi UI mock là dữ liệu online,
không claim deploy/remote CI/thiết bị thật. Evidence cập nhật sau verification.

## Preview nghiệm thu

<http://127.0.0.1:4381/> — build online riêng, backend8080 và PostgreSQL55433
disposable tổng hợp. Ví dụ `employee.e2e` / `employee-e2e-password`,
`region-manager.e2e` / `manager-e2e-password`,
`chain-admin.e2e` / `admin-e2e-password`. Fixture đã reset sau tests.
Backend và preview đang chạy trong process local của lượt này; nếu process dừng,
chạy lại theo E2E README. Không nhập dữ liệu vận hành thật.

Candidate `cb9f853d438bfd11a1111e399593b0ad4b0ab2e6`; source checkpoint `b2ac955`.
[Commands/results/limits](evidence.md).

## Owner follow-up31/10/2026

Owner nói “tạm, giao diện chưa xong, tiếp”. Đây là cho phép tiếp BE04; không
ghi nhận nghiệm thu UI hoặc đóng BE03. Lookup scope sau đó được owner chọn
quyền KPH vùng/chuỗi; xem [ADR-0007](../../adr/0007-barcode-lookup-scope.md).
Câu “không mở quyền catalog” ở handoff ban đầu giữ làm lịch sử trước quyết định mới.
