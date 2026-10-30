# SEARCH02 — grouped discovery và search thống nhất

Technical PASS, owner acceptance pending. Preview <http://127.0.0.1:4400/#date>
và <http://127.0.0.1:4400/#kph>. Nhánh `store-app/search02-grouped-discovery`,
base `2cb92b73b0e9c509c42f3dbfd763b28321d6b179`, root sole writer. Candidate
source SHA trong [plan](plan.json). Không merge/push/deploy.

## Kết quả/file

- `apps/store-pwa/src/store-search-field.tsx` và `.css`: shared nhóm gợi ý,
  recent history, counts/empty/clear, scan trong ô, keyboard và native top layer.
  Không thêm thư viện; danh sách chỉ render tối đa5mục/nhóm, history tối đa5.
  Query chỉ trong memory của field; không network suggest, không lưu/log.
- `store-date-workspace.tsx`: scan chuyển vào input, nhóm lô đang theo dõi/đã
  ghi nhận, tìm theo SKU/barcode/tên/mã lô. Chọn vẫn exact lookup.
- `store-kph-workspace.tsx`: hai nhóm loại hàng, giữ scope ngày/approval và
  chuyển đúng tab khi chọn SKU; main list/filter/workflow không đổi.
- `store-date-intake.tsx`: lookup scan trong input; gợi ý catalog phải qua
  lookupProduct, không tự suy sản phẩm. Tự nhập/scan giữ draft như DATE05.
- `store-date-report.tsx`, `store-report-hub.tsx`: gợi ý lô trong kỳ/snapshot
  và báo cáo đã tạo; tìm không mất chọn lô, ngày chốt dd/mm/yyyy.
- `store-choice-sheet.tsx`: cùng field, nhóm lựa chọn; chọn gợi ý chỉ thu gọn
  kết quả, vẫn cần chọn radio và Apply theo contract hiện có.
- `store-search-field.test.tsx`, `e2e/scripts/check-search02.cjs`: kiểm tra
  history/results/clear/scan/Escape/reopen/lookup và tương tác thực Chromium.
- `docs/product/STORE_SEARCH_DISCOVERY.md`, CURRENT_STATE/NEXT và hồ sơ này:
  quyết định, phạm vi, bằng chứng.

## Kiểm tra

macOS/Node26, Vitest4.1.10, Playwright headless Chromium. Preview mock port4400,
service workers bị block trong browser gate; camera denied được mô phỏng.

| Lệnh | Kết quả |
| --- | --- |
| `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2` | PASS46files/313tests sau shared integration |
| `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2 src/store-search-field.test.tsx src/store-choice-sheet.test.tsx src/store-date-intake.test.tsx src/store-date-lookup.test.tsx` | PASS4files/16tests sau hoàn thiện Enter/reopen/resize |
| `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa` | PASS TypeScript +120precache |
| `VITE_STORE_APP_MOCK=false npm run build --workspace @coopfood-kph/store-pwa -- --outDir /tmp/search02-online-build` | PASS TypeScript +92precache |
| `node e2e/scripts/check-search02.cjs` | PASS390×844,1440×1024,320×740 trên build cuối |
| `npm run check:docs`, `git diff --check` | PASS |

Full suite313 được chạy trước các patch cuối Enter/reopen/ResizeObserver và
format ngày; targeted16 + TypeScript/build + browser gate chạy sau các patch.
Không sửa timeout/assertions để làm xanh. Lượt đầu fail do gợi ý thêm role=status
trùng thông báo nghiệp vụ; sửa thành aria-live riêng rồi full suite đạt.
Browser phát hiện gợi ý bị surface che và tap lại field đã focus không mở;
đã sửa top layer và onClick, thêm regression. Ca test font200 ban đầu chọn sai
region/không mở lại menu; gate cuối đo đúng panel và input cùng context.

Browser checks: nhóm/count, không dịch surface khi focus, top-layer hit test,
chọn giữ0đầu, history/xóa riêng, empty/Escape giữ query, scan recovery giữ query,
lookup gợi ý trong DATE intake, KPH ArrowDown/Enter và đổi tab, tìm lô report →
tạo/lưu → tìm báo cáo trong history, font200 và bounds; không pageerror/overflow.
[Kết quả](browser-results.json), screenshots `/tmp/search02/`, log
`/tmp/search02-tests-final.txt`, `/tmp/search02-final-targeted.txt`,
`/tmp/search02-build.txt`, `/tmp/search02-online.txt`, `/tmp/search02-browser.txt`.

## Giới hạn/tiếp theo

Chưa kiểm thiết bị thật/OS camera hoặc browser cũ thiếu native popover; fallback
absolute chưa bảo đảm không bị ancestor clip. Full-feature gate trên Chromium.
History chỉ theo field đang mount, rời màn/reload mất; DATE vẫn mock trong phiên.
Không API/backend/authorization/media changes. DATE05 source2cb92b7 giữ nguyên
ràng buộc ngày, private photos/stamping; không suy owner acceptance từ task này.

Bước nhỏ tiếp: owner focus ô DATE/KPH, xem nhóm trống/có query/recent và thử scan
trong ô tại4400; rồi xem gợi ý trong lookup intake và báo cáo/history.
