# Cộng tác với Antigravity (AGY)

Co.op Food Store Operations App gồm Store PWA và Admin Web, dùng chung OpenAPI.
Spring Boot và PostgreSQL xử lý nghiệp vụ, quyền và phạm vi cửa hàng.
Xem [README](../README.md) để biết cấu trúc và cách chạy dự án.

## Mở đúng workspace

1. Mở **thư mục gốc worktree của task** trong Antigravity App hoặc IDE. Với CLI,
   cài theo [hướng dẫn Google](https://antigravity.google/docs/getting-started?tab=cli),
   kiểm tra `agy --version` rồi chạy `agy` từ thư mục đó. Đăng nhập và xác nhận
   workspace nếu ứng dụng hỏi trong lần đầu.
2. Kiểm tra `git status --short --branch` và `git rev-parse HEAD` đối chiếu với
   bàn giao. Khi tiếp quản, dùng lại nhánh, worktree và base SHA đã giao.
3. Đọc [AGENTS.md](../AGENTS.md), [CURRENT_STATE](CURRENT_STATE.md) và [NEXT](NEXT.md).
   Sau đó chỉ mở contract, ADR, code và test liên quan đến phạm vi task.
   Runtime của repo và lệnh khởi động nằm trong [README](../README.md).
   Dùng fixture tổng hợp khi cần backend hoặc dữ liệu thử.

## Skill

Khi thêm hoặc sửa hành vi, hoặc tinh gọn test, gọi `/tdd` trong AGY.
[Thư mục skill của workspace](../.agents/skills/tdd) trỏ tới module dùng chung
của repo. Nếu `/tdd` chưa xuất hiện, yêu cầu AGY đọc trực tiếp
[`tooling/skills/tdd/SKILL.md`](../tooling/skills/tdd/SKILL.md).
[Hướng dẫn skill của Google](https://antigravity.google/docs/skills).

## Bàn giao Codex ↔ AGY

Mỗi worktree có một agent viết tại một thời điểm. Chuyển giao bằng một tin
ngắn theo [DELIVERY_WORKFLOW](DELIVERY_WORKFLOW.md). Có thể dùng mẫu sau:

```text
Task và kết quả cần đạt:
Nhánh / đường dẫn worktree / base SHA:
HEAD và thay đổi chưa commit:
Phạm vi được sửa:
Kiểm tra đã chạy và kết quả:
Còn chờ / bước tiếp:
```

Giữ technical PASS và nghiệm thu của owner riêng. Việc push, merge và deploy
theo quyền owner đã cấp cho task.
