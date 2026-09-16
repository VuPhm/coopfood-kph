# Technical evidence — online stability S04

Ngày: 17/09/2026. Revision: 1. Candidate:
`ebc9cdc84cc29bdde8f226ef71054a9eca5e4c32`.

## Phạm vi đã kiểm

- Store PWA online render history trực tiếp từ TanStack Query; state
  `localRecords` chỉ còn phục vụ Pilot/demo và không nhận response online.
- App dùng gateway identity/history đầy đủ, bỏ `Partial<OnlineGateway>` và đường
  compatibility legacy workspace khỏi composition runtime.
- Review single cập nhật mọi cache date-filter cùng user/store; review batch cập
  nhật rồi invalidate/refetch toàn scope sau khi mọi request settle.
- Create online invalidate/refetch scope authoritative; chỉ select record nếu ID
  thực sự có trong query của date filter đang hiển thị. Response cũ qua đổi
  store/session tiếp tục bị S01 guard loại bỏ.
- Pilot hydration/create/review vẫn dùng local state và persistence riêng.

## Lệnh và kết quả

| Lệnh / gate | Kết quả |
| --- | --- |
| `npm run check --workspace @coopfood-kph/store-pwa` | PASS TypeScript |
| `npm run test --workspace @coopfood-kph/store-pwa -- --run src/app.online.test.tsx src/app.online.identity.test.tsx src/app.test.tsx` | PASS 3 files, 36 tests |
| `npm run verify` | PASS docs, Contract Lock 14 resources/7 API fixtures, generated API drift, TypeScript, 147 tests và build hai frontend |
| `VITE_KPH_ONLINE=true ... vite build --outDir /tmp/coopfood-kph-s04-online-dist` | PASS online production build |
| `node e2e/scripts/review-ui.cjs` trên online preview | PASS 7 viewport: login desktop/mobile; workspace 1440/768/390/320 và 667×375; không page error/overflow |
| `git diff --check` trước candidate | PASS |

## Giới hạn

- `./e2e/scripts/start-online-acceptance.sh` dừng ngay với “Docker chưa sẵn
  sàng”; do đó real-backend Playwright suite không được chạy lại trên candidate.
  Không có container/service acceptance nào được tạo. S04 không đổi backend,
  OpenAPI, schema hay HTTP adapter; component tests dùng full gateway mock và
  browser fixture review không thay thế bằng chứng real-backend.
- Build vẫn có warning chunk lớn baseline (main khoảng 527 kB, ExcelJS khoảng
  930 kB); S04 không đổi dependency/bundle strategy.
- Không kiểm thiết bị thật; HEIC và rollout vẫn ngoài phạm vi.
