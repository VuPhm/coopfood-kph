# Admin hiện có — evidence 09/11/2026

Runtime source: `59c7caa240119bdc3bca33084caffad9bc09d8ed` (app/backend không thay đổi). Một script walkthrough mới, không mutation nghiệp vụ. Scope: bước đầu của NEXT, không phải nghiệm thu membership.

- `npm --workspace @coopfood-kph/admin-web run check`: PASS.
- `npm --workspace @coopfood-kph/admin-web test`: PASS 2 files / 16 tests.
- `./backend/mvnw -q -f backend/pom.xml -DskipTests package`: PASS; chưa chạy backend tests.
- `bash e2e/scripts/start-p03-acceptance.sh`: PASS backend package + Admin build + PostgreSQL seed + launchctl services. Backend health UP.
- `node e2e/scripts/check-admin01-entry.cjs`: PASS chain/region × 390×844/1440×1024, headless Chromium, dữ liệu thật trong PostgreSQL tổng hợp. Scope option chain 4 targets, region 1 store; region không có Tài khoản và GET admin/users = 403. Cả hai mở/đóng đổi mật khẩu; không overflow/pageerror. Script chỉ đọc, không thu hồi user hoặc thực thi lịch.
- `npm run check:docs`: PASS trước ghi evidence, kiểm lại sau cùng.
- Screenshot tại `.local/verification/admin01-entry/` (6 ảnh), đã xem desktop identity và mobile region lifecycle. Không đổi UI.

Lần Playwright đầu trong sandbox crash SIGTRAP trước khi mở browser; chạy ngoài sandbox thành công. Lần đầu script dùng exact label mật khẩu thiếu dấu bắt buộc nên timeout; đã sửa regex nhãn và chạy lại đủ 4 trường hợp PASS.

## Dùng thử

URL: http://127.0.0.1:4174 — Admin online, backend 8081, DB container `coopfood-kph-p03-acceptance`, dữ liệu giả lập P03.

- `chain.p03` / `admin-e2e-password`: thấy lifecycle toàn chuỗi và nút Tài khoản.
- `region.p03` / `admin-e2e-password`: chỉ cửa hàng B trong lifecycle; không có Tài khoản toàn chuỗi.
- Owner xem hai vai trò, nhận xét việc tìm màn và vị trí phù hợp cho mục “Quyền cửa hàng”. Đề xuất: workspace riêng ở thanh đầu trang cho chain/region; không ghép gán quyền với nút vô hiệu hóa user.
- Không cần thực thi lịch/vô hiệu hóa để duyệt vị trí. Chưa có màn/API membership; không thể chứng minh grant/revoke bằng preview này.
- Owner decision: PENDING. NEXT yêu cầu walkthrough trước khi chốt màn/API; skill delivery-cycle yêu cầu “silence is not acceptance”.

Runtime qua launchctl, logs `/tmp/coopfood-kph-p03-acceptance`. Dừng bằng `bash e2e/scripts/stop-p03-acceptance.sh` trong worktree. Không push/deploy/Pages.
