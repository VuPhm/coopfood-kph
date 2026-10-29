# KPH04 — ảnh minh chứng và đóng dấu từ Pilot

Technical PASS ngày30/10/2026; owner visual acceptance pending.
Preview mock: <http://127.0.0.1:4394/#kph>.
Candidate `9830c69ccf07fc406849795a108375d0e60da1d4`, revision1.

## Phạm vi và nguồn

Root sole writer, không dispatch agent. Nhánh `store-app/kph04-evidence-photos`,
worktree `/Users/vup/.codex/worktrees/kph04-evidence-photos/coopfood-kph`, base
`c2ac210b88331ca2ab54032766e4f82fc7a7512e`. KPH03, DATE04r2 và NOTIF01 chưa
được suy nghiệm thu từ yêu cầu này. Chưa merge/push/deploy.

So sánh read-only với Pilot `codex/github-pages-pwa` tại
`1f93377ad85e36d79080faa34b5115ebb30c3e58` và tag bảo tồn `c789714`.
Bộ xử lý/tem Pilot đã có trong source hiện tại; host Store Fresh truyền
`onlineMode`, khiến form bỏ qua processor và xem ảnh gốc. Bỏ flag này riêng
ở host mock để dùng nhánh xử lý Pilot thật. Online entry vẫn truyền onlineMode
và gửi original, backend tiếp tục đóng dấu theo contract. Không sửa nhánh Pages.

Giữ processor hiện có: no-upscale trong1280×720, JPEG với target550KiB và quality
floor.54 của Store (không lùi về420KiB của Pilot). Timestamp theo fixture
EXIF → lastModified → controlled clock; tem góc dưới trái hiển thị giờ/thứ/ngày
và mã/tên cửa hàng theo Asia/Ho_Chi_Minh. Không đổi rule hoặc API.

## Hành vi

- Chụp bằng native capture môi trường hoặc chọn nhiều ảnh; tối đa3, ít nhất1,
  giữ thứ tự. Ảnh được xử lý tuần tự, có trạng thái chờ và chặn gửi lúc xử lý.
- Preview là JPEG đã đóng tem. Xem nhiều ảnh, trước/sau, soi bằng chuột hoặc
  chạm giữ; xóa ảnh nháp rồi bổ sung tiếp. Xem lại/chi tiết đã lưu không cho xóa.
- Gallery chi tiết dùng cùng viewer; sửa fit ảnh theo tỷ lệ thật để lens không
  soi lệch vùng do letterbox. Khi đổi ảnh, lens được ẩn. Header/footer tự nở
  ở chữ lớn, ảnh dùng phần còn lại của viewport.
- Lưu snapshot giữ stamped blob, original File riêng và capturedAt trong bộ nhớ;
  URL draft được thu hồi, URL phiếu sống đến khi StoreApp unmount. Excel dùng
  đúng stamped blob theo thứ tự đã xem, không dùng ảnh gốc thay thế.
- Decode lỗi giữ draft/chọn lại; đóng khi xử lý rồi mở phiếu mới không nhận ảnh
  muộn. Mang cleanup img fallback/canvas trung gian từ Pilot, đóng bitmap và
  giải phóng canvas đầu/cuối cả đường thành công/lỗi.

## File đã đổi

Trong `apps/store-pwa/src/`:

| File | Mục đích |
| --- | --- |
| `store-kph-create-control.tsx` | Nối nhánh xử lý Pilot cho host mock, dùng cả DATE→KPH. |
| `create-record-dialog.tsx`, `store-kph-loading.tsx` | Hướng dẫn tự đóng dấu giống nhau ở form/skeleton. |
| `image-processing.ts`, `image-processing.test.ts` | Cleanup tài nguyên kế thừa Pilot; fixture và xác minh canvas được giải phóng. |
| `image-viewer.tsx`, `store-app.css` | Ẩn lens khi đổi ảnh, fit ảnh đúng tỷ lệ, header/footer chữ lớn. |
| `record-view.ts`, `store-kph-draft-record.ts` | Giữ original/capturedAt riêng với stamped trong phiên. |
| `store-kph-workspace.tsx` | Gallery chi tiết có trước/sau, chỉ đọc. |
| `store-kph-photos.test.tsx` | Host đi qua processor, xóa/giữ thứ tự và snapshot tách original/stamped. |

`e2e/scripts/check-kph-evidence-photos.cjs`: real-browser decode/tem/viewer/Excel,
ảnh tổng hợp, test lỗi/hủy. CURRENT_STATE/NEXT ghi candidate này.

## Kiểm tra và output

```sh
npm run check --workspace @coopfood-kph/store-pwa
npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2
npm run test --workspace @coopfood-kph/store-pwa -- src/image-processing.test.ts --maxWorkers=2
VITE_STORE_APP_MOCK=false npm run build --workspace @coopfood-kph/store-pwa
VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa
STORE_PREVIEW_URL=http://127.0.0.1:4394 STORE_PHOTO_OUTPUT=/tmp/kph04-evidence node e2e/scripts/check-kph-evidence-photos.cjs
STORE_PREVIEW_URL=http://127.0.0.1:4394 STORE_CREATE_OUTPUT=/tmp/kph04-create-panel node e2e/scripts/check-kph-create-panel.cjs
npm run check:docs
git diff --check
```

TypeScript PASS (cả lệnh check và build). [Full44files/304tests PASS](unit-output.txt).
Sau khi bổ sung assertion canvas cleanup, [targeted11tests PASS](processing-output.txt);
không đổi runtime sau full suite. Có test online giữ nguyên bytes JPEG để upload,
từ chối HEIC online và DATE→KPH retry. Không tuyên bố đã chạy backend E2E mới.

Build online92/mock122precache PASS. ExcelJS vẫn có cảnh báo chunk>500kB đã có
trước. Không dependency/lockfile mới. Chunks xử lý EXIF/Excel vẫn deferred.

[Photo gate PASS](photo-results.json)390×844,1440×1024,320×740,844×390:
ảnh1920×1080 →1280×720,900×1600 →405×720,600×400 giữ600×400; JPEG thật và
các chữ tem thực được vẽ. Chọn/quá3/xóa/bổ sung bằng capture input, lens chuột
và touch, xem lại/gửi/chi tiết chỉ đọc, chữ200%, lỗi decode/retry và stale cancel
đều đạt. Workbook tải thực có3 ảnh với SHA256 khớp JPEG preview, đúng thứ tự
sau xóa/thêm lại, đúng tên hàng. Không có pageerror. PNG/JPEG tổng hợp tại
`/tmp/kph04-evidence`; đã xem trực tiếp tem, form và gallery/lens/chữ lớn.

[Cold form gate6ca PASS](create-panel-results.json)390/1440/320 × motion/reduce,
CPU6x: skeleton/ready geometry≤1px, một entrance, draft/ảnh/xem lại/resize/
hủy/gửi/focus đạt. [Output](create-panel-output.txt), ảnh tại
`/tmp/kph04-create-panel`. Tái sử dụng gate hiện có; không nới assertion.

## Giới hạn thực và bước thử

Đây là Store Fresh mock trong phiên: reload làm mất phiếu/ảnh mới, tem dùng
context mẫu `0001 — Cửa hàng mẫu`. Không thêm IndexedDB hoặc đưa policy chỉ
lưu stamped của Pilot sang online. Original/stamped chỉ ở bộ nhớ/object URL
của phiên, không upload ảnh lên dịch vụ ngoài.

HEIC dùng decoder trình duyệt/thiết bị như Pilot; không thêm converter HEIC
phổ quát. Headless đã kiểm native capture input bằng file tổng hợp, chưa kiểm
quyền OS/camera/iPhone thật. Lab CPU6x không là bảo đảm hiệu năng thiết bị thật.

Bước nhỏ tiếp: owner chọn ảnh ngang/dọc trên4394, chạm ảnh xem tem/soi, xóa
một ảnh rồi thêm lại; gửi/duyệt và xuất Excel để đối chiếu. Owner acceptance
còn pending; technical PASS không thay nghiệm thu hình ảnh/thiết bị.
