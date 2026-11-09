# Bước kế tiếp — chuẩn bị luồng membership

Theo yêu cầu tiếp lộ trình sau sửa preview ngày09/11/2026. Đây là đề xuất để owner quyết định, chưa mở quyền thay API/backend hoặc can thiệp nhánh ADMIN01.

## Phần đã có authority

P01 và ADR0004: chain toàn chuỗi; region manager chỉ store trong active region assignment; EMPLOYEE/STORE_MANAGER; upsert unique user+store; revoke có lý do, audit; chặn mất quản lý cuối cùng của active store; hiệu lực request kế tiếp, không cần đăng nhập lại. Không tạo user, cấp global/region role hay reset credential trong slice này.

## Màn đề xuất

Điều hướng “Quyền cửa hàng”, trong nhóm Quản lý vận hành. Chọn cửa hàng thuộc scope → danh sách membership với vai trò/trạng thái → “Thêm người dùng” → chọn người hiện có, chọn EMPLOYEE/STORE_MANAGER, lý do và xác nhận. Thu hồi từ từng hàng, xác nhận hậu quả và lý do; lỗi last-manager giữ nguyên form. Sau thành công đọc lại dữ liệu từ backend. Không dùng số liệu Tổng quan mock làm nguồn cho màn này.

## Quyết định cần chốt trước contract

API hiện tại GET admin/users chỉ dành cho CHAIN_ADMIN; không mở nguyên directory đó cho REGION_MANAGER.

1. Chỉ tìm người đã có membership/assignment trong vùng actor được giao. Phạm vi kín hơn; người chưa thuộc vùng cần chain admin cấp lần đầu. Cần định nghĩa rõ quan hệ active nào làm người đó xuất hiện.
2. Tra cứu username chính xác của active user toàn hệ thống, trả identity tối thiểu cho việc cấp membership vào store đúng scope. Cho phép người chưa thuộc vùng; cần owner chấp nhận việc xác nhận sự tồn tại của username từ ngoài vùng. Không trả global/region roles hay memberships ngoài scope.

Owner đã quyết định trong chat09/11/2026: chọn phương án2 — tra cứu chính xác username, kể cả người chưa thuộc vùng. Chỉ trả id/username/displayName của active user; scope store vẫn do server kiểm. Không mở global directory cho region.

Sau quyết định: kiểm tra ownership ADMIN01 thực tế, giữ worktree/branch task riêng, chốt OpenAPI+examples+client trong một slice; backend scope/audit/transaction tests; UI Fresh và Playwright hai phiên Admin/Store. Store user chỉ có membership này phải được phép sau grant và bị deny ở request kế tiếp sau revoke. Cross-region ID hợp lệ phải bị từ chối. Owner acceptance riêng với technical PASS.
