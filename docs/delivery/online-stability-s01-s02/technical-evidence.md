# Technical evidence — online stability S01–S02

Ngày: 16/09/2026. Revision: 2. Candidate:
`ac906776fd8876e1c89b686fc882f7b8b0cc640b`.

Revision 2 chỉ mở rộng bước phối hợp sang push/draft PR; không đổi runtime code,
contract hay acceptance behavior. Toàn bộ evidence revision 1 trên candidate này
được carry forward; các commit mới hơn candidate chỉ nằm trong thư mục hồ sơ cycle.

## Phạm vi đã kiểm

- S01: response tạo phiếu bị giữ rồi trả sau khi đổi store hoặc logout/login
  không cập nhật history, selection hoặc notice của scope mới; response cùng
  scope vẫn cập nhật bình thường.
- S02: duyệt lô đợi mọi request settle, tối đa bốn request đồng thời, refetch
  sau cùng, báo số thành công/thất bại và chỉ giữ phiếu lỗi để retry.
- Review đơn lẻ cũng dùng scope guard để response cũ không cập nhật store/session
  mới hoặc gỡ busy của thao tác mới.

## Lệnh và kết quả

| Lệnh / runtime | Kết quả |
| --- | --- |
| `npm run test --workspace @coopfood-kph/store-pwa -- --run src/app.online.identity.test.tsx` | PASS 8 tests, gồm deferred create, partial review/retry và concurrency bound |
| `npm run check --workspace @coopfood-kph/store-pwa` | PASS TypeScript |
| `npm run verify` | PASS docs, Contract Lock 14 resources/7 API fixtures, generated API drift, typecheck, 143 tests và build Admin Web/Store PWA |
| `VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir .../.local/online-dist --emptyOutDir` | PASS online production build; PWA precache 13 entries |
| `E2E_APP_URL=http://127.0.0.1:4173 E2E_BACKEND_URL=http://127.0.0.1:8080 npm --prefix e2e test` | PASS 6, skip 4 theo viewport; desktop/mobile Chromium |

Browser gate dùng Docker 29.4.0, PostgreSQL 17.10 disposable trên port 55432,
schema sạch migrate V1→V5, fixture tổng hợp, media riêng dưới `/tmp`, backend
Spring Boot cục bộ và online preview port 4173. Các process, container `--rm` và
media tạm do lượt này tạo đã được dừng/xóa; ba port 55432/8080/4173 không còn
listener sau kiểm tra.

## Giới hạn

- Partial-failure và concurrency được kiểm deterministically bằng component mock;
  browser suite thật kiểm surrounding create/reload/cross-store, idempotency
  retry, manager review/export/date filter, mobile và session/membership.
- Không có real-device/iPhone acceptance và không coi Chromium viewport là thiết
  bị thật.
- Build vẫn có warning chunk lớn đã có ở baseline (main khoảng 527 kB, ExcelJS
  khoảng 930 kB); task này không thay dependency hoặc bundle strategy.
- Backend source không đổi nên không chạy lại full `./mvnw verify`; browser gate
  đã khởi động backend thật từ schema sạch và đi qua các HTTP flow liên quan.
