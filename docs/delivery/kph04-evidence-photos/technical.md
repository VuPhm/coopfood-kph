# KPH04 revision2 — frontend stamping và chọn toàn item

Checkpoint30/10/2026. Technical PASS; owner visual acceptance pending.
Runtime source `889b3ffb0e4d55430160ac4d19b2ec8284abc7c6`.
Preview mock mới <http://127.0.0.1:4396/#kph> tránh service worker của4394.
Cùng nhánh `store-app/kph04-evidence-photos`, worktree
`/Users/vup/.codex/worktrees/kph04-evidence-photos/coopfood-kph`, root sole writer,
base `c2ac210b88331ca2ab54032766e4f82fc7a7512e`. Không merge/push/deploy.

Owner yêu cầu: cho phép đóng dấu frontend dù trước đó bắt buộc server, sửa vùng
chọn chưa phủ item, hoàn tất thì checkpoint. Đây là revision2 cùng task; hồ sơ
r1 tại [technical-r1](technical-r1.md). Yêu cầu này cho phép mở optional API
nhận derivative; không suy nghiệm thu hình ảnh hoặc quyền deploy.

## Kết quả

Form online cũng chạy processor frontend trước khi preview/gửi, giữ original
File riêng. Multipart gửi `photos` gốc và `stampedPhotos` JPEG theo cùng ordinal.
Server nhận và lưu đúng bytes JPEG frontend, không đóng tem lần hai. Client cũ
không gửi derivative vẫn dùng server stamping. Không migration hoặc dependency mới.

Server kiểm tra đủ cặp, MIME thực JPEG, tối đa1MiB/1280×720, no-upscale và tỷ lệ
với dung sai làm tròn trước khi lưu. Kiểm tra envelope trước decode derivative.
Original/stamped đều private, audit/store authorization vẫn ở server; EXIF gốc
vẫn ưu tiên cho capturedAt. Frontend và backend fingerprint cả bytes derivative
để retry không dùng chung key với ảnh đã thay đổi. Watermark client không được
coi là chứng thực mật mã. [Ví dụ API](../../../contracts/fixtures/api/kph-create-multipart.md).

Trong Chọn, bấm tên/metadata/nhãn/khoảng trống/ô đầu/chevron của item mobile hay
hàng desktop đều chọn/bỏ chọn một lần; không mở nhầm chi tiết. Checkbox native
và keyboard vẫn hoạt động, tên có aria-pressed. Xong trả lại mở chi tiết;
nhóm ngày vẫn tách chọn với thu/mở, strip tag giữ cuộn native.

## File

- `apps/store-pwa/src/create-record-dialog.tsx`: frontend xử lý ảnh cho cả online.
- `online-kph.ts` trong cùng thư mục: gửi cặp bytes, signature gồm cả hai.
- `store-kph-list.tsx`, `store-kph-selection.css`: vùng chọn cả item/hàng.
- `create-record-dialog.test.tsx`, `online-kph.test.ts`, `app.online.identity.test.tsx`,
  `store-create-review.test.tsx`, `store-kph-label.test.tsx`,
  `store-kph-full-selection.test.tsx`: regression mới và cập nhật semantics/mock
  canvas trong JSDOM; giữ nguyên kiểm tra session/store/lookup/retry.
- `backend/src/main/java/vn/coopfood/kph/kph/`:
  `KphController.java`, `KphService.java`, `LocalPrivateMediaStorage.java`:
  optional part/validation/private media/fingerprint. Cùng package trong test:
  `KphHttpIntegrationTest.java`, `LocalPrivateMediaStorageTest.java`.
- `contracts/openapi/kph.openapi.yaml`, multipart example bên trên và
  `packages/api/src/generated/schema.d.ts` đổi cùng slice.
- `docs/product/DOMAIN_RULES.md`, `STORE_APP_CONTRACTS.md`,
  `KPH_COMPACT_HISTORY.md`, CURRENT_STATE/NEXT: ghi quyết định/phạm vi mới.
- `e2e/scripts/check-kph-full-selection.cjs`,
  `check-kph-frontend-stamp-online.cjs`: browser gate mới, ảnh tổng hợp.

## Kiểm tra

Tại worktree trên:

```sh
npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2
npm run check
npm run check:contracts
npm run check:docs
npm run check:api
VITE_STORE_APP_MOCK=false VITE_KPH_ONLINE=true npm run build --workspace @coopfood-kph/store-pwa -- --outDir /tmp/kph04-r2-online-dist --emptyOutDir
VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa
(cd backend && JAVA_HOME=/Users/vup/Library/Java/JavaVirtualMachines/temurin-21.0.11/Contents/Home ./mvnw -q test)
STORE_PREVIEW_URL=http://127.0.0.1:4394 STORE_SELECTION_OUTPUT=/tmp/kph04-r2-selection node e2e/scripts/check-kph-full-selection.cjs
STORE_PREVIEW_URL=http://127.0.0.1:4394 STORE_PHOTO_OUTPUT=/tmp/kph04-r2-photos node e2e/scripts/check-kph-evidence-photos.cjs
STORE_ONLINE_URL=http://127.0.0.1:4397 STORE_ONLINE_OUTPUT=/tmp/kph04-r2-online node e2e/scripts/check-kph-frontend-stamp-online.cjs
git diff --check
```

[45files/307Store tests PASS](unit-r2-output.txt), [types toàn workspace PASS](types-r2-output.txt),
[generated client không drift](api-r2-output.txt). Admin dependency link được
bổ sung để dùng dependency đã có, không install/lockfile mới. Contracts PASS
23manifest resources/15API fixtures; docs PASS. Online/mock builds PASS92/122
precache; cảnh báo Excel chunk lớn đã có trước.

[Backend68tests PASS/0skip](backend-r2-results.json), Java21 + PostgreSQL17 thật:
frontend JPEG được giữ nguyên/private, original nguyên bytes, mismatch count,
PNG giả JPEG/oversize/upscale/sai tỷ lệ, replay/same-key changed derivative,
unauthenticated/cross-store; suite hiện có vẫn kiểm cross-region/chain scope,
legacy server-stamp fallback và rollback. Không lưu raw backend log có password
phát sinh từ cấu hình test vào repo.

[Browser online390/1440 PASS](online-r2-results.json): frontend decode/đóng dấu
thật, multipart giữ PNG original, JPEG bằng preview, backend serve cùng SHA256,
private/no-store, reload còn phiếu. Backend jar build từ candidate, chạy8086,
PostgreSQL tạm55434 nạp `e2e/seed/foundation-01.sql`; online build4397 proxy8086.
Runtime và container tổng hợp do task tạo đã thu hồi sau kiểm tra; không đụng
runtime khác. Có thể dùng runtime online acceptance sẵn có và đổi
STORE_ONLINE_URL để chạy lại script.

[Selection390/1440/320 PASS](selection-r2-results.json):8điểm bấm quanh mỗi
item, native checkbox/Space/Enter không toggle hai lần, thoát bằng keyboard và
mở detail bình thường. [Ảnh/Excel4viewport PASS](photo-r2-results.json): resize,
JPEG/tem, lens, xóa/bổ sung/thứ tự/bytes workbook, chữ200%, lỗi và stale cancel.
Đã xem screenshot selection mobile/desktop tại `/tmp/kph04-r2-selection`.

Cold form6ca CPU6x của [r1](create-panel-results.json) được tái sử dụng: mock
host vẫn cùng processor, geometry/skeleton/chrome/lifecycle không đổi trong r2;
selection CSS chỉ tác động item. Online processing mới được kiểm riêng bằng
browser real backend và unit/retry/session/store tests. Không nới assertion hoặc
tắt test/bảo mật để làm xanh.

## Giới hạn và điểm dừng

Preview4396 là mock theo phiên, tem context mẫu; reload mất dữ liệu mới. Online
paired upload cần deploy frontend/backend của cùng slice (chưa deploy). HEIC
online vẫn theo giới hạn decoder backend; Pilot/mock tùy thiết bị. Chưa kiểm
camera/quyền OS/iPhone thật. Không thay scope/thẩm quyền, Pages hoặc persistence
mock. Không thêm crop/editor hoặc upload ra dịch vụ ngoài.

Checkpoint hoàn tất phạm vi được giao; dừng ở đây. Bước nhỏ tiếp: owner thử
bấm vùng trống và tên khi Chọn, xem ảnh đóng dấu tại4396; không cần mở thêm
vòng audit hoặc suy acceptance từ việc có checkpoint.
