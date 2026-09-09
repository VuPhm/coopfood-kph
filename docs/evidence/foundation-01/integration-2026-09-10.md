# Foundation-01 — integrated verification

Ngày: 2026-09-10 (Asia/Ho_Chi_Minh).
Candidate: `e4860361ff90ae91ccdf9c6c2d8bebd1bcc7dbd0`.
Trạng thái: local technical checks pass; remote CI xem checks của PR;
owner acceptance PENDING. Không phải production rollout.

## Kết quả

| Gate | Lệnh / bằng chứng | Kết quả |
| --- | --- | --- |
| Frontend | `npm run verify` | 133 tests, type/contract/docs checks và build pass |
| Backend | Java 21 + `DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw --batch-mode --no-transfer-progress verify` trong backend | 36 tests, 0 failure/error/skip; PostgreSQL 17.10, jOOQ 3.20.17; clean + V1→V4 migration |
| Online build | `VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir /Users/vup/Documents/coopfood-kph/.local/online-dist` | pass |
| Browser | `E2E_APP_URL=http://127.0.0.1:4173 E2E_BACKEND_URL=http://127.0.0.1:8080 npm --prefix e2e test -- --reporter=line` | 5 passed, 3 viewport-specific skips, 17s |
| Workflow | YAML parse và `bash -n` cho các step run | pass; không thay bằng chứng CI remote |

Frontend/backend/build đã chạy ở implementation `acd585d`. Candidate `e486036`
chỉ thêm sửa fixture/assertion E2E và docs; không đổi application/runtime source.
Browser run cuối dùng đúng test source candidate và online artifact đó.
Log đầy đủ local: `.local/verification/{frontend,backend,online-build,browser}.log`.
Các log/artifact runtime gitignored; chỉ dùng dữ liệu tổng hợp.

## Coverage browser thực chạy

- Desktop: manager login, FOUND TPCN với một ảnh, reload và đổi store không lộ phiếu.
- Desktop: NOT_FOUND TPTS giữ tên hàng/NCC nhập tay, ba ảnh có thứ tự; bỏ response
  sau server commit rồi retry cùng key, server chỉ có một phiếu.
- Mobile Chromium 390×844: history card mở rộng và thứ tự ảnh.
- Cả desktop/mobile: session expiry, employee/manager membership và unassigned
  CHAIN_ADMIN không bypass scope.
- Ba skip là hai luồng desktop không lặp trên mobile và ca card không lặp trên
  desktop. Không phải 8 ca nghiệp vụ pass; không có lỗi test được đổi thành skip.
- Đây là Chromium mô phỏng viewport; chưa phải bằng chứng thiết bị iPhone thật.

Sửa khi tích hợp: bổ sung metadata-extractor/multipart limits/proxy, giữ khả năng
retry logout nếu network failure; sửa JPEG fixture hỏng, expected manual supplier,
store.name và chọn lại tab TPTS sau reload. Không nới contract để làm test xanh.

## Bản dùng thử và nghiệm thu owner

Online preview: http://127.0.0.1:4173/ (chỉ trên máy đang chạy task).
Backend: 8080. PostgreSQL tạm: container `coopfood-kph-foundation-01-postgres`,
loopback 55432, database `coopfood_kph_e2e`. Ảnh: `.local/e2e-media`.
Không phải Pilot local-only; không nhập dữ liệu vận hành thật.

Tài khoản tổng hợp `manager.e2e` / `manager-e2e-password`; employee và admin test
được ghi trong `e2e/README.md`. Các tài khoản này không phải mặc định của backend.

Owner thử: login → chọn cửa hàng 0001 → TPCN scan `0890123456789` → thêm ảnh
JPEG/PNG và lưu → reload; thử TPTS mã `0000000000000`, nhập tay tên/NCC, thêm ba
ảnh; đổi cửa hàng 0002 để xác nhận scope; logout rồi login lại.
Ghi chấp nhận hoặc phản hồi cụ thể trước khi CLOSED. Không suy diễn từ việc mở URL.

## Giới hạn và bước tiếp theo

Online JPEG/PNG; chưa hỗ trợ HEIC online, còn Pilot giữ policy đã accepted.
Chưa OIDC production, cloud media, offline sync, approve/export online. Bundle size
warning còn tồn tại và được hoãn theo kế hoạch. Local media cleanup là best effort
khi filesystem lỗi; chưa có cơ chế phục hồi sau process crash ở production.

Hoàn tất CI của draft PR trên SHA tích hợp, xử lý lỗi CI nếu có, nhận owner acceptance.
Không mở thêm audit/refactor tổng quát. Các worktree team tạm đã prune; commit/branch
team vẫn giữ provenance và mọi implementation đã cherry-pick vào branch chính của task.
