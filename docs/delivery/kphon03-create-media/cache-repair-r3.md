# KPHON03 revision3 — ưu tiên SW/trang cũ

13/11/2026. Owner báo “giao diện bị sai và hao hụt”, xác nhận cả Store/Admin;
sau đó chỉ đạo “fix lỗi bị neo sw hoặc trang cũ trước”. Reopen feedback UI,
chưa kết luận layout đúng và không triển khai layout repair trong lượt ưu tiên này.

Candidate `7908acaef234cf629c5fff212be613bd959e272d`. Source79f54b3 sạch lúc bắt đầu. Preview4173/4175/backend8082 đã dừng;
Docker cũng tắt. Khởi động lại OrbStack và đúng container synthetic KPHON02,
backend jar KPHON01/media cũ và preview từ KPHON03. Không seed/reset.

Inspection: Admin chỉ retire /sw.js; Store chưa có bảo vệ preview tương đương.
Worker ở URL tùy chỉnh vẫn có thể giữ shell cũ. Cache headers đơn thuần không
đưa request navigation qua server khi worker đang trả HTML cũ.

## Sửa trong phạm vi cache/local preview

- `tooling/vite/preview-freshness.mjs` (Node utility, `.d.mts` export type):
  hai consumer Vite thật dùng chung. Worker update request được nhận diện bằng
  header Service-Worker, kể cả script path cũ tùy chỉnh; root sw.js/dev-sw.js
  cũng được thay bằng retirement worker. Skip waiting/claim/unregister/reload
  theo lifecycle browser, không xóa CacheStorage/IndexedDB/cookie/storage.
- HTML local dev/preview có marker + bootstrap retire registration còn lại;
  Cache-Control:no-store. Vite built preview dùng HTML mới có bootstrap nhưng
  không sửa index.html hoặc sw.js trong dist. Normal assets và business API
  giữ handler cũ; API path luôn bypass recovery middleware.
- Admin giữ entry plugin cũ, dùng helper chung. Store thêm plugin và PwaStatus
  không register lại worker khi có local-preview marker, tránh reload loop
  trong built preview. Production HTML không có marker/bootstrap, Workbox
  worker vẫn thật; prompt-update/offline policy production/Pilot không đổi.
- Không đổi layout/component composition, session/create/idempotency/history,
  backend/API/contracts hoặc root dependency/lockfile. UI report chưa khép.

## Kiểm tra thực tế

```sh
npm run check -w @coopfood-kph/store-pwa
npm run check -w @coopfood-kph/admin-web
node --check tooling/vite/preview-freshness.mjs
node --test tooling/vite/preview-freshness.test.mjs
npm run test -w @coopfood-kph/store-pwa -- src/pwa-status.test.tsx
npm run build -w @coopfood-kph/admin-web
VITE_STORE_APP_MOCK=true npm run build -w @coopfood-kph/store-pwa
# Start built Store4182/Admin4183 via vite preview, then:
node e2e/scripts/check-preview-freshness.cjs
node e2e/scripts/check-admin02-old-worker.cjs
VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true VITE_KPH_ONLINE=true npm run build -w @coopfood-kph/store-pwa
ADMIN_PREVIEW_URL=http://127.0.0.1:4175 STORE_PREVIEW_URL=http://127.0.0.1:4173 GREEN_CHECK_OUTPUT=.local/verification/kphon03-r3-chrome node e2e/scripts/check-integrated-green-header.cjs
npm run check:docs
git diff --check
```

PASS5 PwaStatus component tests, gồm production prompt cũ và local preview không
register. PASS2 Node tests: production HTML không bị inject và API request không
bị recovery handler bắt. Typechecks/Admin+Store mock+online builds PASS; online92
precache entries. Production HTML/Workbox artifacts được check không có retirement
bootstrap/unregister code. Warning ExcelJS chunk của mock vẫn giữ nguyên.

Playwright Chromium **8 stale-worker cases PASS**, cache bật, không hard reload,
không Clear site data, không route API mocks:

1. Admin dev root worker.
2. Admin dev custom worker URL/query.
3. Store dev root worker.
4. Store dev custom worker URL/query.
5. Admin cached page không còn script register/update worker.
6. Store cached page không còn script register/update worker.
7. Admin production-build preview custom worker.
8. Store mock production-build preview custom worker (kiểm không re-register loop).

Mỗi ca dựng origin cũ có worker thật đang control và shell “Stale shell”, sau
đó forward tới preview thật; reload thường khôi phục app hiện hành. Worker
registration/controller không còn, thêm2 reload thường ổn định và không lặp
navigation. IndexedDB record, localStorage, sessionStorage, cookie và CacheStorage
sentinels giữ nguyên từng byte/string. HTML/SW trả no-store, custom worker JS
trả đúng MIME. Mobile390×844/Desktop1440×1024 tùy case; ảnh recovery đã xem.

Admin old-worker regression script cũ PASS. Real backend smoke sau cold restart
PASS Store390/1440 login/scope/barcode/D01/account/focus và Admin1440 memberships.
Không seed/reset hay create records trong lượt cache fix. Helper cuối bổ sung
API bypass rõ ràng;2 Node cases kiểm trực tiếp helper này và cold-start canonical
smoke kiểm lại routing/API thật. Worker retirement/HTML recovery path không đổi.

118 tests và create/media/retry browser của revision2 tạif842e0c vẫn là evidence
source cũ được reuse cho phần business code không thay; không tính là test mới
hoặc chứng minh UI đã đúng.9 backend tests từ837720e không bị ảnh hưởng. Không
chạy lại fullverify hoặc hai vòng test/UIUX cuối trong lượt cache repair.

## Runtime/artifacts và trạng thái

Store4173, Admin4175, backend8082 được cold-start từ đúng nguồn KPHON03 sau sửa,
không dựa vào module cache/HMR của lần trước. DB55434/private media KPHON02 cũ
được giữ. Các preview tạm4181/4182/4183 của chính task đã dừng; không dừng process
của task khác. Raw logs/screenshots/results tại `.local/verification/preview-freshness/`
và `.local/verification/kphon03-r3-chrome/` (gitignored).

Owner cần reload thường đúng Store4173/Admin4175 để browser hiện có lấy phiên bản
hiện hành. Đây là cache repair kỹ thuật, chưa kiểm trực tiếp profile browser của
owner; không tuyên bố đã unregister SW trên máy/profile của owner từ test context.

UI report còn mở; cache recovery không tự thành nghiệm thu UI.
