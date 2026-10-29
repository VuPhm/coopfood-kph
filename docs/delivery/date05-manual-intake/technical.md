# DATE05 — nhập thủ công và vùng tap KPH

Technical PASS; owner acceptance pending. Runtime source `ffecd38434d8071da729c0d0ae3dfba35b897600`;
[plan](plan.json). Preview <http://127.0.0.1:4398/#date> và
<http://127.0.0.1:4398/#kph>. Nhánh `store-app/date05-manual-intake`, worktree
`/Users/vup/.codex/worktrees/date05-manual-intake/coopfood-kph`, base
`f9e60d33e5b4d0323ee4b99325628f7a758de506`, root sole writer. Không merge/push/deploy.

## Kết quả và quyết định

- KPH: tag Tình trạng/Biện pháp/Duyệt, thông tin và đệm dưới đều mở phiếu ở
  chế độ xem. Cùng vùng chọn/bỏ chọn đúng một lần ở chế độ Chọn; button/input/
  label giữ semantics riêng. Native swipe tag không mở phiếu hoặc chọn nhầm.
- Focus bàn phím vẫn cuộn để lộ control sau thanh loại hàng sticky. Pointer
  focus không tự cuộn: tránh dịch nút Chọn giữa pointerdown và click ở320px.
- DATE mặc định Tự nhập; SKU/barcode chung hàng, tên riêng. Shared Select có
  placeholder và đúng hai lựa chọn TP khô & khác / TP tươi sống. Bắt buộc chọn
  loại cho lô mới; lịch sử chưa phân loại giữ nguyên. Các Select có option giá
  trị rỗng (Tất cả) vẫn giữ semantics cũ.
- Scan trong Tự nhập cập nhật barcode, giữ SKU/tên/loại/NSX/HSD và không lookup.
  Tra mã hàng vẫn dùng exact lookup, provenance và recovery hiện có.
- Chỉ NSX/HSD đã đủ để hiện mốc/%; dùng chung `assessDateLot` và
  `remainingShelfPercent`, không tạo công thức mới. Ngày sai bỏ kết quả cũ;
  ngắn dưới10ngày/đã hết hạn/NSX tương lai giữ rule chung. % nhỏ14px.
- Mã lô tùy chọn thu trong details sau mốc. Giảm control từ52xuống44px, giữ
  text200% tự tăng chiều cao; mốc ở390×844 nằm trọn trước footer.
- Scanner dùng vùng video co theo chiều cao, header/footer không co; nội dung
  lỗi tự cuộn. Ở844×390 lỗi camera không phủ nút Nhập mã thủ công.

## File thay đổi

| Nhóm | File |
| --- | --- |
| DATE UI | `apps/store-pwa/src/store-date-intake.tsx`, `store-date-intake.css` |
| Validation/coverage | `apps/store-pwa/src/store-date-intake-model.ts`, `store-date-intake-model.test.ts`, `store-date-intake.test.tsx` |
| KPH tap | `apps/store-pwa/src/store-kph-list.tsx`, `store-kph-items.css`, `store-kph-full-selection.test.tsx` |
| Focus chung | `apps/store-pwa/src/store-sticky-tabs.tsx` |
| Scanner layout | `apps/store-pwa/src/barcode-scanner-dialog.tsx`, `styles.css` |
| Choice có sẵn | `packages/ui/src/select.tsx`, `select.test.tsx` |
| Browser gates | `e2e/scripts/check-date05-manual.cjs`, `check-kph-tap-regions.cjs` |
| Trạng thái/proposal | `docs/CURRENT_STATE.md`, `docs/NEXT.md`, `docs/product/DATE_INTAKE_PROPOSAL.md`, hồ sơ DATE05 |

## Lệnh và kết quả

Runtime local macOS, Node26, Vitest4.1.10, Playwright headless Chromium.
Không tắt test, tăng timeout, thêm dependency hoặc sửa lockfile.

| Lệnh | Kết quả |
| --- | --- |
| `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2` | PASS45files/311tests |
| `npm run test --workspace @coopfood-kph/ui` | PASS7files/17tests |
| `npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2 src/store-kph-workspace.test.tsx src/store-kph-full-selection.test.tsx` | PASS2files/14tests sau sửa focus |
| `npm run check` | PASS tất cả workspace |
| `VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa` | PASS122precache |
| `VITE_STORE_APP_MOCK=false npm run build --workspace @coopfood-kph/store-pwa -- --outDir /tmp/date05-online-build` | PASS92precache; không ghi đè mock preview |
| `node e2e/scripts/check-kph-tap-regions.cjs` | PASS390×844,1440×1024,320×740 |
| `node e2e/scripts/check-date05-manual.cjs` | PASS390×844,1440×1024,320×740,844×390 |
| `npm run check:docs` và `git diff --check` | PASS |

KPH browser gate dùng native touchscreen.tap và CDP swipe trên mobile, mouse
trên desktop; tag/Duyệt/đệm dưới mở chi tiết, chọn/bỏ chọn đúng một lần, cả hai
chế độ vẫn swipe và focus bàn phím vẫn lộ dưới sticky bar. DATE browser gate
kiểm tra keyboard reveal, preview trước khi nhập SKU/tên/loại, đúng2options,
scan giữ draft, catalog scan, camera denied/recovery, lưu vào chi tiết,
13%/0%/100%, rule ngắn hạn/ngày sai và chữ200%; không pageerror.

Một lượt full suite chạy đồng thời nhiều browser vượt timeout5s ở3ca. Chạy lại
với2worker đạt311/311, giữ nguyên assertions và timeout. Lần đầu browser phát
hiện lỗi thật scanner landscape và focus làm hụt tap Chọn320; đã sửa và chạy
lại gate trên build cuối. [Kết quả browser](browser-results.json).
Log/screenshot tạm ở `/tmp/date05-store-tests.txt`, `/tmp/date05-ui-tests.txt`,
`/tmp/date05-kph-final-tests.txt`, `/tmp/date05-types.txt`, `/tmp/date05-build.txt`,
`/tmp/date05-online-build.txt`, `/tmp/date05-kph-tap/`, `/tmp/date05-manual/`.
Build vẫn có cảnh báo chunk>500kB đã tồn tại; vòng này không thêm dependency.

Backend/API/OpenAPI/upload không đổi từ KPH04 revision2. Tái sử dụng68backend
PostgreSQL tests, kiểm online bytes/reload và API evidence tại source
`889b3ffb0e4d55430160ac4d19b2ec8284abc7c6`,
[technical KPH04](../kph04-evidence-photos/technical.md). Đây không phải một lượt
backend test mới; phạm vi sửa chỉ UI/validation nhập DATE mock/tap/focus/layout.

## Giới hạn và thử nghiệm owner

DATE mới vẫn giữ trong phiên, reload mất; chưa API/persistence. Scanner browser
gate dùng media stream/BarcodeDetector tổng hợp và lỗi permission mô phỏng;
chưa xác minh camera/quyền OS trên thiết bị thật. Không suy nghiệm thu từ test.

Bước nhỏ tiếp: tại4398, tap tag/Duyệt/đệm dưới KPH để mở phiếu, vào Chọn và thử
cùng vùng; tại DATE mở+ rồi nhập NSX/HSD trước SKU/tên/loại, chọn loại và quét
để kiểm draft còn. Owner xem trước khi chốt hình ảnh/interaction.
