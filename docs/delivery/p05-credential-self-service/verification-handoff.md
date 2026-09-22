# P05 — Verification handoff

Trạng thái ngày 2026-09-22: implementation và test source đã hoàn tất nhưng **chưa
chạy** bất kỳ test/check/lint/build/E2E nào trong lượt này theo yêu cầu owner.
Tài liệu này là checklist cho ngày 2026-09-23, không phải technical evidence.

## Thứ tự kiểm tra

Từ repository root:

```bash
npm run verify
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./backend/mvnw -f backend/pom.xml -q clean test
```

Sau khi hai gate trên pass, khởi động acceptance stack tổng hợp và kiểm tra bằng
tay cả Store PWA lẫn Admin Web:

```bash
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./e2e/scripts/start-online-acceptance.sh
```

Kiểm tra tối thiểu: sai mật khẩu hiện tại bị từ chối; password ngắn/blocklist/reuse
bị từ chối; password hợp lệ đưa UI về login; mật khẩu cũ không đăng nhập được;
mật khẩu mới đăng nhập được; một session thứ hai bị 401 ở request kế tiếp. Sau đó:

```bash
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./e2e/scripts/stop-online-acceptance.sh
```

## Điều kiện để tạo candidate

- Ghi kết quả thật vào `technical-evidence.md`; không suy diễn pass từ source.
- Nếu sửa code sau gate, chạy lại gate bị ảnh hưởng trên SHA mới.
- Chỉ điền `candidateSha` và chuyển technical gate sang `pass` sau khi tất cả
  kiểm tra bắt buộc đạt; owner acceptance vẫn giữ `pending` cho đến khi owner xác
  nhận riêng.
