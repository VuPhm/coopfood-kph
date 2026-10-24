# COMPACT01 revision2 — evidence

Trạng thái: VERIFYING; candidate và kết quả cuối cập nhật sau gate production.
Owner chưa nghiệm thu. Preview production <http://127.0.0.1:4342/#kph>.

## Phạm vi thực

Task `store-app/compact01-interface-density`, một writer tại
`/Users/vup/Documents/coopfood-kph/.local/worktrees/compact01-interface-density`.
Task base0a257309ae0db1a45cc9d225207a8e0080a99206 ghép đúng Fresh Softd4f9d17
chứa header816b4e3. Main giữf77034d; không sửa worktree/acceptance FORM01.
Khác với planningr1: user đã yêu cầu “tiếp tục thực hiện”; thực thi trên task
baseline có dependency, không chờ merge main và không tự chốt vòng FORM01.

Preference có default/persistence/fallback, switch thật trong account sheet;
scope xuyên app/loading/Radix portal và cleanup. Density screen-only tập trung
functional areas; item nhẹ. Header/hero bỏ scroll-to-top với account và portal
focus để không mất vị trí đọc. Account body cuộn riêng và header cho màn thấp.
Không đổi API/backend/domain/lock/deps/shared UI sau base.

## Kiểm tra đang hoàn tất

Local macOS/Node, Playwright Chromium headless; fixture và ảnh tổng hợp,
không Computer Use. `.local/compact01/` chứa production artifacts/logs/screenshots.
Dependencies task-local dùng symlinks third-party; @coopfood-kph trỏ đúng task,
không dùng packages/ui trên main khi build candidate. Nested @vitejs dùng link
third-party hiện có; không install/đổi lockfile.

- Build mock baseline d4f9d17 tại4341 và candidate tại4342 đã thành công.
- Unit preference/state/portal/cleanup/loading/focus:8tests PASS; frame3tests PASS.
- Dev gate hai mật độ PASS5viewport (390/1440/320/900/844landscape); bước workflow
  cuối sửa selector history cho đúng accessible region, giữ assertion nghiệp vụ.
- Full verify trước sửa focus cuối PASS341tests; sẽ chạy lại trên source cuối
  gồm thêm test focus. Không dùng lượt cũ thay final evidence.
- Gate anchor dùng scroll64px nơi account thực sự hit-test được. Ở scroll450px,
  page kit che header, Playwright tự cuộn để bấm account; đó không phải lỗi
  density hoặc luồng người dùng bấm được. Không dùng luồng auto-scroll này để
  tuyên bố giữ anchor ở mọi vị trí sâu.

## Owner thử

Mở preview4342 → Tài khoản → Cài đặt → Giao diện → Chế độ gọn. So KPH/DATE,
lọc, Báo cáo kỳ/phạm vi và form tạo phiếu; tắt lại để so default. Thử chọn
phiếu/đóng nhóm trước bật/tắt, reload và Tra hạn. Technical không thay owner
acceptance. Chưa merge main/push/deploy/Pages; mock memory-only/browser-local,
chưa chứng minh backend/Safari/Windows hoặc thiết bị thật.
