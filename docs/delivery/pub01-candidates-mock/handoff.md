# PUB01 — push candidates và cập nhật mock Cloudflare

31/10/2026. Owner yêu cầu: “trước khi nối, push các candidate trước … push xong
thì đưa giao diện hoàn thiện lên link mock cloudflare cho khách xem”. Đây là
quyền push các candidate hiện có và publish mock vào dự án Cloudflare hiện có;
không phải nghiệm thu UI/backend hoặc yêu cầu merge hai chuỗi/main.
Root sole writer, worktree `.local/worktrees/pub01-candidates-mock`, branch
`store-app/pub01-candidates-mock`, base POLISH03 `c7cc93910664dad66e2652a55cad76b8d53b4e4a`.

## Kết quả

- Link khách xem: <https://coopfood-demo-20261021.pages.dev/#home>.
- Deployment cố định: <https://964a4c68.coopfood-demo-20261021.pages.dev>.
- Deployment ID: `964a4c68-2f8e-4949-afb7-9fb3049eec8a`, production branch `demo`.
- Runtime source: `c7cc939` (POLISH03, đầy đủ chuỗi UI đến30/10).
- Bản trước vẫn giữ: <https://72c8cc2c.coopfood-demo-20261021.pages.dev>.
- Đã push16candidate bằng một atomic push, không force. Remote SHA từng nhánh
  được đọc lại và khớp checkpoint local: [receipt](pushed-candidates.json).
  Main04f7c4a và Fresh157a22f đã có trên remote từ trước; không push lại.

Chuỗi UI mới LIST01 → SEARCH01 → HERO01/COLOR01 (đã revert màu thử) → MOTION01 →
NOTIF01 → DATE04 → KPH03/04 → DATE05 → SEARCH02 → POLISH03. Những source này
chưa nằm trong baseline backend BE02–05. Các bản online backend còn provisional
không phải bản mock hoàn thiện khách xem. Giữ hai chuỗi để tích hợp có kiểm soát.

## Kiểm tra và file

`npm run verify` PASS369tests: Admin16, Store315, API2, rules19, UI17;
docs/contracts/generated client/TypeScript/build/PWA đều đạt. Build mock riêng:

```sh
VITE_STORE_APP_MOCK=true VITE_STORE_APP_ONLINE=false VITE_KPH_ONLINE=false npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/pub01/site --emptyOutDir
```

122build files được băm SHA256 [manifest](artifact-sha256.json),120precache.
Chỉ thêm `_headers` và `robots.txt` từ mock trước: noindex/nofollow/noarchive,
no-store entry, no-cache service worker. Không thay runtime/component/token/API.
Wrangler upload123files (robots tính cùng assets), `_headers` xử lý riêng.

Browser headless Chromium:

- [Local smoke](local-smoke.json) và [public smoke](public-smoke.json):390×844,
  1440×1024,7màn, tìm KPH/mở hai form/Tra hạn/báo cáo lưu và tải Excel/PWA.
  Không JS/HTTP errors, API calls hoặc external data requests.
- [POLISH03](polish-browser.json) và [DATE05](date-browser.json):390/1440/320/844,
  scan glyph/camera denied recovery/account/chữ200%, nhập DATE/manual, mốc ngày,
  chọn đúng loại hàng và KPH tap behavior.
- [Browser cache trước](upgrade-before.json) → [sau](upgrade-after.json): profile
  tổng hợp đã cache PWA cũ; click Cập nhật chuyển từ index-B9sUm9cO.js sang đúng
  index-iBNvdpwW.js, không yêu cầu khách xóa dữ liệu browser.
- URL chính và URL cố định đều HTTP200; HTML bytes bằng artifact local,
  SHA256 `e6295d7dbc1c858ffbe360ad658388b9f464455674771126748b70bda33f8b6f`.
  Header công khai có `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow, noarchive`.

Scripts kiểm được lưu tại `e2e/scripts/check-published-mock.cjs` và
`e2e/scripts/check-mock-update.cjs`; tái dùng `check-polish03.cjs`,
`check-date05-manual.cjs`. NODE_PATH trỏ e2e/node_modules đã cài của repo trong
lượt này; không thêm dependency/lockfile. Lượt smoke đầu dùng selector bản cũ
bị search popover mới che CTA; sửa script đóng menu bằng Escape rồi chạy lại PASS,
không sửa UI hoặc force click. Loopback server cần quyền bind ngoài sandbox;
không có process khác bị dừng.

Lệnh publish chạy sau push receipt và local smoke PASS:

```sh
node /Users/vup/.npm/_npx/32026684e21afda6/node_modules/wrangler/bin/wrangler.js pages deploy site --project-name coopfood-demo-20261021 --branch demo --commit-hash c7cc93910664dad66e2652a55cad76b8d53b4e4a --commit-message 'Publish completed POLISH03 Store App mock 2026-10-31' --commit-dirty=false
```

Exit0. Deployment list xác nhận Production/demo/c7cc939. Existing Pages project,
không tạo project/domain/hosting mới. Có thể quay lại deployment72c8cc2c qua
Cloudflare Pages; không xóa deployment cũ. GitHub Pages protected branch/tag giữ
nguyên, không triển khai backend hay merge main.

## Giới hạn và bước tiếp

Đây là bản UI mock đầy đủ theo candidate hiện có, dùng fixture tổng hợp. KPH,
DATE/nhắc chỉ trong phiên và thay đổi mất khi tải lại; báo cáo theo giới hạn mock
hiện có. Camera phần cứng, HEIC theo thiết bị và backend/production data chưa
nghiệm thu. Không coi việc owner yêu cầu publish là acceptance của từng candidate.

Khách đã mở bản cũ: chọn **Cập nhật** nếu app báo Có phiên bản mới, sau khi lưu
xong nội dung đang nhập. Link deployment cố định dùng được để đối chiếu bản mới.
Sau khi khách xem, bước nhỏ tiếp là chọn candidate UI này làm đầu vào tích hợp
backend, giữ nguyên workflow, scope và các kiểm tra D01; chưa tự nối thêm trong lượt này.

Chỉ thêm scripts kiểm và hồ sơ release/CURRENT_STATE/NEXT trên branch xuất bản;
không sửa source UI. Logs/screenshots tổng hợp ở `/tmp/coopfood-pub01-*`, không
commit dữ liệu vận hành hoặc raw credential/runtime logs.
