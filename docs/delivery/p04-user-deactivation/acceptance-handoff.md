# P04 — nghiệm thu vô hiệu hóa tài khoản

Code candidate: `b4a73fb1647a86e803a6ffd0e254ebc25e475ba5`; delivery checkpoint
`e502886e2466b748f976f3686e62e1f9afb62a3d`. Branch
`codex/p04-user-deactivation`, revision 3 (tích hợp main/P05). Technical gate đã PASS; owner đã xác nhận “pass p04” ngày 23/09/2026.

## Bản chạy thử

- URL local: <http://localhost:4174>.
- Tài khoản quản trị: `chain.p03`.
- Mật khẩu **chỉ cho dữ liệu tổng hợp local**: `admin-e2e-password`.
- Backend thật ở 8081, PostgreSQL 17 riêng ở 55433, chỉ bind loopback.
- Preview đã reset dữ liệu sạch sau automated browser acceptance; đăng nhập rồi
  chọn **Tài khoản**. Đây là backend thật với dữ liệu tổng hợp, không phải deployment.

Nếu preview không còn chạy, từ repository root, với Docker/OrbStack hoạt động:

```sh
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  bash e2e/scripts/start-p03-acceptance.sh
```

Để reset sau khi thử deactivate thành công, hai lệnh dưới chỉ xóa database tổng
hợp của preview này (`--rm`) rồi tạo lại từ seed; không tác động dữ liệu khác:

```sh
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  bash e2e/scripts/stop-p03-acceptance.sh
env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock \
  bash e2e/scripts/start-p03-acceptance.sh
```

Log nằm tại `/tmp/coopfood-kph-p03-acceptance/`; SHA runtime ở file `revision`.

## Kịch bản ngắn cho owner

1. Xác nhận thẻ `chain.p03` ghi **Tài khoản đang đăng nhập** và không có nút
   vô hiệu hóa. Đây là self-deactivation guard ở UI; backend vẫn bắt buộc guard.
2. Chọn **Vô hiệu hóa** tại `manager.p03`, nhập lý do tổng hợp rồi xác nhận.
   Kỳ vọng backend từ chối và UI báo phải giữ ít nhất một quản lý đang hoạt động
   cho cửa hàng; tài khoản vẫn **Đang hoạt động**. Đây là last-manager guard.
3. Tùy chọn kiểm session: trước bước tiếp theo, mở cửa sổ riêng và đăng nhập
   `region.p03` / cùng mật khẩu. Ở cửa sổ quản trị chuỗi, chọn `region.p03`, nhập
   lý do rồi xác nhận. Kỳ vọng thẻ chuyển **Đã vô hiệu hóa**, nút chuyển sang trạng thái không thể thao tác; request
   tiếp theo ở cửa sổ `region.p03` trả về màn hình đăng nhập và login mới bị từ
   chối.
4. Thu nhỏ cửa sổ hoặc xoay landscape. Kỳ vọng card/dialog không tràn ngang,
   reason/CTA vẫn thao tác được và loading/success/error có nội dung rõ.

Chỉ dùng các tài khoản tổng hợp ở trên. P04 không có reactivation UI; dùng reset
preview nếu cần thử lại từ đầu.

## Phạm vi cần chấp nhận

- Chỉ active `CHAIN_ADMIN` xem directory toàn chuỗi và deactivate user khác.
- Deactivate cần reason 1–500 ký tự, audit tối thiểu, giữ role/assignment/
  membership để reactivation explicit về sau và vô hiệu session ở request kế.
- Không cho self-deactivate, không làm mất last active CHAIN_ADMIN và không làm
  mất last active STORE_MANAGER của bất kỳ active store nào.
- Không bao gồm create/update/reactivate, credential lifecycle, revoke quyền,
  phân trang, production rollout hoặc dữ liệu vận hành thật.

Chi tiết kiểm tra tự động và visual QA ở [technical evidence](technical-evidence.md).
Owner acceptance chỉ được ghi khi có xác nhận trực tiếp; technical PASS không tự
được coi là nghiệm thu.


## Kiểm chứng mới ngày 23/09/2026

161 frontend/package tests, 64 backend tests (0 skip) và real-backend browser
4 viewport PASS. Thử thêm nút **Đổi mật khẩu** tại workspace Tài khoản để kiểm
P05 vẫn hiện diện. Phiên admin cũ sau đổi mật khẩu đã được integration test xác
nhận không thể khóa user. Trên màn hình ngang thấp, có thể cuộn nội dung dialog
để thấy nút xác nhận đầy đủ.

Owner xác nhận ngày 23/09/2026: “pass p04, tiếp tục phân task để các model nhỏ implement”.
Nguồn: task `01a0ccf7-c6e3-7fc1-a392-b3e5f7ed6955`. Chấp nhận candidate
`e502886e2466b748f976f3686e62e1f9afb62a3d`, revision 3. Cycle CLOSED; chưa merge/deploy.
