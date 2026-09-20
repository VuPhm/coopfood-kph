# P03 — nghiệm thu lịch ngừng hoạt động

Candidate: `b9e909daeb2aaa92ccd51dadc08d1162d0481e7c`, branch
`codex/p03-scheduled-lifecycle`, revision 1. P02 đã CLOSED và không mở lại.
P03 chờ owner nghiệm thu, chưa CLOSED. “Tiếp” là yêu cầu tiếp tục làm, không
phải quyết định nghiệm thu kết quả P03.

## Mở bản chạy thử

- URL local: <http://127.0.0.1:4174>.
- Quản trị chuỗi: `chain.p03`; quản lý vùng B: `region.p03`.
- Mật khẩu chung **chỉ cho dữ liệu tổng hợp local**: `admin-e2e-password`.
- Backend 8081, PostgreSQL 17 ở 55433, chỉ bind loopback. Không phải deployment.
- Hai lịch đến hạn được seed như đã tạo 31 ngày trước; không có API bỏ qua
  quy tắc 30 ngày. Dữ liệu không đến từ cửa hàng/người dùng thật.

Nếu preview chưa chạy, từ repository root, với Docker/OrbStack đang hoạt động:

```sh
DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock bash e2e/scripts/start-p03-acceptance.sh
```

Script dùng macOS launchctl, không tự ghi đè runtime hoặc giết process chiếm
port. Dừng/tạo lại sẽ xóa **database tổng hợp P03**, gồm thay đổi dùng thử, nhưng
không tác động runtime Store PWA/Foundation hoặc dữ liệu khác:

```sh
DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock bash e2e/scripts/stop-p03-acceptance.sh
DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock bash e2e/scripts/start-p03-acceptance.sh
```

Log local: `/tmp/coopfood-kph-p03-acceptance/`; revision ghi tại `revision`.

## Kịch bản ngắn cho owner

1. Đăng nhập `chain.p03`. Chọn **P03-002 / Cửa hàng B mẫu**, giữ ngày mặc định
   hoặc chọn ngày xa hơn theo dd/mm/yyyy, nhập lý do rồi tạo lịch. Kỳ vọng ngày
   sớm nhất là hôm nay +30 ngày theo giờ Việt Nam, cửa hàng vẫn hoạt động và
   không thể thực thi sớm. Thử ngày +29 phải báo lỗi.
2. Đổi ngày của lịch B, tải lại trang để thấy dữ liệu đã lưu, rồi hủy lịch kèm
   lý do. Kỳ vọng lịch giữ lại ở trạng thái “Đã hủy”, không bị xóa.
3. Với lịch đến hạn **P03-A / Vùng A mẫu**, bấm thực thi trước: bị chặn vì còn
   cửa hàng hoạt động. Thực thi **P03-001 / Cửa hàng A mẫu**, sau đó thực thi
   vùng A: cả hai chuyển “Đã thực thi”. Không còn target active tương ứng để
   tạo lịch mới; quyền KPH của store A bị deny ở request kế tiếp.
4. Đăng xuất rồi đăng nhập `region.p03`: chỉ thấy cửa hàng/lịch của vùng B,
   không thấy lịch vùng A/cửa hàng A. Thử trên cửa sổ hẹp: không tràn ngang,
   nhãn/ngày/lý do/nút vẫn dùng được.

## Những gì đã đổi

- `backend/.../lifecycle/**`, `V7__scheduled_lifecycle.sql`: lưu lịch, khóa dữ
  liệu, authorization hiện tại, guard lúc thực thi và audit trong transaction.
- `contracts/openapi/kph.openapi.yaml`, fixtures, fixture checker,
  `packages/api/src/generated/schema.d.ts`: contract và generated client đồng bộ.
- `apps/admin-web/src/**`, `vite.config.ts`: login/session, tạo/đổi/hủy/thực thi,
  cache theo user, xử lý hết phiên, thông báo tiếng Việt, layout theo UI DNA.
- `e2e/scripts/*p03*`, `review-admin-lifecycle.cjs`, `e2e/seed/p03-lifecycle.sql`:
  preview tổng hợp và kiểm chứng có thể chạy lại. Xem [technical evidence](technical-evidence.md).

## Giới hạn và quyết định cần chấp nhận

- **Lịch không tự chạy**: từ ngày hiệu lực, người có quyền thực thi thủ công.
  Đổi lịch vẫn phải cách ngày server tiếp nhận ít nhất 30 ngày; không nới ngày
  theo thời điểm tạo lịch ban đầu.
- Không hard delete; chưa có reactivate/move/store create hoặc quản trị
  user/role/membership/credential. Không đổi Store PWA.
- Không có thông báo, pagination, deployment production, SSO/MFA hoặc đo hiệu
  năng thiết bị thật. Kiểm tra mobile là Chromium viewport, không phải iPhone thật.
- Không push/merge/PR hoặc remote CI trong vòng này.

Owner hãy xác nhận “P03 pass” nếu các thao tác và cách thực thi thủ công đáp ứng
nhu cầu, hoặc nêu kịch bản/lỗi cần sửa. Chỉ sau quyết định explicit mới ghi user
gate và chạy close check. Theo delivery-cycle: technical pass không thay thế
user acceptance; không tự mở cycle tiếp theo.
