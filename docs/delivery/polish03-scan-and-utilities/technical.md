# POLISH03 — hai vòng icon quét và tiện ích

Technical PASS; owner acceptance pending. Preview <http://127.0.0.1:4402/#home>
và <http://127.0.0.1:4402/#date>. Branch `store-app/polish03-scan-and-utilities`,
base `6565972`, worktree riêng, root sole writer. Candidate SHA ghi trong plan.
Không merge/push/deploy, không suy nghiệm thu SEARCH02/DATE05 từ yêu cầu này.

## Vòng1 — icon quét

Checkpoint `59dc42c`. `store-scan-icon.tsx` dùng Lucide ScanBarcode20px,
stroke1.8, aria-hidden; label ngữ cảnh thuộc button. Search DATE, intake tự
nhập/lookup và KPH Fresh dùng cùng glyph. Khung ngắm camera vẫn là khung ngắm,
không phải icon hành động. Scanner header/success Fresh tái sử dụng glyph với
kích thước ngữ cảnh. Default dialog Pilot vẫn glyph cũ; không rollout Pilot.

Files: `store-scan-icon.tsx`, `store-search-field.tsx`, `store-date-intake.tsx`,
`create-record-dialog.tsx`, `barcode-scanner-dialog.tsx`, `store-utility-polish.css`.

Kiểm:4files/45tests scanner/create/search/intake PASS; Store TypeScript PASS.
Không đổi callback scan, supported formats, decode loop, stream cleanup,
exact lookup, date rules hoặc ảnh/stamping/upload.

## Vòng2 — rà vùng cũ và tối ưu

| Vùng rà | Evidence/quyết định |
| --- | --- |
| Account sheet/trigger | File sheet cuối đổi22/10 ởaf425bb; hero lớn, vai trò ghi cứng. Gom identity ngang, avatar56, tên20, phần store/action rõ nhóm; dùng metadata role thay ghi cứng và trả focus preventScroll. |
| Scanner recovery/footer | File có sửa geometry30/10 nhưng control36px/font12 và palette legacy vẫn còn. Fresh opt-in class, message14px, button≥44px, mặt nền Store; màn thấp bỏ icon trang trí để nút retry hiện trọn. Video và guide giữ nguyên. |
| Login | Đã theo frame/form Store, không tìm thấy lỗi cần sửa trong scope; không đổi xác thực. |
| Settings legacy | Ngoài entry Store đang làm; không kéo rollout vào Pilot vì có code cũ. |

Role hiển thị dùng đúng StoreProfile: STORE_MANAGER → Quản lý cửa hàng,
STAFF → Nhân viên, trống → Chưa có vai trò. Đây là nhãn UI, không quyết định
quyền. Không thêm trường hồ sơ/PII và không đổi profile schema/backend.

Files vòng2: `barcode-scanner-dialog.tsx`, `store-account-sheet.tsx`,
`store-account-trigger.tsx`, `store-header.css`, `store-utility-polish.css`,
`store-account-identity.test.tsx`, `e2e/scripts/check-polish03.cjs`, docs.

## Kiểm tra cuối

Local macOS/Node26, Vitest4.1.10, Playwright headless Chromium.

| Lệnh | Kết quả |
| --- | --- |
| `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2 src/barcode-scanner-dialog.test.tsx src/store-account-identity.test.tsx src/store-app.test.tsx src/create-record-dialog.test.tsx` | PASS4files/48tests |
| `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2` | PASS47files/315tests |
| `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa` | PASS TypeScript +120precache |
| `VITE_STORE_APP_MOCK=false npm run build --workspace @coopfood-kph/store-pwa -- --outDir /tmp/polish03-online-build` | PASS TypeScript +92precache |
| `node e2e/scripts/check-polish03.cjs` | PASS390×844,1440×1024,320×740,844×390 |
| `npm run check:docs`, `git diff --check` | PASS |

Full315/online build trước patch CSS cuối cho retry landscape; mock build và
browser chạy sau patch, không JS nào đổi sau unit suite. Browser so sánh cùng
SVG path/size ở DATE/intake/KPH, hit≥44, retry permission-error, giữ draft SKU0đầu,
khôi phục manual, account bounds/chữ200/focus; không pageerror. Gate bắt đúng
accessible name Tạo phiếu TP tươi sống/Mã SKU / UPC. Screenshot review phát hiện
retry bị cắt ở landscape dù vẫn scroll-click được: đã compact error và thêm
assert ratio1 để kiểm hiển thị trọn.

[Kết quả browser](browser-results.json). Screenshots `/tmp/polish03/`;
logs `/tmp/polish03-round1.txt`, `/tmp/polish03-round2.txt`,
`/tmp/polish03-tests.txt`, `/tmp/polish03-build.txt`, `/tmp/polish03-online.txt`,
`/tmp/polish03-browser.txt`. Build có cảnh báo chunk lớn đã tồn tại; không thêm
thư viện hoặc lockfile. Backend/API/authorization không đổi nên không chạy lại
backend suite; media evidence KPH04 và search gate SEARCH02 vẫn ở checkpoint base.

## Giới hạn và bước nhỏ tiếp

Camera permission/denied được mô phỏng trong Chromium, chưa camera/torch thiết
bị thật. Account vẫn dữ liệu mock trong bản preview. Hai vòng đã hoàn tất kỹ
thuật; dừng rà rộng, chờ owner xem icon ở KPH/DATE và account tại4402. Những
vùng legacy ngoài Store chỉ ghi audit, không tự mở thêm vòng hoặc đổi policy.
