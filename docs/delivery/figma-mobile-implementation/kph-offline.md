# Offline trong bản hiện tại — 11/10/2026

Owner làm rõ: giữ vài khả năng offline trong bản đang tối ưu tại
`http://127.0.0.1:4197/#kph`; bỏ hướng prototype 6 shell khỏi follow-up.
Không phát triển lại Pilot/prototype, đổi entry production hoặc deploy.

## Thay đổi và giới hạn

- `apps/store-pwa/src/store-app.tsx`: mount PwaStatus để đăng ký worker trong
  entry hiện tại, giữ instance qua navigation, kể cả login. Trước đây chỉ
  App cũ đăng ký worker; StoreApp có sw.js được build nhưng không tự cài.
- `pwa-status.tsx`, `app.tsx`: copy offline đúng chế độ dữ liệu. StoreApp giữ
  phiếu dùng thử trong phiên, tải lại mất thay đổi. Online cần mạng để tải/gửi
  phiếu. Giữ copy dữ liệu trên thiết bị cho Pilot. Chỉ đăng ký worker trong
  production; VitePWA dev chưa bật nên dev không cài worker.
- `store-app.css`: thông báo mobile nằm trên toolbar, dưới modal.
- `vite.config.ts`: ghi rõ giữ lazy chunks trong precache; chỉ static assets,
  không cache API/record/ảnh minh chứng private. Update vẫn cần bấm xác nhận,
  không tự reload khi đang nhập phiếu.
- `pwa-status.test.tsx`: copy theo mode, online/offline events và update không
  gửi SKIP_WAITING trước khi bấm nút.
- `e2e/scripts/check-kph-offline.cjs`: regression với worker thật, hai viewport.

Sau một lần mở có mạng và cài cache thành công: mở lại Home khi mất mạng;
tra hạn lùi từ ngày nhập tay; mở KPH/form lần đầu và xuất Excel từ dữ liệu
dùng thử trong phiên. Module vẫn lazy về thực thi, worker tải sẵn bytes để
lần dùng đầu không phụ thuộc mạng. Chưa thêm lưu nháp bền, outbox, tự gửi
phiếu khi có mạng hoặc cache dữ liệu máy chủ; giữ ranh giới ADR 0002/0006.

Build precache **94 entries, 3205,50 KiB** (~3,13 MiB theo Workbox report).
Đây là chi phí cài/cập nhật static cache. Phép đo JS Home trước đó chặn worker,
không bao gồm lưu lượng này; không suy ra giảm tổng download cài PWA. Giữ
Excel/decoder trong cache tốn dung lượng nhưng không thực thi chúng ở Home.
Tham khảo [Workbox precaching](https://developer.chrome.com/docs/workbox/modules/workbox-precaching)
và [cập nhật worker](https://developer.chrome.com/docs/workbox/handling-service-worker-updates).

## Kiểm tra

- `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2`:
  **180 tests PASS**, 23 files.
- Build TypeScript/Vite với `VITE_STORE_APP_MOCK=true` và với
  `VITE_STORE_APP_MOCK=false VITE_KPH_ONLINE=true`: PASS. Excel chunk size
  warning vẫn còn, không đổi giới hạn để che warning.
- `STORE_PREVIEW_URL=http://127.0.0.1:4197 node e2e/scripts/check-kph-offline.cjs`:
  **PASS 390×844 và 1440×1024**, không pageerror. HTTP cache tắt, worker allow,
  đợi serviceWorker.ready rồi offline và reload. CDP overrideNetworkState áp
  lại sau navigation để navigator.onLine phản ánh offline; probe ngoài cache
  thất bại. Tất cả 15 JS/CSS build có trong CacheStorage, không API; Home chưa
  thực thi KPH/form/Excel. HTML reload và chunk KPH/form/Excel đầu tiên đều
  fromServiceWorker. Workbook đọc lại đúng SKU `0011730`; tra hạn lùi ra
  `08/10/2026`. JSON/PNG tại `.local/kph-loading/offline/`; đã xem screenshot.
- `npm run check:docs` và `git diff --check`: PASS.

Bước nhỏ tiếp theo: thử bản hiện tại trên điện thoại đã cài PWA, chờ cache
hoàn tất rồi bật chế độ máy bay và mở lại. Browser lab chưa thay kiểm tra
thiết bị thật hoặc bảo đảm cache không bị OS/browser thu hồi.
